import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

const SYSTEM_USER = '00000000-0000-0000-0000-000000000000';

function seenKey(userId, teamId) {
  return `chatSeen_${userId}_${teamId}`;
}

function includesMention(content, userName) {
  if (!content || !userName) return false;
  return content.toLowerCase().includes(`@${userName.toLowerCase()}`);
}

function tryBrowserNotif(title, body) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body: body?.substring(0, 100), icon: '/favicon.ico' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((p) => {
      if (p === 'granted') {
        new Notification(title, { body: body?.substring(0, 100), icon: '/favicon.ico' });
      }
    });
  }
}

const useChatNotifStore = create((set, get) => ({
  unreadCounts: {},  // { [teamId]: number }
  hasMention: {},    // { [teamId]: boolean }
  _channels: [],
  _initialized: false,

  init: async (userId, userName) => {
    if (!supabase || !userId || get()._initialized) return;

    // Fetch all teams the user belongs to
    const { data: memberships } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId);

    if (!memberships?.length) {
      set({ _initialized: true });
      return;
    }

    const teamIds = memberships.map((m) => m.team_id);
    const unreadCounts = {};
    const hasMention = {};

    // Count unread messages per team since last-seen
    await Promise.all(
      teamIds.map(async (teamId) => {
        const since = localStorage.getItem(seenKey(userId, teamId)) || new Date(0).toISOString();
        const { data: msgs } = await supabase
          .from('team_messages')
          .select('user_id, content')
          .eq('team_id', teamId)
          .gt('created_at', since)
          .neq('user_id', userId)
          .neq('user_id', SYSTEM_USER);

        unreadCounts[teamId] = msgs?.length ?? 0;
        hasMention[teamId] = msgs?.some((m) => includesMention(m.content, userName)) ?? false;
      })
    );

    // Subscribe to realtime for each team
    const channels = teamIds.map((teamId) =>
      supabase
        .channel(`chatnotif-${teamId}-${userId.slice(0, 8)}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'team_messages',
            filter: `team_id=eq.${teamId}`,
          },
          (payload) => {
            const msg = payload.new;
            if (msg.user_id === userId || msg.user_id === SYSTEM_USER) return;

            // Only count if newer than last-seen
            const since = localStorage.getItem(seenKey(userId, teamId));
            if (since && msg.created_at <= since) return;

            set((state) => ({
              unreadCounts: {
                ...state.unreadCounts,
                [teamId]: (state.unreadCounts[teamId] || 0) + 1,
              },
            }));

            // Check for @mention
            if (includesMention(msg.content, userName)) {
              set((state) => ({
                hasMention: { ...state.hasMention, [teamId]: true },
              }));
              tryBrowserNotif(`${msg.author_name} mentioned you`, msg.content);
              toast(`${msg.author_name} mentioned you in chat`, {
                icon: '🔔',
                duration: 6000,
                style: { background: '#1e293b', color: '#f8fafc', fontSize: '14px', borderRadius: '12px' },
              });
            }
          }
        )
        .subscribe()
    );

    set({ unreadCounts, hasMention, _channels: channels, _initialized: true });
  },

  markRead: (userId, teamId) => {
    if (!userId || !teamId) return;
    localStorage.setItem(seenKey(userId, teamId), new Date().toISOString());
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [teamId]: 0 },
      hasMention: { ...state.hasMention, [teamId]: false },
    }));
  },

  cleanup: () => {
    if (!supabase) return;
    get()._channels.forEach((ch) => supabase.removeChannel(ch));
    set({ _channels: [], _initialized: false, unreadCounts: {}, hasMention: {} });
  },
}));

export default useChatNotifStore;
