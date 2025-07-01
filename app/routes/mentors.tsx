

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