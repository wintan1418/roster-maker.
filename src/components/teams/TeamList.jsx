import { Users, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { LoadingBlock } from '@/components/ui/LoadingSpinner';
import TeamCard from '@/components/teams/TeamCard';

export default function TeamList({ teams = [], loading = false, onCreateTeam }) {
  if (loading) {
    return <LoadingBlock label="Loading teams..." />;
  }

  if (teams.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No teams yet"
        description="Create your first team to start organizing members, assigning roles, and building rosters."
        action={
          onCreateTeam && (
            <Button iconLeft={Plus} onClick={onCreateTeam}>
              Create Your First Team
            </Button>
          )
        }
      />
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  );
}
