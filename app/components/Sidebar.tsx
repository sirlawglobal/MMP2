// app/components/Sidebar.tsx
import { Link, useLocation } from '@remix-run/react';
import type { User } from '~/models/user';

export default function Sidebar({ user }: { user: User }) {
  const location = useLocation();
  const links = user.role === 'ADMIN' ? [
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/matches', label: 'Matches' },
    { to: '/admin/sessions', label: 'Sessions' },
  ] : user.role === 'MENTOR' ? [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/availability', label: 'Availability' },
    { to: '/requests', label: 'Requests' },
    { to: '/sessions', label: 'Sessions' },
  ] : [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/mentors', label: 'Mentors' },
    { to: '/my-requests', label: 'My Requests' },
    { to: '/my-sessions', label: 'My Sessions' },
  ];

  return (
    <nav className="w-64 bg-gray-100 h-screen p-4 fixed">
      <ul>
        {links.map(link => (
          <li key={link.to}>
            <Link
              to={link.to}
              className={`block p-2 rounded ${location.pathname === link.to ? 'bg-blue-500 text-white' : 'text-blue-500 hover:bg-blue-100'}`}
            >
              {link.label}
            </Link>
          </li>
        ))}
        <li>
          <Link to="/auth/logout" className="block p-2 text-red-500 hover:bg-red-100">Logout</Link>
        </li>
      </ul>
    </nav>
  );
}