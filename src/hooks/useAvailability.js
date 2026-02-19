import { useState, useCallback, useMemo } from 'react';
import {
  format,
  eachDayOfInterval,
  parseISO,
} from 'date-fns';

/**
 * Format a date into a consistent key string (yyyy-MM-dd).
 */
function toKey(date) {
  if (typeof date === 'string') return date;
  return format(date, 'yyyy-MM-dd');
}

/**
 * Hook for managing availability state.
 *
 * State shape:
 *   availabilityMap: { [userId]: { [dateKey]: { available: boolean, reason: string } } }
 *
 * @param {string}  userId       - The current user ID
 * @param {Object}  initialData  - Optional initial availability map
 * @returns {Object} Availability state and actions
 */
export default function useAvailability(userId = 'current-user', initialData = {}) {
  const [availabilityMap, setAvailabilityMap] = useState(() => {
    // Merge initial data if provided
    if (Object.keys(initialData).length > 0) {
      return initialData;
    }
    // Start with empty map for the current user
    return { [userId]: {} };
  });

  /**
   * Toggle availability for a single date.
   * If currently available (or not set), mark as unavailable. If unavailable, mark as available.
   */
  const toggleAvailability = useCallback(
    (date, reason = '') => {
      const dateKey = toKey(date);

      setAvailabilityMap((prev) => {
        const userMap = prev[userId] || {};
        const current = userMap[dateKey];

        const isCurrentlyAvailable = current ? current.available : true;

        return {
          ...prev,
          [userId]: {
            ...userMap,
            [dateKey]: {
              available: !isCurrentlyAvailable,
              reason: isCurrentlyAvailable ? reason : '',
            },
          },
        };
      });
    },
    [userId]
  );

  /**
   * Set availability for a specific date with explicit value.
   */
  const setAvailability = useCallback(
    (date, isAvailable, reason = '') => {
      const dateKey = toKey(date);

      setAvailabilityMap((prev) => {
        const userMap = prev[userId] || {};
        return {
          ...prev,
          [userId]: {
            ...userMap,
            [dateKey]: {
              available: isAvailable,
              reason: isAvailable ? '' : reason,
            },
          },
        };
      });
    },
    [userId]
  );

  /**
   * Bulk set availability for a date range.
   *
   * @param {Date|string} startDate
   * @param {Date|string} endDate
   * @param {boolean}     isAvailable
   * @param {string}      reason       - Optional reason (only used when marking unavailable)
   */
  const setAvailabilityRange = useCallback(
    (startDate, endDate, isAvailable, reason = '') => {
      const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
      const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

      const days = eachDayOfInterval({ start, end });

      setAvailabilityMap((prev) => {
        const userMap = { ...(prev[userId] || {}) };

        days.forEach((day) => {
          const dateKey = toKey(day);
          userMap[dateKey] = {
            available: isAvailable,
            reason: isAvailable ? '' : reason,
          };
        });

        return {
          ...prev,
          [userId]: userMap,
        };
      });
    },
    [userId]
  );

  /**
   * Check if a specific user is available on a given date.
   *
   * @param {Date|string} date
   * @param {string}      checkUserId - Defaults to current userId
   * @returns {{ available: boolean, reason: string } | null}
   *          Returns null if no availability has been set for that date.
   */
  const getAvailabilityForDate = useCallback(
    (date, checkUserId) => {
      const uid = checkUserId || userId;
      const dateKey = toKey(date);
      const userMap = availabilityMap[uid];

      if (!userMap || !(dateKey in userMap)) {
        return null; // Not set
      }

      return userMap[dateKey];
    },
    [availabilityMap, userId]
  );

  /**
   * Get all availability entries for a user.
   */
  const getUserAvailability = useCallback(
    (checkUserId) => {
      const uid = checkUserId || userId;
      return availabilityMap[uid] || {};
    },
    [availabilityMap, userId]
  );

  /**
   * Clear all availability for a user.
   */
  const clearAvailability = useCallback(
    (clearUserId) => {
      const uid = clearUserId || userId;
      setAvailabilityMap((prev) => ({
        ...prev,
        [uid]: {},
      }));
    },
    [userId]
  );

  /**
   * Count of dates marked as available vs unavailable for the current user.
   */
  const stats = useMemo(() => {
    const userMap = availabilityMap[userId] || {};
    const entries = Object.values(userMap);
    const available = entries.filter((e) => e.available).length;
    const unavailable = entries.filter((e) => !e.available).length;
    const total = entries.length;

    return { available, unavailable, total };
  }, [availabilityMap, userId]);

  return {
    availabilityMap,
    toggleAvailability,
    setAvailability,
    setAvailabilityRange,
    getAvailabilityForDate,
    getUserAvailability,
    clearAvailability,
    stats,
  };
}
