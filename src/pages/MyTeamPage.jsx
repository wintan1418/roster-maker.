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
  const [mentionQuery, setMentionQuery] = useState(null); // null = not active
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);

  // Quick actions state
  const [activeMessage, setActiveMessage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);

  // ── Fetch teams ─────────────────────────────────────────────────────────
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

  // ── Fetch members & messages + Realtime ──────────────────────────────────
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

  // Mark messages as read when the selected team changes or new messages arrive
  useEffect(() => {
    if (user?.id && selectedTeamId) {
      markRead(user.id, selectedTeamId);
    }
  }, [selectedTeamId, messages.length, user?.id, markRead]);

  // ── @mention filter ─────────────────────────────────────────────────────
  const mentionMatches = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return members
      .filter((m) => m.user_id !== user?.id && m.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [mentionQuery, members, user]);

  // ── Handle text change with @mention detection ──────────────────────────
  const handleInputChange = useCallback((e) => {
    const val = e.target.value;
    const cursor = e.target.selectionStart;
    setText(val);
    setCursorPos(cursor);

    // Detect @mention trigger
    const before = val.substring(0, cursor);
    const atIdx = before.lastIndexOf('@');

    if (atIdx !== -1) {
      const afterAt = before.substring(atIdx + 1);
      // Only trigger if @ is at start or preceded by a space, and no spaces in query
      const charBefore = atIdx > 0 ? before[atIdx - 1] : ' ';
      if ((charBefore === ' ' || charBefore === '\n' || atIdx === 0) && !/\s/.test(afterAt)) {
        setMentionQuery(afterAt);
        setMentionIndex(0);
        return;
      }
    }
    setMentionQuery(null);
  }, []);

  // ── Handle mention keyboard nav ─────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (mentionQuery !== null && mentionMatches.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % mentionMatches.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + mentionMatches.length) % mentionMatches.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(mentionMatches[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    // Normal enter to send
    if (e.key === 'Enter' && !e.shiftKey) {
      sendMessage(e);
    }
  }, [mentionQuery, mentionMatches, mentionIndex]);

  // ── Insert mention into text ─────────────────────────────────────────────
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

    // Include reply metadata
    if (replyTo) {
      payload.reply_to_id = replyTo.id;
      payload.reply_to_name = replyTo.author_name;
      payload.reply_to_content = replyTo.content?.substring(0, 100);
    }

    await supabase.from('team_messages').insert(payload);
    setSending(false);
    inputRef.current?.focus();
  }

  // ── Delete message ───────────────────────────────────────────────────────
  async function deleteMessage(msgId) {
    setActiveMessage(null);
    await supabase.from('team_messages').delete().eq('id', msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  }

  // ── Copy message ─────────────────────────────────────────────────────────
  function copyMessage(content) {
    navigator.clipboard.writeText(content);
    setActiveMessage(null);
  }

  // ── Reply to message ─────────────────────────────────────────────────────
  function startReply(msg) {
    setReplyTo(msg);
    setActiveMessage(null);
    inputRef.current?.focus();
  }

  // ── Emoji picker ─────────────────────────────────────────────────────────
  function openEmoji() {
    if (showEmoji) { setShowEmoji(false); return; }
    const btn = emojiButtonRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setEmojiPos({
        bottom: window.innerHeight - rect.top + 8,
        left: Math.min(rect.left, window.innerWidth - 268),
      });
    }
    setShowEmoji(true);
  }

  function pickEmoji(emoji) {
    setText((t) => t + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  }

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  // ── Render @mention content (highlight mentions) ─────────────────────────
  function renderContent(content) {
    const parts = content.split(/(@\w[\w\s]*?)(?=\s|$)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@') && members.some((m) => `@${m.name}` === part.trim())) {
        return (
          <span key={i} className="bg-primary-100 text-primary-700 rounded px-0.5 font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  }

  // ── Loading ──────────────────────────────────────────────────────────────
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
    <div
      className="-m-4 sm:-m-6 lg:-m-8 flex flex-col"
      style={{ height: 'calc(100dvh - 4rem)' }}
    >
      {/* Team tabs */}
      {teams.length > 1 && (
        <div className="flex gap-2 flex-wrap px-4 pt-3 shrink-0">
          {teams.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTeamId(t.id)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors cursor-pointer ${selectedTeamId === t.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-1 min-h-0 gap-0 md:gap-4 md:p-4 lg:p-6">

        {/* Desktop members sidebar */}
        <div className="hidden md:flex w-52 shrink-0 flex-col bg-white rounded-2xl border border-surface-200 overflow-hidden">
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

        {/* Chat panel */}
        <div className="flex-1 flex flex-col bg-white md:rounded-2xl md:border border-surface-200 min-h-0 overflow-hidden">

          {/* Header */}
          <div className="px-4 py-3 border-b border-surface-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-primary-500" />
              <span className="font-semibold text-surface-900 text-sm">{selectedTeam?.name}</span>
            </div>
            <button
              className="md:hidden flex items-center gap-1 text-xs text-surface-500 hover:text-surface-700 cursor-pointer"
              onClick={() => setShowMembers((v) => !v)}
            >
              <Users size={14} />
              {members.length}
              {showMembers ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          {/* Mobile members strip */}
          {showMembers && (
            <div className="md:hidden flex gap-4 overflow-x-auto px-4 py-3 border-b border-surface-100 bg-surface-50 shrink-0">
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

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" onClick={() => setActiveMessage(null)}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-surface-400 py-16">
                <MessageSquare size={32} className="mb-2 opacity-20" />
                <p className="text-sm">No messages yet. Say hello!</p>
                <p className="text-xs mt-1 text-surface-300">Type @ to mention someone</p>
              </div>
            )}
            {messages.map((msg) => {
              // System messages
              if (msg.user_id === SYSTEM_USER) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="bg-primary-50 border border-primary-100 rounded-2xl px-4 py-3 max-w-sm text-center">
                      <p className="text-[11px] font-semibold text-primary-600 uppercase tracking-wide mb-1">RosterFlow</p>
                      <p className="text-sm text-surface-700 whitespace-pre-line leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                );
              }

              const isMe = msg.user_id === user.id;
              const isActive = activeMessage === msg.id;

              return (
                <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''} group relative`}>
                  <div className="shrink-0 mt-1">
                    <Avatar name={msg.author_name} size="sm" />
                  </div>
                  <div className={`flex flex-col gap-0.5 min-w-0 max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && (
                      <span className="text-[11px] text-surface-400 px-1 font-medium">{msg.author_name}</span>
                    )}

                    {/* Reply reference */}
                    {msg.reply_to_name && (
                      <div className={`flex items-center gap-1.5 text-[10px] text-surface-400 px-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <CornerUpRight size={10} />
                        <span className="font-medium">{msg.reply_to_name}</span>
                        <span className="truncate max-w-[120px] opacity-70">{msg.reply_to_content}</span>
                      </div>
                    )}

                    {/* Message bubble — click to show actions */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMessage(isActive ? null : msg.id);
                      }}
                      className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap cursor-pointer transition-all ${isMe
                          ? 'bg-primary-600 text-white rounded-tr-sm hover:bg-primary-700'
                          : 'bg-surface-100 text-surface-800 rounded-tl-sm hover:bg-surface-200'
                        } ${isActive ? 'ring-2 ring-primary-400/50' : ''}`}
                    >
                      {renderContent(msg.content)}
                    </div>

                    {/* Quick actions popup */}
                    {isActive && (
                      <div
                        className={`flex items-center gap-0.5 bg-white border border-surface-200 rounded-xl shadow-lg px-1 py-0.5 animate-in fade-in slide-in-from-bottom-1 duration-150 ${isMe ? 'self-end' : 'self-start'
                          }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => startReply(msg)}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-surface-600 hover:bg-surface-100 transition-colors cursor-pointer"
                          title="Reply"
                        >
                          <Reply size={13} />
                          <span className="hidden sm:inline">Reply</span>
                        </button>
                        <button
                          onClick={() => copyMessage(msg.content)}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-surface-600 hover:bg-surface-100 transition-colors cursor-pointer"
                          title="Copy"
                        >
                          <Copy size={13} />
                          <span className="hidden sm:inline">Copy</span>
                        </button>
                        {isMe && (
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete"
                          >
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
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-50 border-t border-surface-100 text-xs shrink-0">
              <CornerUpRight size={14} className="text-primary-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-surface-700">{replyTo.author_name}</span>
                <span className="text-surface-400 ml-2 truncate inline-block max-w-[200px] align-bottom">
                  {replyTo.content?.substring(0, 80)}
                </span>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="shrink-0 p-1 rounded hover:bg-surface-200 text-surface-400 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* @mention autocomplete */}
          {mentionQuery !== null && mentionMatches.length > 0 && (
            <div className="mx-3 mb-1 bg-white border border-surface-200 rounded-xl shadow-lg overflow-hidden shrink-0">
              {mentionMatches.map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => insertMention(m)}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors cursor-pointer ${idx === mentionIndex
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-surface-700 hover:bg-surface-50'
                    }`}
                >
                  <Avatar name={m.name} size="xs" />
                  <span className="font-medium">{m.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={sendMessage}
            className="flex items-center gap-2 px-3 py-3 border-t border-surface-100 shrink-0 bg-white"
          >
            {/* Emoji button */}
            <button
              ref={emojiButtonRef}
              type="button"
              onClick={openEmoji}
              className="shrink-0 p-2 rounded-xl text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors cursor-pointer"
            >
              <Smile size={20} />
            </button>

            <input
              ref={inputRef}
              value={text}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message... (type @ to mention)"
              className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 text-sm text-surface-800 placeholder-surface-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="shrink-0 p-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 transition-colors cursor-pointer"
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
            className="fixed z-50 bg-white border border-surface-200 rounded-2xl shadow-xl p-3"
            style={{ bottom: emojiPos.bottom, left: emojiPos.left, width: 264 }}
          >
            <div className="grid grid-cols-8 gap-1">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => pickEmoji(emoji)}
                  className="text-xl p-1.5 hover:bg-surface-100 rounded-lg transition-colors cursor-pointer leading-none"
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
