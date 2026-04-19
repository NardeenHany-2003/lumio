import Stripe from 'stripe';
import Course from '../models/courseModel.js';
import Enrollment from '../models/enrollmentModel.js';
import Booking from '../models/bookingModel.js';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in your .env file.');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

//  GET CHECKOUT SESSION
export const getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the course
  const course = await Course.findById(req.params.courseId);
  if (!course) return next(new AppError('No course found with that ID.', 404));
  if (!course.isPublished)
    return next(new AppError('This course is not available yet.', 400));
  if (course.price === 0)
    return next(
      new AppError('This course is free — use the enroll button instead.', 400),
    );

  // 2) Prevent double-payment
  const alreadyEnrolled = await Enrollment.findOne({
    student: req.user.id,
    course: course._id,
  });
  if (alreadyEnrolled)
    return next(new AppError('You are already enrolled in this course.', 400));

  // 3) Create Stripe checkout session
  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    // After success, redirect to the course page
    success_url: `${req.protocol}://${req.get('host')}/courses/${course.slug}?enrolled=true`,
    cancel_url: `${req.protocol}://${req.get('host')}/courses/${course.slug}`,
    customer_email: req.user.email,
    client_reference_id: String(course._id),
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(course.price * 100), // Stripe uses cents
          product_data: {
            name: course.title,
            description: course.summary || course.description.slice(0, 255),
            // Only include image if it's not the placeholder
            ...(course.thumbnail !== 'default-course.jpg' && {
              images: [
                `${req.protocol}://${req.get('host')}/img/courses/${course.thumbnail}`,
              ],
            }),
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      courseId: String(course._id),
      userId: String(req.user.id),
    },
  });

  res.status(200).json({
    status: 'success',
    sessionId: session.id,
    sessionUrl: session.url,
  });
});

//  HELPER: create enrollment + booking record
const createEnrollmentAfterPayment = async (session) => {
  // Pull IDs from metadata (most reliable)
  const courseId = session.metadata?.courseId || session.client_reference_id;
  const userId = session.metadata?.userId;

  if (!courseId || !userId) {
    console.error(
      '[webhook] Missing courseId or userId in session metadata:',
      session.id,
    );
    return;
  }

  // Idempotency guard — skip if enrollment already exists
  const existing = await Enrollment.findOne({
    student: userId,
    course: courseId,
  });
  if (existing) {
    console.log(
      `[webhook] Enrollment already exists for user ${userId} / course ${courseId} — skipping.`,
    );
    return;
  }

  const course = await Course.findById(courseId);
  if (!course) {
    console.error('[webhook] Course not found:', courseId);
    return;
  }

  // Create enrollment
  await Enrollment.create({ student: userId, course: courseId });

  // Create booking record for audit trail
  await Booking.create({
    course: courseId,
    user:   userId,
    price:  session.amount_total / 100, // convert back from cents
    paid:   true,
  });

  console.log(
    `[webhook] Enrollment + booking created for user ${userId} / course "${course.title}"`,
  );
};

//  STRIPE WEBHOOK
export const webhookCheckout = async (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      req.body, 
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    await createEnrollmentAfterPayment(event.data.object);
  }

  res.status(200).json({ received: true });
};
