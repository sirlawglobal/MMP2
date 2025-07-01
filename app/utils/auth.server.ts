// app/utils/auth.server.ts
import { redirect } from '@remix-run/node';
import { getUserId } from './session.server';
import { getUserById } from '~/controllers/userController';

export async function requireUserRole(request: Request, role: string | string[]) {
  const userId = await getUserId(request);
  if (!userId) throw redirect('/login');
  
  const user = await getUserById(userId);
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role)) throw new Response('Unauthorized', { status: 403 });
  return user;
}
