import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquare,
  Send,
  Users,
  ChevronDown,
  ChevronUp,
  Smile,
  Reply,
  Copy,
  Trash2,
  CornerUpRight,
  X,
  Music,
  Music2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import useAuthStore from '@/stores/authStore';
import useChatNotifStore from '@/stores/chatNotifStore';
import Avatar from '@/components/ui/Avatar';

const SYSTEM_USER = '00000000-0000-0000-0000-000000000000';

const EMOJIS = [
  '😊', '😂', '🥰', '😍', '🤩', '😎', '😄', '😁', '🤗', '😅', '😭', '🤣',
  '🙏', '👍', '❤️', '🔥', '✨', '🎉', '🎊', '🥳', '💪', '💯', '🌟', '⭐',
  '👋', '🫶', '🤝', '🙌', '👏', '🕊️', '🎵', '🎶', '🎤', '🎸', '🥁', '🎹',
  '📅', '📌', '💫', '🌈', '⚡', '🎁', '😇', '🫡', '💬', '📢', '🗓️', '🎯',
];

// Musical note decorations for the grainy background
const NOTE_POSITIONS = [
  { top: '8%', left: '4%', size: 14, opacity: 0.06, rotate: -15 },
  { top: '18%', left: '88%', size: 18, opacity: 0.05, rotate: 20 },
  { top: '35%', left: '7%', size: 12, opacity: 0.07, rotate: 5 },
  { top: '55%', left: '91%', size: 16, opacity: 0.05, rotate: -10 },
  { top: '72%', left: '3%', size: 14, opacity: 0.06, rotate: 25 },
  { top: '85%', left: '85%', size: 20, opacity: 0.04, rotate: -20 },
  { top: '92%', left: '45%', size: 12, opacity: 0.05, rotate: 10 },
  { top: '25%', left: '50%', size: 10, opacity: 0.04, rotate: -5 },
];

