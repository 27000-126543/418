import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from '@/router';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function App() {
  useEffect(() => {
    const meetings = useMeetingStore.getState().meetings;
    useNotificationStore.getState().initializeFromMeetings(meetings);
  }, []);

  return <RouterProvider router={router} />;
}
