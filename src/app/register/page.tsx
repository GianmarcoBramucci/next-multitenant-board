'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { FetchError } from '@/lib/fetch-wrapper';

export default function RegisterPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    tenantName: '',
    tenantSlug: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = mode === 'create'
        ? { email: formData.email, password: formData.password, displayName: formData.displayName, tenantName: formData.tenantName }
        : { email: formData.email, password: formData.password, displayName: formData.displayName, tenantSlug: formData.tenantSlug };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Parse error message
        let errorMessage = 'Registrazione fallita';
        try {
          const data = await response.json();
          errorMessage = data.error || data.message || errorMessage;
        } catch {
          // Se il parsing JSON fallisce, usa il messaggio di default
          errorMessage = `Errore ${response.status}: ${response.statusText}`;
        }

        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Auto-login after successful registration
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError('Registrazione completata, ma il login automatico è fallito. Accedi manualmente.');
        setLoading(false);
      } else {
        router.push('/app');
        router.refresh();
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (err instanceof FetchError) {
        setError(err.message);
      } else {
        setError('Si è verificato un errore. Riprova più tardi.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <div className="mt-4 flex justify-center space-x-4">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                mode === 'create'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Create Organization
            </button>
            <button
              type="button"
              onClick={() => setMode('join')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                mode === 'join'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Join Existing Organization
            </button>
          </div>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                Your Name
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="John Doe"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                disabled={loading}
              />
            </div>
            {mode === 'create' ? (
              <div>
                <label htmlFor="tenantName" className="block text-sm font-medium text-gray-700">
                  Organization Name
                </label>
                <input
                  id="tenantName"
                  name="tenantName"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Acme Inc"
                  value={formData.tenantName}
                  onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                  disabled={loading}
                />
              </div>
            ) : (
              <div>
                <label htmlFor="tenantSlug" className="block text-sm font-medium text-gray-700">
                  Organization Slug
                </label>
                <input
                  id="tenantSlug"
                  name="tenantSlug"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="acme-inc"
                  value={formData.tenantSlug}
                  onChange={(e) => setFormData({ ...formData, tenantSlug: e.target.value })}
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter the organization slug (e.g., the part after /app/ in the URL)
                </p>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