export default function MyTeamPage() {
  const { user, profile } = useAuthStore();
  const markRead = useChatNotifStore((s) => s.markRead);
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiPos, setEmojiPos] = useState({ bottom: 0, left: 0 });
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const emojiButtonRef = useRef(null);

  // @mention state
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);

  // Quick actions state
  const [activeMessage, setActiveMessage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);

  // ── Fetch teams ──────────────────────────────────────────────────────────
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

  // ── Fetch members & messages + Realtime ─────────────────────────────────
  useEffect(() => {
    if (!supabase || !selectedTeamId) return;

    supabase
      .from('team_members')
      .select('id, user_id, profile:profiles(full_name, avatar_url), member_roles(team_role:team_roles(name))')
      .eq('team_id', selectedTeamId)
      .then(({ data }) =>
        setMembers(
          (data ?? []).map((tm) => ({
            id: tm.id,
            user_id: tm.user_id,
            name: tm.profile?.full_name || 'Unknown',
            avatar_url: tm.profile?.avatar_url || '',
            roles: (tm.member_roles ?? []).map((mr) => mr.team_role?.name).filter(Boolean),
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
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'team_messages', filter: `team_id=eq.${selectedTeamId}` },
        (payload) => setMessages((prev) => prev.filter((m) => m.id !== payload.old.id))
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [selectedTeamId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (user?.id && selectedTeamId) {
      markRead(user.id, selectedTeamId);
    }
  }, [selectedTeamId, messages.length, user?.id, markRead]);

  // ── @mention filter ──────────────────────────────────────────────────────
  const mentionMatches = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return members
      .filter((m) => m.user_id !== user?.id && m.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [mentionQuery, members, user]);

  // ── Handle text change with @mention detection ───────────────────────────
  const handleInputChange = useCallback((e) => {
    const val = e.target.value;
    const cursor = e.target.selectionStart;
    setText(val);
    setCursorPos(cursor);

    const before = val.substring(0, cursor);
    const atIdx = before.lastIndexOf('@');

    if (atIdx !== -1) {
      const afterAt = before.substring(atIdx + 1);
      const charBefore = atIdx > 0 ? before[atIdx - 1] : ' ';
      if ((charBefore === ' ' || charBefore === '\n' || atIdx === 0) && !/\s/.test(afterAt)) {
        setMentionQuery(afterAt);
        setMentionIndex(0);
        return;
      }
    }
    setMentionQuery(null);
  }, []);

  // ── Handle mention keyboard nav ──────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (mentionQuery !== null && mentionMatches.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex((i) => (i + 1) % mentionMatches.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex((i) => (i - 1 + mentionMatches.length) % mentionMatches.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(mentionMatches[mentionIndex]); return; }
      if (e.key === 'Escape') { e.preventDefault(); setMentionQuery(null); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) sendMessage(e);
  }, [mentionQuery, mentionMatches, mentionIndex]);

  const insertMention = useCallback((member) => {
    const before = text.substring(0, cursorPos);
    const after = text.substring(cursorPos);
    const atIdx = before.lastIndexOf('@');
    const newText = before.substring(0, atIdx) + `@${member.name} ` + after;
    setText(newText);
    setMentionQuery(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [text, cursorPos]);

  // ── Send message ─────────────────────────────────────────────────────────
  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const content = text.trim();
    setText('');
    setReplyTo(null);
    setMentionQuery(null);

    const payload = {
      team_id: selectedTeamId,
      user_id: user.id,
      author_name: profile?.full_name || user.email,
      content,
    };
    if (replyTo) {
      payload.reply_to_id = replyTo.id;
      payload.reply_to_name = replyTo.author_name;
      payload.reply_to_content = replyTo.content?.substring(0, 100);
    }

    await supabase.from('team_messages').insert(payload);
    setSending(false);
    inputRef.current?.focus();
  }

  async function deleteMessage(msgId) {
    setActiveMessage(null);
    await supabase.from('team_messages').delete().eq('id', msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  }

  function copyMessage(content) {
    navigator.clipboard.writeText(content);
    setActiveMessage(null);
  }

  function startReply(msg) {
    setReplyTo(msg);
    setActiveMessage(null);
    inputRef.current?.focus();
  }

  function openEmoji() {
    if (showEmoji) { setShowEmoji(false); return; }
    const btn = emojiButtonRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setEmojiPos({ bottom: window.innerHeight - rect.top + 8, left: Math.min(rect.left, window.innerWidth - 268) });
    }
    setShowEmoji(true);
  }

  function pickEmoji(emoji) {
    setText((t) => t + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  }

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  function renderContent(content) {
    const parts = content.split(/(@\w[\w\s]*?)(?=\s|$)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@') && members.some((m) => `@${m.name}` === part.trim())) {
        return (
          <span key={i} className="bg-amber-100 text-amber-800 rounded px-0.5 font-semibold">
            {part}
          </span>
        );
      }
      return part;
    });
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <Music size={16} className="absolute inset-0 m-auto text-amber-500" />
          </div>
          <p className="text-sm text-surface-400 font-medium">Loading your team…</p>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-amber-200">
            <img src="/logo.jpg" alt="FMELi" className="w-full h-full object-cover" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-surface-900">You're not in a team yet</h2>
        <p className="text-sm text-surface-500 mt-1">Ask your admin to invite you.</p>
      </div>
    );
  }

  return (
    <div
      className="-m-4 sm:-m-6 lg:-m-8 flex flex-col"
      style={{ height: 'calc(100dvh - 4rem)' }}
    >
      {/* ── Hero Banner Header ──────────────────────────────────────────── */}
      <div className="relative shrink-0 overflow-hidden" style={{ height: '120px' }}>
        {/* Banner image */}
        <img
          src="/banner.jpg"
          alt="Life Campaign"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

        {/* Grain texture overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px',
            mixBlendMode: 'overlay',
          }}
        />

        {/* Content inside banner */}
        <div className="relative z-10 h-full flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
              <img src="/logo.jpg" alt="FMELi" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight tracking-wide drop-shadow">
                {selectedTeam?.name || 'Team Chat'}
              </p>
              <p className="text-white/60 text-xs flex items-center gap-1 mt-0.5">
                <Music2 size={10} />
                {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Team tabs — if multiple */}
          <div className="flex items-center gap-1.5">
            {teams.length > 1 && teams.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTeamId(t.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedTeamId === t.id
                    ? 'bg-amber-400 text-black shadow-lg'
                    : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm'
                }`}
              >
                {t.name}
              </button>
            ))}

            {/* Mobile members toggle */}
            <button
              className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/15 text-white text-xs hover:bg-white/25 backdrop-blur-sm cursor-pointer"
              onClick={() => setShowMembers((v) => !v)}
            >
              <Users size={13} />
              {showMembers ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Desktop members sidebar */}
        <div className="hidden md:flex w-52 shrink-0 flex-col border-r border-surface-200 overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
          }}
        >
          {/* Sidebar header */}
          <div className="px-4 py-3 border-b border-white/10 shrink-0">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Music size={10} />
              Ministry · {members.length}
            </p>
          </div>

          {/* Member list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {members.map((m) => {
              const isMe = m.user_id === user?.id;
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors ${
                    isMe ? 'bg-amber-500/15' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar name={m.name} src={m.avatar_url} size="sm" />
                    {isMe && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#16213e] rounded-full" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-medium truncate ${isMe ? 'text-amber-300' : 'text-white/80'}`}>
                      {m.name}{isMe && <span className="text-amber-500 ml-1">(you)</span>}
                    </p>
                    {m.roles?.length > 0 && (
                      <p className="text-[10px] text-white/35 truncate">{m.roles.join(' · ')}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom decoration: logo watermark */}
          <div className="p-3 flex justify-center opacity-20 shrink-0">
            <img src="/logo.jpg" alt="" className="w-10 h-10 object-contain grayscale" />
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">

          {/* Grainy music-themed chat background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(160deg, #fdf6e3 0%, #fef9f0 30%, #f0f4ff 70%, #eef2ff 100%)',
            }}
          >
            {/* Grain texture */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
                backgroundSize: '256px',
                opacity: 0.35,
              }}
            />
            {/* Subtle musical notes watermark */}
            {NOTE_POSITIONS.map((n, i) => (
              <div
                key={i}
                className="absolute text-surface-400 select-none"
                style={{ top: n.top, left: n.left, opacity: n.opacity, transform: `rotate(${n.rotate}deg)`, fontSize: n.size }}
              >
                {i % 3 === 0 ? '♪' : i % 3 === 1 ? '♫' : '𝄞'}
              </div>
            ))}
          </div>

          {/* Mobile members strip */}
          {showMembers && (
            <div className="md:hidden flex gap-4 overflow-x-auto px-4 py-3 border-b border-surface-100 bg-surface-50/90 backdrop-blur-sm shrink-0 relative z-10">
              {members.map((m) => (
                <div key={m.id} className="flex flex-col items-center gap-1 shrink-0">
                  <Avatar name={m.name} src={m.avatar_url} size="sm" />
                  <span className="text-[10px] text-surface-500 w-12 truncate text-center">
                    {m.name.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Messages area */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4 relative z-10"
            onClick={() => setActiveMessage(null)}
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-amber-200 shadow-xl">
                    <img src="/banner.jpg" alt="" className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow">
                    <Music2 size={13} className="text-white" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-surface-700">No messages yet</p>
                <p className="text-xs mt-1 text-surface-400">Be the first to say hello!</p>
                <p className="text-xs mt-0.5 text-surface-300">Type @ to mention someone</p>
              </div>
            )}

            {messages.map((msg) => {
              // System messages
              if (msg.user_id === SYSTEM_USER) {
                return (
                  <div key={msg.id} className="flex justify-center my-3">
                    <div
                      className="relative max-w-sm text-center px-5 py-3 rounded-2xl shadow-md overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
                      }}
                    >
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                          backgroundSize: '128px',
                        }}
                      />
                      <div className="relative z-10 flex items-center justify-center gap-2 mb-1">
                        <img src="/logo.jpg" alt="" className="w-5 h-5 rounded object-cover" />
                        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">RosterFlow</p>
                      </div>
                      <p className="relative z-10 text-sm text-white/90 whitespace-pre-line leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                );
              }

              const isMe = msg.user_id === user.id;
              const isActive = activeMessage === msg.id;

              return (
                <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''} group relative`}>
                  <div className="shrink-0 mt-1">
                    <Avatar name={msg.author_name} size="sm" />
                  </div>
                  <div className={`flex flex-col gap-0.5 min-w-0 max-w-[72%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && (
                      <span className="text-[11px] text-surface-500 px-1 font-semibold tracking-wide">{msg.author_name}</span>
                    )}

                    {/* Reply reference */}
                    {msg.reply_to_name && (
                      <div className={`flex items-center gap-1.5 text-[10px] text-surface-400 px-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <CornerUpRight size={10} />
                        <span className="font-semibold">{msg.reply_to_name}</span>
                        <span className="truncate max-w-[120px] opacity-70">{msg.reply_to_content}</span>
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      onClick={(e) => { e.stopPropagation(); setActiveMessage(isActive ? null : msg.id); }}
                      className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap cursor-pointer transition-all shadow-sm ${
                        isMe
                          ? 'text-white rounded-tr-sm hover:opacity-90'
                          : 'text-surface-800 rounded-tl-sm hover:shadow-md'
                      } ${isActive ? 'ring-2 ring-amber-400/60 scale-[0.99]' : ''}`}
                      style={isMe ? {
                        background: 'linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%)',
                      } : {
                        background: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.9)',
                      }}
                    >
                      {renderContent(msg.content)}
                    </div>

                    {/* Quick actions popup */}
                    {isActive && (
                      <div
                        className={`flex items-center gap-0.5 bg-white border border-surface-200 rounded-xl shadow-xl px-1 py-0.5 animate-in fade-in slide-in-from-bottom-1 duration-150 ${isMe ? 'self-end' : 'self-start'}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button onClick={() => startReply(msg)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-surface-600 hover:bg-surface-100 transition-colors cursor-pointer" title="Reply">
                          <Reply size={13} />
                          <span className="hidden sm:inline">Reply</span>
                        </button>
                        <button onClick={() => copyMessage(msg.content)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-surface-600 hover:bg-surface-100 transition-colors cursor-pointer" title="Copy">
                          <Copy size={13} />
                          <span className="hidden sm:inline">Copy</span>
                        </button>
                        {isMe && (
                          <button onClick={() => deleteMessage(msg.id)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors cursor-pointer" title="Delete">
                            <Trash2 size={13} />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        )}
                      </div>
                    )}

                    <span className="text-[10px] text-surface-300 px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Reply bar */}
          {replyTo && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50/90 backdrop-blur-sm border-t border-amber-100 text-xs shrink-0 relative z-10">
              <CornerUpRight size={14} className="text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-surface-700">{replyTo.author_name}</span>
                <span className="text-surface-400 ml-2 truncate inline-block max-w-[200px] align-bottom">{replyTo.content?.substring(0, 80)}</span>
              </div>
              <button onClick={() => setReplyTo(null)} className="shrink-0 p-1 rounded hover:bg-amber-100 text-surface-400 cursor-pointer">
                <X size={14} />
              </button>
            </div>
          )}

          {/* @mention autocomplete */}
          {mentionQuery !== null && mentionMatches.length > 0 && (
            <div className="mx-3 mb-1 bg-white/95 backdrop-blur-sm border border-surface-200 rounded-xl shadow-xl overflow-hidden shrink-0 relative z-10">
              {mentionMatches.map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => insertMention(m)}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                    idx === mentionIndex ? 'bg-amber-50 text-amber-800' : 'text-surface-700 hover:bg-surface-50'
                  }`}
                >
                  <Avatar name={m.name} size="xs" />
                  <div>
                    <span className="font-semibold">{m.name}</span>
                    {m.roles?.length > 0 && <span className="text-surface-400 text-xs ml-2">{m.roles[0]}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <form
            onSubmit={sendMessage}
            className="flex items-center gap-2 px-3 py-3 border-t border-white/60 shrink-0 relative z-10"
            style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)' }}
          >
            <button
              ref={emojiButtonRef}
              type="button"
              onClick={openEmoji}
              className="shrink-0 p-2 rounded-xl text-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
            >
              <Smile size={20} />
            </button>
            <input
              ref={inputRef}
              value={text}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message the team… (@ to mention)"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-surface-800 placeholder-surface-400 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(200,180,120,0.3)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
              onFocus={(e) => {
                e.target.style.border = '1px solid rgba(245,158,11,0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.12)';
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid rgba(200,180,120,0.3)';
                e.target.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
              }}
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="shrink-0 p-2.5 rounded-xl text-white hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer shadow-md"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Emoji picker portal */}
      {showEmoji && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowEmoji(false)} />
          <div
            className="fixed z-50 border border-surface-200 rounded-2xl shadow-2xl p-3"
            style={{ bottom: emojiPos.bottom, left: emojiPos.left, width: 264, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)' }}
          >
            <div className="grid grid-cols-8 gap-1">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => pickEmoji(emoji)}
                  className="text-xl p-1.5 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer leading-none"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
