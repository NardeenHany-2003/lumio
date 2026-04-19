import { body } from 'express-validator';

// Lesson
export const createLessonValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Lesson title is required.')
    .isLength({ min: 3, max: 150 })
    .withMessage('Title must be between 3 and 150 characters.'),

  body('course')
    .notEmpty()
    .withMessage('Course ID is required.')
    .isMongoId()
    .withMessage('Invalid Course ID format.'),

  body('content')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Content must be at most 10 000 characters.'),

  body('videoPath')
    .optional()
    .trim()
    .isURL().withMessage('Video path must be a valid path.'),

  body('duration')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Duration must be a non-negative number.'),

  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer.'),

  body('isFree')
    .optional()
    .isBoolean()
    .withMessage('isFree must be a boolean.'),
];

export const updateLessonValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage('Title must be between 3 and 150 characters.'),

  body('content')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Content must be at most 10 000 characters.'),

  body('videoPath')
    .optional()
    .trim()
    .isURL()
    .withMessage('Video path must be a valid path.'),

  body('duration')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Duration must be a non-negative number.'),

  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer.'),
];

// Comment
export const createCommentValidator = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required.')
    .isLength({ min: 2, max: 1000 })
    .withMessage('Comment must be between 2 and 1000 characters.'),

  body('lesson')
    .notEmpty()
    .withMessage('Lesson ID is required.')
    .isMongoId()
    .withMessage('Invalid Lesson ID format.'),
];

export const updateCommentValidator = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required.')
    .isLength({ min: 2, max: 1000 })
    .withMessage('Comment must be between 2 and 1000 characters.'),
];

// Rating
export const createRatingValidator = [
  body('rating')
    .notEmpty()
    .withMessage('Rating value is required.')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5.'),

  body('review')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Review must be at most 1 000 characters.'),
];

export const updateRatingValidator = [
  body('rating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5.'),

  body('review')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Review must be at most 1 000 characters.'),
];

// Progress
export const updateProgressValidator = [
  body('isCompleted')
    .optional()
    .isBoolean()
    .withMessage('isCompleted must be a boolean.'),

  body('watchedDuration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('watchedDuration must be a non-negative integer (seconds).'),
];
