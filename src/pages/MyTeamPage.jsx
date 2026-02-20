import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import useAuthStore from '@/stores/authStore';
import Avatar from '@/components/ui/Avatar';

export default function MyTeamPage() {
  const { user, profile } = useAuthStore();
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  // Load user's teams on mount
  useEffect(() => {
    if (!supabase || !user) return;
    supabase
      .from('team_members')
      .select('team_id, teams(id, name)')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const list = (data ?? []).map((tm) => tm.teams).filter(Boolean);
        setTeams(list);
        if (list.length > 0) setSelectedTeamId(list[0].id);
        setLoading(false);
      });
  }, [user]);

  // Load members + messages and subscribe to realtime when team changes
  useEffect(() => {
    if (!supabase || !selectedTeamId) return;

    supabase
      .from('team_members')
      .select('id, user_id, profile:profiles(full_name, avatar_url)')
      .eq('team_id', selectedTeamId)
      .then(({ data }) =>
        setMembers(
          (data ?? []).map((tm) => ({
            id: tm.id,
            user_id: tm.user_id,
            name: tm.profile?.full_name || 'Unknown',
            avatar_url: tm.profile?.avatar_url || '',
          }))
        )
      );

    supabase
      .from('team_messages')
      .select('*')
      .eq('team_id', selectedTeamId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => setMessages(data ?? []));

    const channel = supabase
      .channel(`team-${selectedTeamId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_messages', filter: `team_id=eq.${selectedTeamId}` },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [selectedTeamId]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const content = text.trim();
    setText('');
    await supabase.from('team_messages').insert({
      team_id: selectedTeamId,
      user_id: user.id,
      author_name: profile?.full_name || user.email,
      content,
    });
    setSending(false);
  }

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Users size={40} className="text-surface-300 mb-3" />
        <h2 className="text-lg font-semibold text-surface-900">You're not in a team yet</h2>
        <p className="text-sm text-surface-500 mt-1">Ask your admin to invite you.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 6rem)' }}>
      {/* Team tabs */}
      {teams.length > 1 && (
        <div className="flex gap-2 flex-wrap shrink-0">
          {teams.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTeamId(t.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                selectedTeamId === t.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Members sidebar */}
        <div className="w-52 shrink-0 bg-white rounded-2xl border border-surface-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-100 shrink-0">
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
              Members · {members.length}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-surface-50">
                <Avatar name={m.name} src={m.avatar_url} size="sm" />
                <span className="text-sm text-surface-700 truncate">{m.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-surface-200 min-h-0 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-surface-100 flex items-center gap-2 shrink-0">
            <MessageSquare size={16} className="text-primary-500" />
            <h2 className="font-semibold text-surface-900">{selectedTeam?.name}</h2>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-surface-400">
                <MessageSquare size={32} className="mb-2 opacity-20" />
                <p className="text-sm">No messages yet. Say hello!</p>
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.user_id === user.id;
              return (
                <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <Avatar name={msg.author_name} size="sm" />
                  <div className={`flex flex-col gap-0.5 max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && (
                      <span className="text-xs text-surface-400 px-1">{msg.author_name}</span>
                    )}
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-primary-600 text-white rounded-tr-sm'
                          : 'bg-surface-100 text-surface-800 rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-surface-300 px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-surface-100 flex gap-2 shrink-0">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 rounded-xl border border-surface-200 text-sm text-surface-800 placeholder-surface-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="p-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
