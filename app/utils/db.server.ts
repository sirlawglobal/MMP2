

// app/utils/db.server.ts
import mongoose from 'mongoose';

export async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mentorship', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as any);
  }
}
