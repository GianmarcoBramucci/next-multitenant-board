'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { FetchError } from '@/lib/fetch-wrapper';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="max-w-lg w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)' }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Get Started</h1>
          <p className="text-white text-opacity-90 text-sm">Create your workspace or join an existing one</p>
        </div>

        {/* Register Card */}
        <div className="rounded-2xl p-8" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-xl)' }}>
          {/* Mode Switcher */}
          <div className="flex gap-2 p-1 rounded-lg mb-6" style={{ backgroundColor: 'var(--background)' }}>
            <button
              type="button"
              onClick={() => setMode('create')}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200"
              style={{
                backgroundColor: mode === 'create' ? 'var(--primary)' : 'transparent',
                color: mode === 'create' ? 'white' : 'var(--text-secondary)',
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Workspace
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode('join')}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200"
              style={{
                backgroundColor: mode === 'join' ? 'var(--primary)' : 'transparent',
                color: mode === 'join' ? 'white' : 'var(--text-secondary)',
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Join Workspace
              </div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg p-4" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--error)' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-medium" style={{ color: 'var(--error)' }}>{error}</p>
                </div>
              </div>
            )}

            <Input
              id="email"
              name="email"
              type="email"
              label="Email Address"
              placeholder="you@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
              required
              fullWidth
              autoComplete="email"
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={loading}
              required
              fullWidth
              autoComplete="new-password"
              helperText="Minimum 8 characters"
            />

            <Input
              id="displayName"
              name="displayName"
              type="text"
              label="Your Name"
              placeholder="John Doe"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              disabled={loading}
              required
              fullWidth
              autoComplete="name"
            />

            {mode === 'create' ? (
              <Input
                id="tenantName"
                name="tenantName"
                type="text"
                label="Organization Name"
                placeholder="Acme Inc"
                value={formData.tenantName}
                onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                disabled={loading}
                required
                fullWidth
                helperText="Your workspace will be created with this name"
              />
            ) : (
              <Input
                id="tenantSlug"
                name="tenantSlug"
                type="text"
                label="Organization Slug"
                placeholder="acme-inc"
                value={formData.tenantSlug}
                onChange={(e) => setFormData({ ...formData, tenantSlug: e.target.value })}
                disabled={loading}
                required
                fullWidth
                helperText="The unique identifier of the workspace you're joining (e.g., acme-inc)"
              />
            )}

            <Button
              type="submit"
              isLoading={loading}
              fullWidth
              size="lg"
              className="mt-6"
            >
              {loading ? 'Creating account...' : mode === 'create' ? 'Create Workspace' : 'Join Workspace'}
            </Button>
          </form>

          <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-white text-opacity-80">
          Join thousands of teams collaborating efficiently
        </p>
      </div>
    </div>
  );
}
