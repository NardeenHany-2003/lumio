import { body, query } from 'express-validator';
import { CATEGORIES, LEVELS } from '../models/courseModel.js';

export const createCourseValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Course title is required.')
    .isLength({ min: 5, max: 120 })
    .withMessage('Title must be between 5 and 120 characters.'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required.')
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters.'),

  body('summary')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Summary must be at most 300 characters.'),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required.')
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}.`),

  body('level')
    .optional()
    .isIn(LEVELS)
    .withMessage(`Level must be one of: ${LEVELS.join(', ')}.`),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number.'),

  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Tags must be an array with at most 10 items.'),

  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array.'),

  body('whatYouLearn')
    .optional()
    .isArray()
    .withMessage('What you learn must be an array.'),
];

export const updateCourseValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 120 })
    .withMessage('Title must be between 5 and 120 characters.'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters.'),

  body('summary')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Summary must be at most 300 characters.'),

  body('category')
    .optional()
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}.`),

  body('level')
    .optional()
    .isIn(LEVELS)
    .withMessage(`Level must be one of: ${LEVELS.join(', ')}.`),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number.'),
];

export const courseQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer.'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100.'),

  query('price[gte]')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price filter must be a non-negative number.'),

  query('price[lte]')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price filter must be a non-negative number.'),

  query('ratingsAverage[gte]')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating filter must be between 0 and 5.'),
];
