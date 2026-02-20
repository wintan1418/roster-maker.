import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Send, Users, ChevronDown, ChevronUp,
  Smile, Reply, Copy, Trash2, CornerUpRight, X, Music2, Pin, PinOff,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import useAuthStore from '@/stores/authStore';
import useChatNotifStore from '@/stores/chatNotifStore';
import Avatar from '@/components/ui/Avatar';

const SYSTEM_USER = '00000000-0000-0000-0000-000000000000';

const EMOJIS = [
  '😊','😂','🥰','😍','🤩','😎','😄','😁','🤗','😅','😭','🤣',
  '🙏','👍','❤️','🔥','✨','🎉','🎊','🥳','💪','💯','🌟','⭐',
  '👋','🫶','🤝','🙌','👏','🕊️','🎵','🎶','🎤','🎸','🥁','🎹',
  '📅','📌','💫','🌈','⚡','🎁','😇','🫡','💬','📢','🗓️','🎯',
];

// ── Wallpaper: SVG tile with Hebrew worship words + musical symbols ──────────
const WALLPAPER_SVG = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320">
  <text x="10" y="22"  font-size="12" font-family="Georgia,serif" fill="#8B6914" opacity="0.16" transform="rotate(-8 10 22)">יהוה</text>
  <text x="105" y="38" font-size="22" fill="#8B6914" opacity="0.11">♪</text>
  <text x="168" y="16" font-size="10" font-family="Georgia,serif" fill="#8B6914" opacity="0.14" transform="rotate(6 168 16)">הַלְּלוּיָהּ</text>
  <text x="252" y="35" font-size="17" fill="#8B6914" opacity="0.10" transform="rotate(-14 252 35)">♫</text>
  <text x="24"  y="88" font-size="10" font-family="Georgia,serif" fill="#8B6914" opacity="0.15" transform="rotate(10 24 88)">קָדוֹשׁ</text>
  <text x="118" y="78" font-size="26" fill="#8B6914" opacity="0.08" transform="rotate(-4 118 78)">𝄞</text>
  <text x="200" y="92" font-size="10" font-family="Georgia,serif" fill="#8B6914" opacity="0.14" transform="rotate(11 200 92)">אֱלֹהִים</text>
  <text x="48"  y="152" font-size="20" fill="#8B6914" opacity="0.10" transform="rotate(19 48 152)">♬</text>
  <text x="138" y="162" font-size="11" font-family="Georgia,serif" fill="#8B6914" opacity="0.15" transform="rotate(-7 138 162)">שָׁלוֹם</text>
  <text x="228" y="145" font-size="15" fill="#8B6914" opacity="0.10" transform="rotate(9 228 145)">♩</text>
  <text x="14"  y="224" font-size="10" font-family="Georgia,serif" fill="#8B6914" opacity="0.14" transform="rotate(-13 14 224)">תְּהִלָּה</text>
  <text x="92"  y="248" font-size="25" fill="#8B6914" opacity="0.08" transform="rotate(6 92 248)">𝄢</text>
  <text x="172" y="234" font-size="10" font-family="Georgia,serif" fill="#8B6914" opacity="0.15" transform="rotate(13 172 234)">מַלְאָךְ</text>
  <text x="248" y="260" font-size="17" fill="#8B6914" opacity="0.10" transform="rotate(-9 248 260)">♫</text>
  <text x="62"  y="282" font-size="11" font-family="Georgia,serif" fill="#8B6914" opacity="0.13" transform="rotate(5 62 282)">כָּבוֹד</text>
  <text x="174" y="296" font-size="10" font-family="Georgia,serif" fill="#8B6914" opacity="0.14" transform="rotate(-11 174 296)">אָמֵן</text>
  <text x="290" y="180" font-size="10" font-family="Georgia,serif" fill="#8B6914" opacity="0.13" transform="rotate(16 290 180)">רוּחַ</text>
  <text x="310" y="80"  font-size="10" font-family="Georgia,serif" fill="#8B6914" opacity="0.12" transform="rotate(-5 310 80)">אֲדֹנָי</text>
  <text x="290" y="300" font-size="20" fill="#8B6914" opacity="0.09" transform="rotate(-18 290 300)">♪</text>
