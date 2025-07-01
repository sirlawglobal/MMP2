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

// app/controllers/mentorshipController.ts
import { MentorshipRequestModel, SessionModel, AvailabilityModel } from '~/models/user';

export async function createMentorshipRequest(menteeId: string, mentorId: string) {
  if (!menteeId || !mentorId) {
    throw new Error('Mentee and mentor IDs are required');
  }
  return MentorshipRequestModel.create({ menteeId, mentorId });
}

export async function getMentorsBySkills(skills: string[]) {
  return UserModel.find({ role: 'MENTOR', skills: { $in: skills } }).lean();
}

export async function getMentorshipRequestsByMentee(menteeId: string) {
  return MentorshipRequestModel.find({ menteeId }).lean();
}

export async function getMentorshipRequestsByMentor(mentorId: string) {
  return MentorshipRequestModel.find({ mentorId }).lean();
}

export async function updateMentorshipRequest(id: string, status: 'ACCEPTED' | 'REJECTED') {
  if (!['ACCEPTED', 'REJECTED'].includes(status)) {
    throw new Error('Invalid status');
  }
  return MentorshipRequestModel.findByIdAndUpdate(id, { $set: { status } }, { new: true }).lean();
}

export async function getAllMentorshipMatches() {
  return MentorshipRequestModel.find({ status: 'ACCEPTED' }).lean();
}

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

// app/utils/session.server.ts
import { createCookieSessionStorage, redirect } from '@remix-run/node';

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__session',
    secure: process.env.NODE_ENV === 'production',
    secrets: [process.env.SESSION_SECRET || 's3cr3t'],
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
});

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set('userId', userId);
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session),
    },
  });
}

export async function getUserId(request: Request) {
  const session = await sessionStorage.getSession(request.headers.get('Cookie'));
  return session.get('userId');
}

export async function logout(request: Request) {
  const session = await sessionStorage.getSession(request.headers.get('Cookie'));
  return redirect('/login', {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  });
}

// app/utils/auth.server.ts
import { redirect } from '@remix-run/node';
import { getUserId } from './session.server';
import { getUserById } from '~/controllers/userController';

export async function requireUserRole(request: Request, role: string | string[]) {
  const userId = await getUserId(request);
  if (!userId) throw redirect('/login');
  
  const user = await getUserById(userId);
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role)) throw new Response('Unauthorized', { status: 403 });
  return user;
}

// app/components/Sidebar.tsx
import { Link, useLocation } from '@remix-run/react';
import type { User } from '~/models/user';

export default function Sidebar({ user }: { user: User }) {
  const location = useLocation();
  const links = user.role === 'ADMIN' ? [
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/matches', label: 'Matches' },
    { to: '/admin/sessions', label: 'Sessions' },
  ] : user.role === 'MENTOR' ? [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/availability', label: 'Availability' },
    { to: '/requests', label: 'Requests' },
    { to: '/sessions', label: 'Sessions' },
  ] : [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/mentors', label: 'Mentors' },
    { to: '/my-requests', label: 'My Requests' },
    { to: '/my-sessions', label: 'My Sessions' },
  ];

  return (
    <nav className="w-64 bg-gray-100 h-screen p-4 fixed">
      <ul>
        {links.map(link => (
          <li key={link.to}>
            <Link
              to={link.to}
              className={`block p-2 rounded ${location.pathname === link.to ? 'bg-blue-500 text-white' : 'text-blue-500 hover:bg-blue-100'}`}
            >
              {link.label}
            </Link>
          </li>
        ))}
        <li>
          <Link to="/auth/logout" className="block p-2 text-red-500 hover:bg-red-100">Logout</Link>
        </li>
      </ul>
    </nav>
  );
}

