
// app/controllers/userController.ts
import { UserModel, MentorshipRequestModel, SessionModel, AvailabilityModel } from '~/models/user';

export async function getUserById(id: string) {
  const user = await UserModel.findById(id).lean();
  if (!user) throw new Error('User not found');
  return user;
}

export async function getUserByEmail(email: string) {
  const user = await UserModel.findOne({ email }).lean();
  if (!user) throw new Error('User not found');
  return user;
}

export async function updateUserProfile(id: string, data: Partial<User>) {
  if (!data.name || data.name.length < 2) {
    throw new Error('Name must be at least 2 characters');
  }
  return UserModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
}

export async function getAllUsers() {
  return UserModel.find().lean();
}

export async function updateUserRole(id: string, role: 'ADMIN' | 'MENTOR' | 'MENTEE') {
  if (!['ADMIN', 'MENTOR', 'MENTEE'].includes(role)) {
    throw new Error('Invalid role');
  }
  return UserModel.findByIdAndUpdate(id, { $set: { role } }, { new: true }).lean();
}