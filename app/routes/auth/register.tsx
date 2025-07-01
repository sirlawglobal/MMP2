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