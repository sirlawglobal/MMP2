// app/models/user.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface User extends Document {
  _id: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'MENTOR' | 'MENTEE';
  name: string;
  bio: string;
  skills: string[];
  goals: string[];
}

export interface MentorshipRequest extends Document {
  _id: string;
  menteeId: string;
  mentorId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: Date;
}

export interface Session extends Document {
  _id: string;
  mentorId: string;
  menteeId: string;
  startTime: Date;
  endTime: Date;
  feedback?: {
    rating: number;
    comment: string;
  };
}

export interface Availability extends Document {
  _id: string;
  mentorId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

const userSchema = new Schema<User>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'MENTOR', 'MENTEE'], required: true },
  name: { type: String },
  bio: { type: String },
  skills: { type: [String], default: [] },
  goals: { type: [String], default: [] },
});

const mentorshipRequestSchema = new Schema<MentorshipRequest>({
  menteeId: { type: String, required: true },
  mentorId: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' },
  createdAt: { type: Date, default: Date.now },
});

const sessionSchema = new Schema<Session>({
  mentorId: { type: String, required: true },
  menteeId: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
  },
});

const availabilitySchema = new Schema<Availability>({
  mentorId: { type: String, required: true },
  dayOfWeek: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
});

export const UserModel = mongoose.model<User>('User', userSchema);
export const MentorshipRequestModel = mongoose.model<MentorshipRequest>('MentorshipRequest', mentorshipRequestSchema);
export const SessionModel = mongoose.model<Session>('Session', sessionSchema);
export const AvailabilityModel = mongoose.model<Availability>('Availability', availabilitySchema);
