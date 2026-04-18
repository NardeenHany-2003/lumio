import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Rating must belong to a user.'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Rating must belong to a course.'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating value is required.'],
      min: [1, 'Rating must be at least 1.'],
      max: [5, 'Rating must be at most 5.'],
    },
    review: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review must be at most 1 000 characters.'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Unique: one rating per user per course
ratingSchema.index({ user: 1, course: 1 }, { unique: true });
ratingSchema.index({ course: 1 });

// Populate user on find
ratingSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name photo' });
  next();
});

// Static: recalculate course ratings
ratingSchema.statics.calcAverageRatings = async function (courseId) {
  const stats = await this.aggregate([
    { $match: { course: courseId } },
    {
      $group: {
        _id: '$course',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  const Course = mongoose.model('Course');
  if (stats.length > 0) {
    await Course.findByIdAndUpdate(courseId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Course.findByIdAndUpdate(courseId, {
      ratingsQuantity: 0,
      ratingsAverage: 0,
    });
  }
};

ratingSchema.post('save', async function () {
  await this.constructor.calcAverageRatings(this.course);
});

ratingSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) await doc.constructor.calcAverageRatings(doc.course);
});

const Rating = mongoose.model('Rating', ratingSchema);
export default Rating;