// app/routes/auth/register.tsx
import { json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import type { ActionFunction } from '@remix-run/node';
import { register } from '~/controllers/authController';
import { requireUserRole } from '~/utils/auth.server';

export const action: ActionFunction = async ({ request }) => {
  await requireUserRole(request, 'ADMIN');
  const form = await request.formData();
  const email = form.get('email') as string;
  const password = form.get('password') as string;
  const role = form.get('role') as 'MENTEE' | 'MENTOR' | 'ADMIN';
  
  try {
    return await register(email, password, role);
  } catch (error: any) {
    return json({ error: error.message }, { status: 400 });
  }
};

export default function Register() {
  const actionData = useActionData<{ error?: string }>();
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Form method="post" className="max-w-md w-full p-6 bg-white rounded shadow">
        <h2 className="text-2xl mb-4">Register</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium">Email</label>
          <input type="email" name="email" className="border p-2 w-full rounded" required />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Password</label>
          <input type="password" name="password" className="border p-2 w-full rounded" required />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Role</label>
          <select name="role" className="border p-2 w-full rounded">
            <option value="MENTEE">Mentee</option>
            <option value="MENTOR">Mentor</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        {actionData?.error && <p className="text-red-500 text-sm">{actionData.error}</p>}
        <button type="submit" className="bg-blue-500 text-white p-2 w-full rounded hover:bg-blue-600">Register</button>
      </Form>
    </div>
  );
}

// app/routes/auth/login.tsx
import { json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import type { ActionFunction } from '@remix-run/node';
import { login } from '~/controllers/authController';

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const email = form.get('email') as string;
  const password = form.get('password') as string;
  
  try {
    return await login(email, password);
  } catch (error: any) {
    return json({ error: error.message }, { status: 400 });
  }
};

export default function Login() {
  const actionData = useActionData<{ error?: string }>();
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Form method="post" className="max-w-md w-full p-6 bg-white rounded shadow">
        <h2 className="text-2xl mb-4">Login</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium">Email</label>
          <input type="email" name="email" className="border p-2 w-full rounded" required />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Password</label>
          <input type="password" name="password" className="border p-2 w-full rounded" required />
        </div>
        {actionData?.error && <p className="text-red-500 text-sm">{actionData.error}</p>}
        <button type="submit" className="bg-blue-500 text-white p-2 w-full rounded hover:bg-blue-600">Login</button>
      </Form>
    </div>
  );
}

// app/routes/auth/logout.tsx
import { ActionFunction } from '@remix-run/node';
import { logout } from '~/utils/session.server';

export const action: ActionFunction = async ({ request }) => {
  return await logout(request);
};

export default function Logout() {
  return null;
}

// app/routes/profile/edit.tsx
import { json, redirect } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { updateUserProfile, getUserById } from '~/controllers/userController';
import { requireUserRole } from '~/utils/auth.server';

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUserRole(request, ['MENTEE', 'MENTOR', 'ADMIN']);
  return json({ user });
};

export const action: ActionFunction = async ({ request }) => {
  const user = await requireUserRole(request, ['MENTEE', 'MENTOR', 'ADMIN']);
  const form = await request.formData();
  const name = form.get('name') as string;
  const bio = form.get('bio') as string;
  const skills = form.getAll('skills') as string[];
  const goals = form.getAll('goals') as string[];
  
  try {
    await updateUserProfile(user._id, { name, bio, skills, goals });
    return redirect('/dashboard');
  } catch (error: any) {
    return json({ error: error.message }, { status: 400 });
  }
};

export default function EditProfile() {
  const { user } = useLoaderData<{ user: User }>();
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Form method="post" className="max-w-md w-full p-6 bg-white rounded shadow">
        <h2 className="text-2xl mb-4">Edit Profile</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium">Name</label>
          <input type="text" name="name" defaultValue={user.name} className="border p-2 w-full rounded" required />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Bio</label>
          <textarea name="bio" defaultValue={user.bio} className="border p-2 w-full rounded" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Skills</label>
          <select name="skills" multiple className="border p-2 w-full rounded">
            <option value="Marketing">Marketing</option>
            <option value="UI/UX">UI/UX</option>
            <option value="Development">Development</option>
            <option value="Finance">Finance</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium">Goals</label>
          <select name="goals" multiple className="border p-2 w-full rounded">
            <option value="Improve product design">Improve product design</option>
            <option value="Grow business">Grow business</option>
            <option value="Learn coding">Learn coding</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-500 text-white p-2 w-full rounded hover:bg-blue-600">Save Profile</button>
      </Form>
    </div>
  );
}

