import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

// Models
import User from '../src/models/userModel.js';
import Course from '../src/models/courseModel.js';
import Lesson from '../src/models/lessonModel.js';
import Enrollment from '../src/models/enrollmentModel.js';
import Rating from '../src/models/ratingModel.js';
import Comment from '../src/models/commentModel.js';
import Progress from '../src/models/progressModel.js';
import Booking from '../src/models/bookingModel.js';

// Connect
await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ MongoDB connected');

// Read JSON files
const read = (file) => JSON.parse(readFileSync(join(__dirname, file), 'utf-8'));

const users = read('users.json');
const courses = read('courses.json');
const lessons = read('lessons.json');
const enrollments = read('enrollments.json');
const ratings = read('ratings.json');
const comments = read('comments.json');
const progress = read('progress.json');
const bookings = read('bookings.json');

// Import
const importData = async () => {
  try {
    console.log('👤  Importing users…');
    for (const u of users) {
      await User.create({ ...u });
    }

    console.log('📚  Importing courses…');

    await Course.insertMany(courses, { timestamps: false });

    console.log('🎓  Importing lessons…');
    await Lesson.insertMany(lessons);

    console.log('👥  Importing enrollments…');
    await Enrollment.insertMany(enrollments);

    console.log('⭐  Importing ratings…');
    await Rating.insertMany(ratings);

    console.log('💬  Importing comments…');
    await Comment.insertMany(comments);

    console.log('📊  Importing progress…');
    await Progress.insertMany(progress);

    console.log('💳  Importing bookings…');
    await Booking.insertMany(bookings);

    console.log('\n✅  All dev data imported successfully!\n');
    console.log('🔑  Login credentials (all users share the same password):');
    console.log('    Password: Test1234!\n');
    console.log('    admin@lumio.com    → Admin');
    console.log(
      '    ahmed@lumio.com    → Instructor (Node.js + Python courses)',
    );
    console.log(
      '    sara@lumio.com     → Instructor (React + React Native courses)',
    );
    console.log(
      '    omar@lumio.com     → Student (enrolled in Node.js + React)',
    );
    console.log(
      '    layla@lumio.com    → Student (enrolled in Node.js + React)',
    );
    console.log('    youssef@lumio.com  → Student (enrolled in Python)\n');
  } catch (err) {
    console.error('❌ Import failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

// Delete
const deleteData = async () => {
  try {
    console.log('🗑️   Deleting all collections…');
    await Promise.all([
      User.deleteMany(),
      Course.deleteMany(),
      Lesson.deleteMany(),
      Enrollment.deleteMany(),
      Rating.deleteMany(),
      Comment.deleteMany(),
      Progress.deleteMany(),
      Booking.deleteMany(),
    ]);
    console.log('✅  All collections cleared.\n');
  } catch (err) {
    console.error('❌ Delete failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

// CLI dispatch
if (process.argv[2] === '--import') {
  await importData();
} else if (process.argv[2] === '--delete') {
  await deleteData();
} else {
  console.log('Usage:');
  console.log('  node devData/importDevData.js --import');
  console.log('  node devData/importDevData.js --delete');
  process.exit(1);
}
