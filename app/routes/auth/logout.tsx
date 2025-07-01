// app/routes/auth/logout.tsx
import { ActionFunction } from '@remix-run/node';
import { logout } from '~/utils/session.server';

export const action: ActionFunction = async ({ request }) => {
  return await logout(request);
};

export default function Logout() {
  return null;
}