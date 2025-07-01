
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
