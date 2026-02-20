import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Mail, User, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function JoinPage() {
  const { joinToken } = useParams();
  const [team, setTeam] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTeam() {
      if (!supabase || !joinToken) { setNotFound(true); return; }
      const { data, error } = await supabase.rpc('get_team_by_join_token', { p_token: joinToken });
      if (error || !data) { setNotFound(true); return; }
      setTeam(data);
    }
    loadTeam();
  }, [joinToken]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { setError('Please fill in both fields.'); return; }
    setError('');
    setLoading(true);
    try {
      // Create the invitation record
      const result = await supabase.rpc('create_join_invitation', {
        p_join_token: joinToken,
        p_email: email.trim().toLowerCase(),
        p_full_name: name.trim(),
      });
      if (result.data?.error) { setError(result.data.error); setLoading(false); return; }

      // Send the magic link
      await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { full_name: name.trim() },
        },
      });

      setDone(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-surface-900 mb-2">Link not found</h1>
          <p className="text-sm text-surface-500">This join link is invalid or has expired. Ask the team admin for a new one.</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={24} className="text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-surface-900 mb-2">Check your email!</h1>
          <p className="text-sm text-surface-500">
            We sent a magic link to <span className="font-medium text-surface-700">{email}</span>. Click it to join <span className="font-medium text-surface-700">{team.name}</span>.
          </p>
          <p className="text-xs text-surface-400 mt-3">The link expires in 1 hour. Check your spam folder if you don't see it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Join {team.name}</h1>
          <p className="text-sm text-surface-500 mt-1">Enter your details to receive a join link by email.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl border border-surface-200 shadow-sm p-6">
          <Input
            label="Your name"
            placeholder="e.g. Grace Akinlolu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            iconLeft={User}
            required
          />
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            iconLeft={Mail}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            type="submit"
            className="w-full"
            iconRight={ArrowRight}
            loading={loading}
          >
            Send me the join link
          </Button>
        </form>

        <p className="text-center text-xs text-surface-400 mt-4">
          Powered by RosterFlow
        </p>
      </div>
    </div>
  );
}