// app/routes/dashboard/index.tsx
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import type { LoaderFunction } from '@remix-run/node';
import Sidebar from '~/components/Sidebar';
import { requireUserRole } from '~/utils/auth.server';

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUserRole(request, ['MENTEE', 'MENTOR', 'ADMIN']);
  return json({ user });
};

export default function Dashboard() {
  const { user } = useLoaderData<{ user: User }>();
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="flex-1 p-6 ml-64">
        <h1 className="text-2xl mb-4">Welcome, {user.name}</h1>
        <p className="text-gray-600">Role: {user.role}</p>
        <div className="mt-4">
          <p>Bio: {user.bio || 'Not set'}</p>
          <p>Skills: {user.skills.join(', ') || 'None'}</p>
          <p>Goals: {user.goals.join(', ') || 'None'}</p>
        </div>
      </div>
    </div>
  );
}

// app/routes/mentors.tsx
import { json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { getMentorsBySkills, createMentorshipRequest } from '~/controllers/mentorshipController';
import { requireUserRole } from '~/utils/auth.server';

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUserRole(request, 'MENTEE');
  const url = new URL(request.url);
  const skills = url.searchParams.getAll('skills');
  const mentors = await getMentorsBySkills(skills);
  return json({ mentors, user });
};

export const action: ActionFunction = async ({ request }) => {
  const user = await requireUserRole(request, 'MENTEE');
  const form = await request.formData();
  const mentorId = form.get('mentorId') as string;
  
  try {
    await createMentorshipRequest(user._id, mentorId);
    return json({ success: true });
  } catch (error: any) {
    return json({ error: error.message }, { status: 400 });
  }
};

