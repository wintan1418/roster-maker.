import { useState, useCallback } from 'react';
import { isMemberAvailable, getDemoMembersForTeam } from '@/lib/demoData';

/**
 * Shuffle algorithm hook for roster auto-assignment.
 *
 * Algorithm:
 *   For each event, for each role:
 *     1. Get eligible members (has role + available on date + not already assigned to another role in this event)
 *     2. Sort by: assignment_count ASC, then last_assigned_date ASC (least-used first)
 *     3. Pick top candidate
 *     4. Record the assignment and update tracking counts
 *
 * Respects manual assignments (never overrides them).
 */
export default function useShuffle() {
  const [isShuffling, setIsShuffling] = useState(false);

  /**
   * Run the shuffle algorithm.
   *
   * @param {Object} params
   * @param {Array}  params.events       - Array of event objects { id, date, name }
   * @param {Array}  params.roles        - Array of role objects { id, name }
   * @param {string} params.teamId       - The team ID for member lookup
   * @param {Object} params.currentAssignments - Current assignments map: { `${eventId}-${roleId}`: { memberId, manual } }
   * @param {string} params.mode         - 'all' | 'empty_only'
   *   - 'all': Clear all auto-assignments then re-shuffle everything
   *   - 'empty_only': Only fill empty cells
   *
   * @returns {Object} { newAssignments, assignmentsMade }
   */
  const shuffle = useCallback(({ events, roles, teamId, currentAssignments, mode = 'all' }) => {
    setIsShuffling(true);

    return new Promise((resolve) => {
      // Simulate a brief processing delay for visual feedback
      setTimeout(() => {
        const members = getDemoMembersForTeam(teamId);

        // Build the working assignments map
        let workingAssignments = { ...currentAssignments };

        if (mode === 'all') {
          // Remove all auto (non-manual) assignments
          const cleaned = {};
          for (const [key, value] of Object.entries(workingAssignments)) {
            if (value.manual) {
              cleaned[key] = value;
            }
          }
          workingAssignments = cleaned;
        }

        // Track how many times each member has been assigned across the roster
        const assignmentCounts = {};
        const lastAssignedEventIndex = {};

        // Initialize counts from existing (manual) assignments
        members.forEach((m) => {
          assignmentCounts[m.id] = 0;
          lastAssignedEventIndex[m.id] = -1;
        });

        // Count existing assignments
        for (const [key, value] of Object.entries(workingAssignments)) {
          if (value.memberId) {
            assignmentCounts[value.memberId] = (assignmentCounts[value.memberId] || 0) + 1;
            // Parse event index from the key
            const eventId = key.split('-role-')[0];
            const eventIdx = events.findIndex((e) => e.id === eventId);
            if (eventIdx > (lastAssignedEventIndex[value.memberId] ?? -1)) {
              lastAssignedEventIndex[value.memberId] = eventIdx;
            }
          }
        }

        let assignmentsMade = 0;

        // Process each event in chronological order
        events.forEach((event, eventIndex) => {
          // Track who is already assigned to this event (in any role)
          const assignedToThisEvent = new Set();
          for (const [key, value] of Object.entries(workingAssignments)) {
            if (key.startsWith(event.id + '-') && value.memberId) {
              assignedToThisEvent.add(value.memberId);
            }
          }

          // Process each role
          roles.forEach((role) => {
            const cellKey = `${event.id}-${role.id}`;

            // Skip if already assigned
            if (workingAssignments[cellKey]?.memberId) {
              return;
            }

            // Get eligible members for this role on this date
            const eligible = members.filter((m) => {
              // Must have this role
              if (!m.roleIds.includes(role.id)) return false;
              // Must be available on this date
              if (!isMemberAvailable(m.id, event.date)) return false;
              // Must not already be assigned to another role in this event
              if (assignedToThisEvent.has(m.id)) return false;
              return true;
            });

            if (eligible.length === 0) return;

            // Sort by: assignment count ASC, then last assigned event index ASC
            eligible.sort((a, b) => {
              const countDiff = (assignmentCounts[a.id] || 0) - (assignmentCounts[b.id] || 0);
              if (countDiff !== 0) return countDiff;

              const lastA = lastAssignedEventIndex[a.id] ?? -1;
              const lastB = lastAssignedEventIndex[b.id] ?? -1;
              return lastA - lastB;
            });

            // Pick the top candidate
            const chosen = eligible[0];

            workingAssignments[cellKey] = {
              memberId: chosen.id,
              manual: false,
            };

            // Update tracking
            assignmentCounts[chosen.id] = (assignmentCounts[chosen.id] || 0) + 1;
            lastAssignedEventIndex[chosen.id] = eventIndex;
            assignedToThisEvent.add(chosen.id);
            assignmentsMade++;
          });
        });

        setIsShuffling(false);
        resolve({ newAssignments: workingAssignments, assignmentsMade });
      }, 600); // 600ms delay for animation
    });
  }, []);

  /**
   * Clear all auto-assignments, keeping only manual ones.
   */
  const clearAutoAssignments = useCallback((currentAssignments) => {
    const cleaned = {};
    let removedCount = 0;

    for (const [key, value] of Object.entries(currentAssignments)) {
      if (value.manual) {
        cleaned[key] = value;
      } else {
        removedCount++;
      }
    }

    return { newAssignments: cleaned, removedCount };
  }, []);

  return { shuffle, clearAutoAssignments, isShuffling };
}
