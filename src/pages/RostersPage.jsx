import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import RosterList from '@/components/roster/RosterList';
import { LoadingBlock } from '@/components/ui/LoadingSpinner';
import useAuthStore from '@/stores/authStore';
import useRosterStore from '@/stores/rosterStore';

export default function RostersPage() {
  const navigate = useNavigate();
  const orgId = useAuthStore((s) => s.orgId);
  const rosters = useRosterStore((s) => s.rosters);
  const loading = useRosterStore((s) => s.loading);
  const fetchOrgRosters = useRosterStore((s) => s.fetchOrgRosters);

  useEffect(() => {
    if (orgId) {
      fetchOrgRosters(orgId);
    }
  }, [orgId, fetchOrgRosters]);

  const handleCreateNew = () => {
    navigate('/rosters/new');
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Rosters</h1>
          <p className="text-sm text-surface-500 mt-1">
            Create and manage duty rosters for your teams.
          </p>
        </div>
        <Button
          variant="primary"
          iconLeft={Plus}
          onClick={handleCreateNew}
        >
          New Roster
        </Button>
      </div>

      {/* Roster list */}
      {loading ? (
        <LoadingBlock label="Loading rosters..." />
      ) : (
        <RosterList
          rosters={rosters}
          onCreateNew={handleCreateNew}
        />
      )}
    </div>
  );
}
