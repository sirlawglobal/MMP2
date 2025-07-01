
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