

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
