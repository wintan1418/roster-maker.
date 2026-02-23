import useAuthStore from '@/stores/authStore';
import AvailabilityEditor from '@/components/availability/AvailabilityEditor';
import MemberAvailabilityView from '@/components/availability/MemberAvailabilityView';

export default function AvailabilityPage() {
  const { orgRole } = useAuthStore();
  const isAdmin = orgRole === 'super_admin' || orgRole === 'team_admin';

  return (
    <div className="space-y-10">
      <MemberAvailabilityView />
      {isAdmin && <AvailabilityEditor />}
    </div>
  );
}
