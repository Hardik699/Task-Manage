import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fintask';

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ MongoDB connected successfully');
    return true;
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    const message = error instanceof Error ? error.message : String(error);

    if (isDev) {
      console.warn('⚠️  MongoDB connection failed in development:', message);
      console.warn('   Database features will be unavailable.');
      return false;
    } else {
      console.error('✗ MongoDB connection error:', error);
      process.exit(1);
    }
  }
}

export default mongoose;
