import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Booking must belong to a course.'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a user.'],
    },
    price: {
      type: Number,
      required: [true, 'Booking must have a price.'],
    },
    paid: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Populate user and course on find
bookingSchema.pre(/^find/, function (next) {
  this.populate('user', 'name email').populate('course', 'title slug');
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
