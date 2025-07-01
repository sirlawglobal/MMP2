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
