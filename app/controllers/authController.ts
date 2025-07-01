// app/controllers/authController.ts
import bcrypt from 'bcryptjs';
import { json } from '@remix-run/node';
import { UserModel } from '~/models/user';
import { createUserSession } from '~/utils/session.server';

export async function login(email: string, password: string) {
  const user = await UserModel.findOne({ email }).lean();
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Invalid credentials');
  }
  return createUserSession(user._id, '/dashboard');
}

export async function register(email: string, password: string, role: 'MENTEE' | 'MENTOR' | 'ADMIN') {
  if (!email || !password || !['MENTEE', 'MENTOR', 'ADMIN'].includes(role)) {
    throw new Error('Invalid input');
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await UserModel.create({ email, password: hashedPassword, role });
  return createUserSession(user._id, '/profile/edit');
}
