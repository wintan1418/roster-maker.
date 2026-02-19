import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import RosterList from '@/components/roster/RosterList';
import { DEMO_ROSTERS } from '@/lib/demoData';

export default function RostersPage() {
  const navigate = useNavigate();
  const [rosters] = useState(DEMO_ROSTERS);

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
      <RosterList
        rosters={rosters}
        onCreateNew={handleCreateNew}
      />
    </div>
  );
}