</svg>`);

export default function MyTeamPage() {
  const { user, profile, orgRole } = useAuthStore();
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
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);
  const [activeMessage, setActiveMessage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [pinnedMsg, setPinnedMsg] = useState(null);
  const isAdmin = orgRole === 'super_admin' || orgRole === 'team_admin';

  useEffect(() => {
    if (!supabase || !user) return;
    supabase
      .from('team_members').select('team_id, teams(id, name)').eq('user_id', user.id)
      .then(({ data }) => {
        const list = (data ?? []).map((tm) => tm.teams).filter(Boolean);
        setTeams(list);
        if (list.length > 0) setSelectedTeamId(list[0].id);
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (!supabase || !selectedTeamId) return;
    supabase
      .from('team_members')
      .select('id, user_id, profile:profiles(full_name, avatar_url), member_roles(team_role:team_roles(name))')
      .eq('team_id', selectedTeamId)
      .then(({ data }) =>
        setMembers((data ?? []).map((tm) => ({
          id: tm.id, user_id: tm.user_id,
          name: tm.profile?.full_name || 'Unknown',
          avatar_url: tm.profile?.avatar_url || '',
          roles: (tm.member_roles ?? []).map((mr) => mr.team_role?.name).filter(Boolean),
        })))
      );
    supabase.from('team_messages').select('*').eq('team_id', selectedTeamId)
      .order('created_at', { ascending: true }).limit(100)
      .then(({ data }) => {
        const msgs = data ?? [];
        setMessages(msgs);
        const pinned = msgs.find((m) => m.is_pinned);
        setPinnedMsg(pinned || null);
      });
    const channel = supabase.channel(`team-${selectedTeamId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_messages', filter: `team_id=eq.${selectedTeamId}` }, (p) => setMessages((prev) => [...prev, p.new]))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'team_messages', filter: `team_id=eq.${selectedTeamId}` }, (p) => {
        setMessages((prev) => prev.filter((m) => m.id !== p.old.id));
        setPinnedMsg((prev) => prev?.id === p.old.id ? null : prev);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'team_messages', filter: `team_id=eq.${selectedTeamId}` }, (p) => {
        setMessages((prev) => prev.map((m) => m.id === p.new.id ? p.new : m));
        if (p.new.is_pinned) setPinnedMsg(p.new);
        else setPinnedMsg((prev) => prev?.id === p.new.id ? null : prev);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [selectedTeamId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (user?.id && selectedTeamId) markRead(user.id, selectedTeamId); }, [selectedTeamId, messages.length, user?.id, markRead]);

  const mentionMatches = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return members.filter((m) => m.user_id !== user?.id && m.name.toLowerCase().includes(q)).slice(0, 6);
  }, [mentionQuery, members, user]);

  const handleInputChange = useCallback((e) => {
    const val = e.target.value; const cursor = e.target.selectionStart;
    setText(val); setCursorPos(cursor);
    const before = val.substring(0, cursor); const atIdx = before.lastIndexOf('@');
    if (atIdx !== -1) {
      const afterAt = before.substring(atIdx + 1);
      const charBefore = atIdx > 0 ? before[atIdx - 1] : ' ';
      if ((charBefore === ' ' || charBefore === '\n' || atIdx === 0) && !/\s/.test(afterAt)) {
        setMentionQuery(afterAt); setMentionIndex(0); return;
      }
    }
    setMentionQuery(null);
  }, []);

  const insertMention = useCallback((member) => {
    const before = text.substring(0, cursorPos); const after = text.substring(cursorPos);
    const atIdx = before.lastIndexOf('@');
    setText(before.substring(0, atIdx) + `@${member.name} ` + after);
    setMentionQuery(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [text, cursorPos]);

  const handleKeyDown = useCallback((e) => {
    if (mentionQuery !== null && mentionMatches.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex((i) => (i + 1) % mentionMatches.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIndex((i) => (i - 1 + mentionMatches.length) % mentionMatches.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(mentionMatches[mentionIndex]); return; }
      if (e.key === 'Escape') { e.preventDefault(); setMentionQuery(null); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) sendMessage(e);
  }, [mentionQuery, mentionMatches, mentionIndex, insertMention]);

  async function sendMessage(e) {
    e.preventDefault(); if (!text.trim() || sending) return;
    setSending(true); const content = text.trim(); setText(''); setReplyTo(null); setMentionQuery(null);
    const payload = { team_id: selectedTeamId, user_id: user.id, author_name: profile?.full_name || user.email, content };
    if (replyTo) { payload.reply_to_id = replyTo.id; payload.reply_to_name = replyTo.author_name; payload.reply_to_content = replyTo.content?.substring(0, 100); }
    await supabase.from('team_messages').insert(payload);
    setSending(false); inputRef.current?.focus();
  }

  async function deleteMessage(msgId) { setActiveMessage(null); await supabase.from('team_messages').delete().eq('id', msgId); setMessages((prev) => prev.filter((m) => m.id !== msgId)); }
  function copyMessage(content) { navigator.clipboard.writeText(content); setActiveMessage(null); }
  function startReply(msg) { setReplyTo(msg); setActiveMessage(null); inputRef.current?.focus(); }
  async function togglePin(msg) {
    setActiveMessage(null);
    // Unpin previously pinned message first
    if (pinnedMsg && pinnedMsg.id !== msg.id) {
      await supabase.from('team_messages').update({ is_pinned: false }).eq('id', pinnedMsg.id);
    }
    const newPinned = !msg.is_pinned;
    await supabase.from('team_messages').update({ is_pinned: newPinned }).eq('id', msg.id);
    setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, is_pinned: newPinned } : { ...m, is_pinned: false }));
    setPinnedMsg(newPinned ? { ...msg, is_pinned: true } : null);
  }
  function openEmoji() {
    if (showEmoji) { setShowEmoji(false); return; }
    const btn = emojiButtonRef.current;
    if (btn) { const r = btn.getBoundingClientRect(); setEmojiPos({ bottom: window.innerHeight - r.top + 8, left: Math.min(r.left, window.innerWidth - 268) }); }
    setShowEmoji(true);
  }
  function pickEmoji(emoji) { setText((t) => t + emoji); setShowEmoji(false); inputRef.current?.focus(); }

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  function renderContent(content) {
    return content.split(/(@\w[\w\s]*?)(?=\s|$)/g).map((part, i) => {
      if (part.startsWith('@') && members.some((m) => `@${m.name}` === part.trim()))
        return <span key={i} className="bg-amber-100 text-amber-800 rounded px-0.5 font-semibold">{part}</span>;
      return part;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-surface-400">Loading your team…</p>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <img src="/logo.jpg" alt="" className="w-16 h-16 rounded-2xl object-cover mb-4 opacity-50" />
        <h2 className="text-lg font-semibold text-surface-900">You're not in a team yet</h2>
        <p className="text-sm text-surface-500 mt-1">Ask your admin to invite you.</p>
      </div>
    );
  }

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 flex flex-col" style={{ height: 'calc(100dvh - 4rem)' }}>

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/10"
        style={{ background: 'linear-gradient(90deg, #0f1f3d 0%, #1a3460 100%)' }}
      >
        {/* Left: logo + team name */}
        <div className="flex items-center gap-2.5">
          <img src="/logo.jpg" alt="FMELi" className="w-8 h-8 rounded-lg object-cover border border-white/20 shrink-0" />
          <div>
            <p className="text-sm font-bold text-white leading-tight">{selectedTeam?.name || 'Team Chat'}</p>
            <p className="text-[10px] text-white/45 flex items-center gap-1">
              <Music2 size={9} /> {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Right: team tabs + mobile toggle */}
        <div className="flex items-center gap-1.5">
          {teams.length > 1 && teams.map((t) => (
            <button key={t.id} onClick={() => setSelectedTeamId(t.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedTeamId === t.id ? 'bg-amber-400 text-black' : 'bg-white/12 text-white hover:bg-white/20'
              }`}
            >{t.name}</button>
          ))}
          <button className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/12 text-white text-xs hover:bg-white/20 cursor-pointer" onClick={() => setShowMembers((v) => !v)}>
            <Users size={13} />{showMembers ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Desktop members sidebar */}
        <div className="hidden md:flex w-52 shrink-0 flex-col overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #101828 0%, #1a2e4a 100%)' }}
        >
          <div className="px-4 py-2.5 border-b border-white/8 shrink-0">
            <p className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest">Ministry · {members.length}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-px">
            {members.map((m) => {
              const isMe = m.user_id === user?.id;
              return (
                <div key={m.id} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors ${isMe ? 'bg-amber-500/12' : 'hover:bg-white/5'}`}>
                  <div className="relative shrink-0">
                    <Avatar name={m.name} src={m.avatar_url} size="sm" />
                    {isMe && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#1a2e4a] rounded-full" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-medium truncate ${isMe ? 'text-amber-300' : 'text-white/75'}`}>
                      {m.name}{isMe && <span className="text-amber-500/60 text-[10px] ml-1">you</span>}
                    </p>
                    {m.roles?.length > 0 && <p className="text-[10px] text-white/30 truncate">{m.roles.join(' · ')}</p>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-3 flex justify-center shrink-0 opacity-15">
            <img src="/logo.jpg" alt="" className="w-9 h-9 object-contain grayscale" />
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">

          {/* ── Wallpaper background ───────────────────────────── */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: '#ece5d5' }} />
          {/* SVG worship-pattern tile */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: `url("data:image/svg+xml,${WALLPAPER_SVG}")`, backgroundRepeat: 'repeat', backgroundSize: '320px 320px' }} />
          {/* Grain overlay */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity="0.38"/></svg>')}")`,
              backgroundRepeat: 'repeat', backgroundSize: '200px', opacity: 0.45, mixBlendMode: 'multiply',
            }} />

          {/* Mobile members strip */}
          {showMembers && (
            <div className="md:hidden flex gap-4 overflow-x-auto px-4 py-3 border-b border-black/8 bg-white/70 backdrop-blur-sm shrink-0 relative z-10">
              {members.map((m) => (
                <div key={m.id} className="flex flex-col items-center gap-1 shrink-0">
                  <Avatar name={m.name} src={m.avatar_url} size="sm" />
                  <span className="text-[10px] text-surface-500 w-12 truncate text-center">{m.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          )}

          {/* Pinned message banner */}
          {pinnedMsg && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-amber-200/60 shrink-0 relative z-10"
              style={{ background: 'rgba(254,243,199,0.95)', backdropFilter: 'blur(8px)' }}>
              <Pin size={13} className="text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider leading-none mb-0.5">Pinned</p>
                <p className="text-xs text-surface-700 truncate">{pinnedMsg.content?.substring(0, 100)}</p>
              </div>
              {isAdmin && (
                <button onClick={() => togglePin(pinnedMsg)} className="shrink-0 p-0.5 rounded hover:bg-amber-200 text-amber-600 cursor-pointer"><X size={14} /></button>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-2 relative z-10" onClick={() => setActiveMessage(null)}>

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="w-16 h-16 rounded-2xl overflow-hidden mb-4 shadow-lg border-2 border-white/60">
                  <img src="/logo.jpg" alt="" className="w-full h-full object-cover" />
                </div>
                <p className="text-sm font-semibold text-surface-700">No messages yet</p>
                <p className="text-xs mt-0.5 text-surface-500">Be the first to say hello!</p>
                <p className="text-[11px] mt-0.5 text-surface-400">Type @ to mention someone</p>
              </div>
            )}

            {messages.map((msg) => {
              // System message
              if (msg.user_id === SYSTEM_USER) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="max-w-xs text-center px-4 py-2.5 rounded-xl shadow"
                      style={{ background: 'rgba(15,31,61,0.82)', backdropFilter: 'blur(8px)' }}>
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <img src="/logo.jpg" alt="" className="w-4 h-4 rounded object-cover opacity-80" />
                        <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">RosterFlow</p>
                      </div>
                      <p className="text-xs text-white/85 whitespace-pre-line leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                );
              }

              const isMe = msg.user_id === user.id;
              const isActive = activeMessage === msg.id;

              return (
                <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                  {!isMe && (
                    <div className="shrink-0 mt-1 self-end">
                      <Avatar name={msg.author_name} size="sm" />
                    </div>
                  )}
                  <div className={`flex flex-col gap-0.5 max-w-[72%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && <span className="text-[11px] text-surface-600 px-2 font-semibold">{msg.author_name}</span>}

                    {/* Reply reference */}
                    {msg.reply_to_name && (
                      <div className={`flex items-center gap-1 text-[10px] text-surface-500 px-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <CornerUpRight size={9} />
                        <span className="font-bold">{msg.reply_to_name}</span>
                        <span className="truncate max-w-[120px] opacity-60">{msg.reply_to_content}</span>
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      onClick={(e) => { e.stopPropagation(); setActiveMessage(isActive ? null : msg.id); }}
                      className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap cursor-pointer transition-all shadow-sm ${
                        isActive ? 'scale-[0.98] ring-2 ring-amber-400/50' : ''
                      } ${isMe ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                      style={isMe
                        ? { background: 'linear-gradient(135deg, #1a3460 0%, #0f1f3d 100%)', color: '#f3f4f6' }
                        : { background: 'rgba(255,255,255,0.92)', color: '#1f2937', boxShadow: '0 1px 2px rgba(0,0,0,0.12)' }
                      }
                    >
                      {renderContent(msg.content)}
                    </div>

                    {/* Quick actions */}
                    {isActive && (
                      <div
                        className={`flex items-center gap-0.5 bg-white border border-surface-200 rounded-xl shadow-xl px-1 py-0.5 ${isMe ? 'self-end' : 'self-start'}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button onClick={() => startReply(msg)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-surface-600 hover:bg-surface-100 cursor-pointer">
                          <Reply size={12} /><span className="hidden sm:inline">Reply</span>
                        </button>
                        <button onClick={() => copyMessage(msg.content)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-surface-600 hover:bg-surface-100 cursor-pointer">
                          <Copy size={12} /><span className="hidden sm:inline">Copy</span>
                        </button>
                        {isAdmin && (
                          <button onClick={() => togglePin(msg)} className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs hover:bg-amber-50 cursor-pointer ${msg.is_pinned ? 'text-amber-600' : 'text-surface-600'}`}>
                            {msg.is_pinned ? <PinOff size={12} /> : <Pin size={12} />}
                            <span className="hidden sm:inline">{msg.is_pinned ? 'Unpin' : 'Pin'}</span>
                          </button>
                        )}
                        {isMe && (
                          <button onClick={() => deleteMessage(msg.id)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50 cursor-pointer">
                            <Trash2 size={12} /><span className="hidden sm:inline">Delete</span>
                          </button>
                        )}
                      </div>
                    )}

                    <span className="text-[10px] text-surface-400 px-1.5">
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
            <div className="flex items-center gap-2 px-4 py-2 border-t border-black/8 text-xs shrink-0 relative z-10"
              style={{ background: 'rgba(255,248,220,0.92)', backdropFilter: 'blur(8px)' }}>
              <CornerUpRight size={13} className="text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-surface-700">{replyTo.author_name}</span>
                <span className="text-surface-400 ml-1.5 truncate inline-block max-w-[180px] align-bottom">{replyTo.content?.substring(0, 80)}</span>
              </div>
              <button onClick={() => setReplyTo(null)} className="shrink-0 p-0.5 rounded hover:bg-black/8 text-surface-400 cursor-pointer"><X size={14} /></button>
            </div>
          )}

          {/* @mention dropdown */}
          {mentionQuery !== null && mentionMatches.length > 0 && (
            <div className="mx-3 mb-1 rounded-xl shadow-xl overflow-hidden shrink-0 relative z-10"
              style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.08)' }}>
              {mentionMatches.map((m, idx) => (
                <button key={m.id} onClick={() => insertMention(m)}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-left transition-colors cursor-pointer ${idx === mentionIndex ? 'bg-amber-50 text-amber-800' : 'text-surface-700 hover:bg-surface-50'}`}>
                  <Avatar name={m.name} size="xs" />
                  <span className="font-semibold">{m.name}</span>
                  {m.roles?.[0] && <span className="text-surface-400 text-xs">{m.roles[0]}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <form onSubmit={sendMessage}
            className="flex items-center gap-2 px-3 py-2.5 shrink-0 relative z-10"
            style={{ background: 'rgba(236,229,213,0.95)', backdropFilter: 'blur(8px)', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <button ref={emojiButtonRef} type="button" onClick={openEmoji}
              className="shrink-0 p-2 rounded-full text-surface-500 hover:bg-black/8 transition-colors cursor-pointer">
              <Smile size={22} />
            </button>
            <input
              ref={inputRef} value={text} onChange={handleInputChange} onKeyDown={handleKeyDown}
              placeholder="Message… (@ to mention)"
              className="flex-1 min-w-0 px-4 py-2.5 rounded-full text-sm text-surface-800 placeholder-surface-400 outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px rgba(180,130,20,0.3)'; }}
              onBlur={(e) => { e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; }}
            />
            <button type="submit" disabled={!text.trim() || sending}
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all cursor-pointer disabled:opacity-40 shadow-md"
              style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Emoji picker */}
      {showEmoji && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowEmoji(false)} />
          <div className="fixed z-50 border border-surface-200 rounded-2xl shadow-2xl p-3"
            style={{ bottom: emojiPos.bottom, left: emojiPos.left, width: 264, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)' }}>
            <div className="grid grid-cols-8 gap-1">
              {EMOJIS.map((emoji) => (
                <button key={emoji} type="button" onClick={() => pickEmoji(emoji)}
                  className="text-xl p-1.5 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer leading-none">
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
