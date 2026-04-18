import mongoose from 'mongoose';
import slugify from 'slugify';

export const CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Data Science & ML',
  'DevOps & Cloud',
  'Cybersecurity',
  'Game Development',
  'Software Engineering',
  'AI & Machine Learning',
  'Blockchain',
  'Database',
  'Programming Languages',
  'Other',
];

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required.'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters.'],
      maxlength: [120, 'Title must be at most 120 characters.'],
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Course description is required.'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters.'],
      maxlength: [2000, 'Description must be at most 2000 characters.'],
    },
    summary: {
      type: String,
      trim: true,
      maxlength: [300, 'Summary must be at most 300 characters.'],
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Course must belong to an instructor.'],
    },
    category: {
      type: String,
      required: [true, 'Category is required.'],
      enum: {
        values: CATEGORIES,
        message: `Category must be one of: ${CATEGORIES.join(', ')}`,
      },
    },
    level: {
      type: String,
      required: [true, 'Level is required.'],
      enum: {
        values: LEVELS,
        message: `Level must be one of: ${LEVELS.join(', ')}`,
      },
      default: 'All Levels',
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative.'],
    },
    thumbnail: {
      type: String,
      default: 'default-course.jpg',
    },
    tags: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: 'Course can have at most 10 tags.',
      },
    },
    requirements: [String],
    whatYouLearn: [String],
    // Aggregated stats (updated via Rating model hooks)
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be ≥ 0.'],
      max: [5, 'Rating must be ≤ 5.'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    totalLessons: {
      type: Number,
      default: 0,
    },
    totalDuration: {
      type: Number, // minutes
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
courseSchema.index({ slug: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ ratingsAverage: -1 });
courseSchema.index({ price: 1 });
courseSchema.index({ isPublished: 1 });

// Text index for search
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual: lessons (not stored, populated on demand)
courseSchema.virtual('lessons', {
  ref: 'Lesson',
  foreignField: 'course',
  localField: '_id',
});

// Pre-save: generate slug
courseSchema.pre('save', function (next) {
  if (!this.isModified('title')) return next();
  this.slug = slugify(this.title, { lower: true, strict: true });
  next();
});

// Pre-save: set publishedAt
courseSchema.pre('save', function (next) {
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Query: always populate instructor name/photo
courseSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'instructor',
    select: 'name photo bio',
  });
  next();
});

const Course = mongoose.model('Course', courseSchema);
export default Course;
