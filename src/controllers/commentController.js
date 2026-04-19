import Comment from '../models/commentModel.js';
import Lesson from '../models/lessonModel.js';
import Enrollment from '../models/enrollmentModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import * as factory from '../utils/handlerFactory.js';
import {
  setLessonFilter,
  checkCommentOwnership,
} from '../middleware/commentMiddleware.js';

// GET ALL COMMENTS FOR A LESSON — factory
export const getLessonComments = factory.getAll(Comment, 'comments');

// CREATE COMMENT
export const createComment = catchAsync(async (req, res, next) => {
  const lesson = await Lesson.findById(req.body.lesson);
  if (!lesson) return next(new AppError('No lesson found with that ID.', 404));

  if (req.user.role === 'student') {
    const isEnrolled = await Enrollment.findOne({
      student: req.user.id,
      course: lesson.course,
    });
    if (!isEnrolled) {
      return next(
        new AppError(
          'You must be enrolled in this course to leave a comment.',
          403,
        ),
      );
    }
  }

  const comment = await Comment.create({
    user: req.user.id,
    lesson: req.body.lesson,
    course: lesson.course,
    text: req.body.text,
  });

  res.status(201).json({ status: 'success', data: { comment } });
});

// UPDATE COMMENT
export const updateComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment)
    return next(new AppError('No comment found with that ID.', 404));
  if (
    comment.user._id.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(new AppError('You can only edit your own comments.', 403));
  }
  comment.text = req.body.text;
  comment.isEdited = true;
  await comment.save();
  res.status(200).json({ status: 'success', data: { comment } });
});

// DELETE COMMENT — factory
export const deleteComment = factory.deleteOne(Comment);
