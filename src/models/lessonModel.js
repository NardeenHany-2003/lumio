import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: {
      type: String,
      enum: ['pdf', 'link', 'code', 'other'],
      default: 'link',
    },
  },
  { _id: false },
);

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Lesson title is required.'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters.'],
      maxlength: [150, 'Title must be at most 150 characters.'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Lesson must belong to a course.'],
    },
    content: {
      type: String,
      trim: true,
      maxlength: [10000, 'Content must be at most 10 000 characters.'],
    },
    videoPath: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number, // minutes
      default: 0,
      min: [0, 'Duration cannot be negative.'],
    },
    order: {
      type: Number,
      default: 0,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    resources: [resourceSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
lessonSchema.index({ course: 1, order: 1 });

// Post-save: update course totalLessons & totalDuration
const updateCourseStats = async (courseId) => {
  const Course = mongoose.model('Course');
  const stats = await mongoose.model('Lesson').aggregate([
    { $match: { course: courseId } },
    {
      $group: {
        _id: '$course',
        totalLessons: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Course.findByIdAndUpdate(courseId, {
      totalLessons: stats[0].totalLessons,
      totalDuration: stats[0].totalDuration,
    });
  } else {
    await Course.findByIdAndUpdate(courseId, {
      totalLessons: 0,
      totalDuration: 0,
    });
  }
};

lessonSchema.post('save', async function () {
  await updateCourseStats(this.course);
});

lessonSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) await updateCourseStats(doc.course);
});

const Lesson = mongoose.model('Lesson', lessonSchema);
export default Lesson;
