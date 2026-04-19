import { validationResult } from 'express-validator';
import AppError from '../utils/appError.js';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors
      .array()
      .map((e) => e.msg)
      .join('. ');
    return next(new AppError(messages, 400));
  }
  next();
};

export default validate;
