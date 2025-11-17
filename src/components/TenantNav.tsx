'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface TenantNavProps {
  user: User;
  tenant: Tenant;
  tenants: Tenant[];
}

export default function TenantNav({ user, tenant, tenants }: TenantNavProps) {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href={`/app/${tenant.slug}/boards`} className="text-xl font-bold text-gray-900">
              {tenant.name}
            </Link>
            <div className="hidden sm:flex items-center space-x-4">
              <Link
                href={`/app/${tenant.slug}/boards`}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Boards
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {tenants.length > 1 && (
              <select
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                value={tenant.slug}
                onChange={(e) => {
                  window.location.href = `/app/${e.target.value}/boards`;
                }}
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">{user.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
