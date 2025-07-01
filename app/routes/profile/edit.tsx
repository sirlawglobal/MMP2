
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