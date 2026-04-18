import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Enrollment must belong to a student.'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Enrollment must belong to a course.'],
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    isCompleted: {
      type: Boolean,
      default: false,
    },
    lastAccessedAt: Date,
    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Unique: one enrollment per student per course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({ course: 1 });

// Post-save: update course totalStudents
const updateStudentCount = async (courseId) => {
  const Course = mongoose.model('Course');
  const count = await mongoose
    .model('Enrollment')
    .countDocuments({ course: courseId });
  await Course.findByIdAndUpdate(courseId, { totalStudents: count });
};

enrollmentSchema.post('save', async function () {
  await updateStudentCount(this.course);
});

enrollmentSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) await updateStudentCount(doc.course);
});

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;
