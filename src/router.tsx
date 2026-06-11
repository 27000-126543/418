import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import MeetingCreate from '@/pages/MeetingCreate';
import MeetingDetail from '@/pages/MeetingDetail';
import MeetingList from '@/pages/MeetingList';
import Notifications from '@/pages/Notifications';
import Reports from '@/pages/Reports';
import Statistics from '@/pages/Statistics';
import Settings from '@/pages/Settings';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'meetings',
        children: [
          {
            index: true,
            element: <MeetingList />,
          },
          {
            path: 'create',
            element: <MeetingCreate />,
          },
          {
            path: ':id',
            element: <MeetingDetail />,
          },
          {
            path: ':id/edit',
            element: <MeetingCreate />,
          },
        ],
      },
      {
        path: 'notifications',
        element: <Notifications />,
      },
      {
        path: 'reports',
        element: <Reports />,
      },
      {
        path: 'statistics',
        element: <Statistics />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

export default router;
