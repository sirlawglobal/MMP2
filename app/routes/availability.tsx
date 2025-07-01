
// app/routes/availability.tsx
import { json } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { createAvailability, getAvailabilityByMentor } from '~/controllers/sessionController';
import { requireUserRole } from '~/utils/auth.server';

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUserRole(request, 'MENTOR');
  const availabilities = await getAvailabilityByMentor(user._id);
  return json({ user, availabilities });
};

export const action: ActionFunction = async ({ request }) => {
  const user = await requireUserRole(request, 'MENTOR');
  const form = await request.formData();
  const dayOfWeek = form.get('dayOfWeek') as string;
  const startTime = form.get('startTime') as string;
  const endTime = form.get('endTime') as string;
  
  try {
    await createAvailability(user._id, dayOfWeek, startTime, endTime);
    return json({ success: true });
  } catch (error: any) {
    return json({ error: error.message }, { status: 400 });
  }
};

export default function Availability() {
  const { user, availabilities } = useLoaderData<{ user: User; availabilities: Availability[] }>();
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="flex-1 p-6 ml-64">
        <h1 className="text-2xl mb-4">Set Availability</h1>
        <Form method="post" className="mb-6 bg-white p-4 rounded shadow">
          <div className="mb-4">
            <label className="block text-sm font-medium">Day of Week</label>
            <select name="dayOfWeek" className="border p-2 w-full rounded">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Start Time</label>
            <input type="time" name="startTime" className="border p-2 w-full rounded" required />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">End Time</label>
            <input type="time" name="endTime" className="border p-2 w-full rounded" required />
          </div>
          <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Add Availability</button>
        </Form>
        <ul className="space-y-4">
          {availabilities.map(avail => (
            <li key={avail._id} className="border p-4 rounded shadow">
              <p>{avail.dayOfWeek}: {avail.startTime} - {avail.endTime}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
