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