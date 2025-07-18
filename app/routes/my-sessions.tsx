// / app/routes/my-sessions.tsx
import { redirect } from '@remix-run/node';
import type { LoaderFunction } from '@remix-run/node';

export const loader: LoaderFunction = async ({ request }) => {
  return redirect('/sessions');
};