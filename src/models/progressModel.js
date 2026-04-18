import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Progress must belong to a student.'],
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: [true, 'Progress must reference a lesson.'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Progress must reference a course.'],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
    watchedDuration: {
      type: Number, // seconds
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Unique: one progress record per student per lesson
progressSchema.index({ student: 1, lesson: 1 }, { unique: true });
progressSchema.index({ student: 1, course: 1 });

// Post-save: recalculate Enrollment.progressPercent
progressSchema.post('save', async function () {
  await recalcProgress(this.student, this.course);
});

progressSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) await recalcProgress(doc.student, doc.course);
});

const recalcProgress = async (studentId, courseId) => {
  const Lesson = mongoose.model('Lesson');
  const Enrollment = mongoose.model('Enrollment');

  const [totalLessons, completedLessons] = await Promise.all([
    Lesson.countDocuments({ course: courseId }),
    mongoose.model('Progress').countDocuments({
      student: studentId,
      course: courseId,
      isCompleted: true,
    }),
  ]);

  const percent =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  await Enrollment.findOneAndUpdate(
    { student: studentId, course: courseId },
    {
      progressPercent: percent,
      isCompleted: percent === 100,
      completedAt: percent === 100 ? new Date() : undefined,
    },
  );
};

const Progress = mongoose.model('Progress', progressSchema);
export default Progress;
