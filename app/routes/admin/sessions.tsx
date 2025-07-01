// / app/routes/admin/sessions.tsx
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