import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Comment must belong to a user.'],
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: [true, 'Comment must belong to a lesson.'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Comment must reference a course.'],
    },
    text: {
      type: String,
      required: [true, 'Comment text is required.'],
      trim: true,
      minlength: [2, 'Comment must be at least 2 characters.'],
      maxlength: [1000, 'Comment must be at most 1 000 characters.'],
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
commentSchema.index({ lesson: 1, createdAt: -1 });
commentSchema.index({ user: 1 });

// Populate user on every find
commentSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name photo' });
  next();
});

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
