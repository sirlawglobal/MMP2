


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