export default function Mentors() {
  const { mentors, user } = useLoaderData<{ mentors: User[]; user: User }>();
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="flex-1 p-6 ml-64">
        <h1 className="text-2xl mb-4">Find Mentors</h1>
        <Form method="get" className="mb-6">
          <label className="block text-sm font-medium mb-2">Filter by Skills</label>
          <select name="skills" multiple className="border p-2 w-full rounded mb-2">
            <option value="Marketing">Marketing</option>
            <option value="UI/UX">UI/UX</option>
            <option value="Development">Development</option>
            <option value="Finance">Finance</option>
          </select>
          <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Filter</button>
        </Form>
        <ul className="space-y-4">
          {mentors.map(mentor => (
            <li key={mentor._id} className="border p-4 rounded shadow">
              <h2 className="text-xl">{mentor.name}</h2>
              <p className="text-gray-600">{mentor.bio}</p>
              <p className="text-sm">Skills: {mentor.skills.join(', ')}</p>
              <Form method="post">
                <input type="hidden" name="mentorId" value={mentor._id} />
                <button type="submit" className="bg-green-500 text-white p-2 mt-2 rounded hover:bg-green-600">Request Mentorship</button>
              </Form>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// app/routes/requests.tsx
import { json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { getMentorshipRequestsByMentee, getMentorshipRequestsByMentor, updateMentorshipRequest } from '~/controllers/mentorshipController';
import { requireUserRole } from '~/utils/auth.server';

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUserRole(request, ['MENTEE', 'MENTOR']);
  const requests = user.role === 'MENTEE'
    ? await getMentorshipRequestsByMentee(user._id)
    : await getMentorshipRequestsByMentor(user._id);
  return json({ user, requests });
};

export const action: ActionFunction = async ({ request }) => {
  const user = await requireUserRole(request, 'MENTOR');
  const form = await request.formData();
  const requestId = form.get('requestId') as string;
  const status = form.get('status') as 'ACCEPTED' | 'REJECTED';
  
  try {
    await updateMentorshipRequest(requestId, status);
    return json({ success: true });
  } catch (error: any) {
    return json({ error: error.message }, { status: 400 });
  }
};

export default function Requests() {
  const { user, requests } = useLoaderData<{ user: User; requests: MentorshipRequest[] }>();
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="flex-1 p-6 ml-64">
        <h1 className="text-2xl mb-4">{user.role === 'MENTEE' ? 'My Requests' : 'Received Requests'}</h1>
        <ul className="space-y-4">
          {requests.map(req => (
            <li key={req._id} className="border p-4 rounded shadow">
              <p className="text-sm">Status: {req.status}</p>
              <p className="text-sm">Created: {new Date(req.createdAt).toLocaleDateString()}</p>
              {user.role === 'MENTOR' && req.status === 'PENDING' && (
                <div className="mt-2 flex space-x-2">
                  <Form method="post" className="inline-block">
                    <input type="hidden" name="requestId" value={req._id} />
                    <input type="hidden" name="status" value="ACCEPTED" />
                    <button type="submit" className="bg-green-500 text-white p-2 rounded hover:bg-green-600">Accept</button>
                  </Form>
                  <Form method="post" className="inline-block">
                    <input type="hidden" name="requestId" value={req._id} />
                    <input type="hidden" name="status" value="REJECTED" />
                    <button type="submit" className="bg-red-500 text-white p-2 rounded hover:bg-red-600">Reject</button>
                  </Form>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// app/routes/sessions.tsx
import { json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { createSession, getSessionsByMentee, getSessionsByMentor, submitSessionFeedback } from '~/controllers/sessionController';
import { requireUserRole } from '~/utils/auth.server';

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUserRole(request, ['MENTEE', 'MENTOR']);
  const sessions = user.role === 'MENTEE'
    ? await getSessionsByMentee(user._id)
    : await getSessionsByMentor(user._id);
  return json({ user, sessions });
};

export const action: ActionFunction = async ({ request }) => {
  const user = await requireUserRole(request, ['MENTEE', 'MENTOR']);
  const form = await request.formData();
  try {
    if (form.get('action') === 'create') {
      const mentorId = form.get('mentorId') as string;
      const startTime = new Date(form.get('startTime') as string);
      const endTime = new Date(form.get('endTime') as string);
      await createSession(mentorId, user._id, startTime, endTime);
    } else if (form.get('action') === 'feedback') {
      const sessionId = form.get('sessionId') as string;
      const rating = parseInt(form.get('rating') as string);
      const comment = form.get('comment') as string;
      await submitSessionFeedback(sessionId, rating, comment);
    }
    return json({ success: true });
  } catch (error: any) {
    return json({ error: error.message }, { status: 400 });
  }
};

export default function Sessions() {
  const { user, sessions } = useLoaderData<{ user: User; sessions: Session[] }>();
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="flex-1 p-6 ml-64">
        <h1 className="text-2xl mb-4">{user.role === 'MENTEE' ? 'My Sessions' : 'Mentor Sessions'}</h1>
        {user.role === 'MENTEE' && (
          <Form method="post" className="mb-6 bg-white p-4 rounded shadow">
            <input type="hidden" name="action" value="create" />
            <div className="mb-4">
              <label className="block text-sm font-medium">Mentor ID</label>
              <input type="text" name="mentorId" className="border p-2 w-full rounded" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Start Time</label>
              <input type="datetime-local" name="startTime" className="border p-2 w-full rounded" required />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">End Time</label>
              <input type="datetime-local" name="endTime" className="border p-2 w-full rounded" required />
            </div>
            <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Book Session</button>
          </Form>
        )}
        <ul className="space-y-4">
          {sessions.map(session => (
            <li key={session._id} className="border p-4 rounded shadow">
              <p className="text-sm">Start: {new Date(session.startTime).toLocaleString()}</p>
              <p className="text-sm">End: {new Date(session.endTime).toLocaleString()}</p>
              {session.feedback && (
                <p className="text-sm">Feedback: {session.feedback.rating} stars - {session.feedback.comment}</p>
              )}
              {user.role === 'MENTEE' && !session.feedback && (
                <Form method="post" className="mt-2">
                  <input type="hidden" name="action" value="feedback" />
                  <input type="hidden" name="sessionId" value={session._id} />
                  <div className="mb-2">
                    <label className="block text-sm font-medium">Rating</label>
                    <select name="rating" className="border p-2 w-full rounded">
                      {[1, 2, 3, 4, 5].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-2">
                    <label className="block text-sm font-medium">Comment</label>
                    <textarea name="comment" className="border p-2 w-full rounded" />
                  </div>
                  <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Submit Feedback</button>
                </Form>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// app/routes/availability.tsx
import { json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { createAvailability, getAvailabilityByMentor } from '~/controllers/sessionController';
import { requireUserRole } from '~/utils/auth.server';

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUserRole(request, 'MENTOR');
  const availabilities = await getAvailabilityByMentor(user._id);
  return json({ user, availabilities });
};

export const action: ActionFunction = async ({ request }) => {
  const user = await requireUserRole(request, 'MENTOR');
  const form = await request.formData();
  const dayOfWeek = form.get('dayOfWeek') as string;
  const startTime = form.get('startTime') as string;
  const endTime = form.get('endTime') as string;
  
  try {
    await createAvailability(user._id, dayOfWeek, startTime, endTime);
    return json({ success: true });
  } catch (error: any) {
    return json({ error: error.message }, { status: 400 });
  }
};

export default function Availability() {
  const { user, availabilities } = useLoaderData<{ user: User; availabilities: Availability[] }>();
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="flex-1 p-6 ml-64">
        <h1 className="text-2xl mb-4">Set Availability</h1>
        <Form method="post" className="mb-6 bg-white p-4 rounded shadow">
          <div className="mb-4">
            <label className="block text-sm font-medium">Day of Week</label>
            <select name="dayOfWeek" className="border p-2 w-full rounded">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Start Time</label>
            <input type="time" name="startTime" className="border p-2 w-full rounded" required />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">End Time</label>
            <input type="time" name="endTime" className="border p-2 w-full rounded" required />
          </div>
          <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Add Availability</button>
        </Form>
        <ul className="space-y-4">
          {availabilities.map(avail => (
            <li key={avail._id} className="border p-4 rounded shadow">
              <p>{avail.dayOfWeek}: {avail.startTime} - {avail.endTime}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// app/routes/admin/users.tsx
import { json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { getAllUsers, updateUserRole } from '~/controllers/userController';
import { requireUserRole } from '~/utils/auth.server';

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUserRole(request, 'ADMIN');
  const users = await getAllUsers();
  return json({ user, users });
};

export const action: ActionFunction = async ({ request }) => {
  await requireUserRole(request, 'ADMIN');
  const form = await request.formData();
  const userId = form.get('userId') as string;
  const role = form.get('role') as 'ADMIN' | 'MENTOR' | 'MENTEE';
  
  try {
    await updateUserRole(userId, role);
    return json({ success: true });
  } catch (error: any) {
    return json({ error: error.message }, { status: 400 });
  }
};

export default function AdminUsers() {
  const { user, users } = useLoaderData<{ user: User; users: User[] }>();
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="flex-1 p-6 ml-64">
        <h1 className="text-2xl mb-4">Manage Users</h1>
        <ul className="space-y-4">
          {users.map(u => (
            <li key={u._id} className="border p-4 rounded shadow">
              <p className="text-sm">{u.name} ({u.email})</p>
              <Form method="post" className="mt-2">
                <input type="hidden" name="userId" value={u._id} />
                <select name="role" defaultValue={u.role} className="border p-2 rounded mr-2">
                  <option value="ADMIN">Admin</option>
                  <option value="MENTOR">Mentor</option>
                  <option value="MENTEE">Mentee</option>
                </select>
                <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Update Role</button>
              </Form>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// app/routes/admin/matches.tsx
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import type { LoaderFunction } from '@remix-run/node';
import { getAllMentorshipMatches } from '~/controllers/mentorshipController';
import { requireUserRole } from '~/utils/auth.server';

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUserRole(request, 'ADMIN');
  const matches = await getAllMentorshipMatches();
  return json({ user, matches });
};

export default function AdminMatches() {
  const { user, matches } = useLoaderData<{ user: User; matches: MentorshipRequest[] }>();
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="flex-1 p-6 ml-64">
        <h1 className="text-2xl mb-4">Mentorship Matches</h1>
        <ul className="space-y-4">
          {matches.map(match => (
            <li key={match._id} className="border p-4 rounded shadow">
              <p className="text-sm">Mentee ID: {match.menteeId}</p>
              <p className="text-sm">Mentor ID: {match.mentorId}</p>
              <p className="text-sm">Status: {match.status}</p>
              <p className="text-sm">Created: {new Date(match.createdAt).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// app/routes/admin/sessions.tsx
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import type { LoaderFunction } from '@remix-run/node';
import { getAllSessions } from '~/controllers/sessionController';
import { requireUserRole } from '~/utils/auth.server';

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUserRole(request, 'ADMIN');
  const sessions = await getAllSessions();
  return json({ user, sessions });
};

export default function AdminSessions() {
  const { user, sessions } = useLoaderData<{ user: User; sessions: Session[] }>();
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="flex-1 p-6 ml-64">
        <h1 className="text-2xl mb-4">All Sessions</h1>
        <ul className="space-y-4">
          {sessions.map(session => (
            <li key={session._id} className="border p-4 rounded shadow">
              <p className="text-sm">Mentee ID: {session.menteeId}</p>
              <p className="text-sm">Mentor ID: {session.mentorId}</p>
              <p className="text-sm">Start: {new Date(session.startTime).toLocaleString()}</p>
              <p className="text-sm">End: {new Date(session.endTime).toLocaleString()}</p>
              {session.feedback && (
                <p className="text-sm">Feedback: {session.feedback.rating} stars - {session.feedback.comment}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// app/routes/my-requests.tsx
import { redirect } from '@remix-run/node';
import type { LoaderFunction } from '@remix-run/node';

export const loader: LoaderFunction = async ({ request }) => {
  return redirect('/requests');
};

// app/routes/my-sessions.tsx
import { redirect } from '@remix-run/node';
import type { LoaderFunction } from '@remix-run/node';

export const loader: LoaderFunction = async ({ request }) => {
  return redirect('/sessions');
};

// app/root.tsx
import { Links, LiveReload, Meta, Outlet, Scripts } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => [
  { title: 'Mentorship Matching Platform' },
  { name: 'description', content: 'A platform to connect mentors and mentees.' },
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-gray-100">
        <Outlet />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

// package.json
{
  "name": "mentorship-platform",
  "private": true,
  "scripts": {
    "dev": "remix dev",
    "build": "remix build",
    "start": "remix-serve build"
  },
  "dependencies": {
    "@remix-run/node": "^2.0.0",
    "@remix-run/react": "^2.0.0",
    "@remix-run/serve": "^2.0.0",
    "bcryptjs": "^2.4.3",
    "mongoose": "^7.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.2",
    "@types/node": "^18.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0"
  }
}

// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "~/*": ["app/*"]
    }
  },
  "include": ["app/**/*"],
  "exclude": ["node_modules", "build"]
}