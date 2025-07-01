

// app/controllers/sessionController.ts
import { SessionModel, AvailabilityModel } from '~/models/user';

export async function createSession(mentorId: string, menteeId: string, startTime: Date, endTime: Date) {
  if (!mentorId || !menteeId || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    throw new Error('Invalid input');
  }
  // Validate availability (simplified; enhance with actual availability check)
  const availability = await AvailabilityModel.findOne({ mentorId });
  if (!availability) {
    throw new Error('Mentor has no availability set');
  }
  return SessionModel.create({ mentorId, menteeId, startTime, endTime });
}

export async function getSessionsByMentor(mentorId: string) {
  return SessionModel.find({ mentorId }).lean();
}

export async function getSessionsByMentee(menteeId: string) {
  return SessionModel.find({ menteeId }).lean();
}

export async function submitSessionFeedback(id: string, rating: number, comment: string) {
  if (isNaN(rating) || rating < 1 || rating > 5) {
    throw new Error('Invalid rating');
  }
  return SessionModel.findByIdAndUpdate(id, { $set: { feedback: { rating, comment } } }, { new: true }).lean();
}

export async function getAllSessions() {
  return SessionModel.find().lean();
}

export async function createAvailability(mentorId: string, dayOfWeek: string, startTime: string, endTime: string) {
  if (!dayOfWeek || !startTime || !endTime) {
    throw new Error('All fields are required');
  }
  return AvailabilityModel.create({ mentorId, dayOfWeek, startTime, endTime });
}

export async function getAvailabilityByMentor(mentorId: string) {
  return AvailabilityModel.find({ mentorId }).lean();
}
