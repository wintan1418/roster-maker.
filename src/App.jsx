import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import AppLayout from './components/layout/AppLayout';
import PublicLayout from './components/layout/PublicLayout';
import RequireAdmin from './components/layout/RequireAdmin';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AuthCallback from './pages/AuthCallback';
import JoinPage from './pages/JoinPage';
import InvitePage from './pages/InvitePage';
import Dashboard from './pages/Dashboard';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage';
import RostersPage from './pages/RostersPage';
import RosterEditorPage from './pages/RosterEditorPage';
import OrgSettings from './pages/OrgSettings';
import MemberSchedulePage from './pages/MemberSchedulePage';
import PublicRosterPage from './pages/PublicRosterPage';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            background: '#1e293b',
            color: '#f8fafc',
            fontSize: '14px',
          },
        }}
      />

      <Routes>
        {/* Public standalone pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/join/:joinToken" element={<JoinPage />} />
        <Route path="/invite/:token" element={<InvitePage />} />

        {/* Authenticated app routes (inside AppLayout) */}
        <Route element={<AppLayout />}>
          {/* Available to ALL authenticated users */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-schedule" element={<MemberSchedulePage />} />

          {/* Admin-only routes — members get redirected to /dashboard */}
          <Route element={<RequireAdmin />}>
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
            <Route path="/rosters" element={<RostersPage />} />
            <Route path="/rosters/new" element={<RosterEditorPage />} />
            <Route path="/rosters/:rosterId" element={<RosterEditorPage />} />
            <Route path="/org/settings" element={<OrgSettings />} />
          </Route>
        </Route>

        {/* Public shared roster routes (inside PublicLayout) */}
        <Route element={<PublicLayout />}>
          <Route path="/r/:shareToken" element={<PublicRosterPage />} />
          <Route path="/r/:shareToken/me" element={<PublicRosterPage />} />
        </Route>

        {/* 404 catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
