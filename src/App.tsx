import { useEffect, useRef } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from '@/router';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { getUncompletedChecklistDetails, buildReminderContentForMeeting } from '@/services/notificationService';

function checkUpcomingMeetingReminders() {
  const meetingStore = useMeetingStore.getState();
  const notificationStore = useNotificationStore.getState();
  const now = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;

  const upcomingMeetings = meetingStore.meetings.filter(meeting => {
    if (meeting.status !== 'scheduled') return false;
    const timeUntilStart = meeting.startTime.getTime() - now.getTime();
    return timeUntilStart > 0 && timeUntilStart <= oneDayMs;
  });

  for (const meeting of upcomingMeetings) {
    const uncompletedDetails = getUncompletedChecklistDetails(meeting);
    const uncompletedCount = uncompletedDetails.length;
    if (uncompletedCount === 0) continue;

    const hosts = meeting.attendees.filter(a => a.isHost && a.status !== 'declined');

    for (const host of hosts) {
      const existingReminder = notificationStore.notifications.find(
        n => n.meetingId === meeting.id && n.type === 'reminder' && n.userId === host.userId
      );

      if (existingReminder) {
        const newContent = buildReminderContentForMeeting(meeting, true);
        if (existingReminder.content !== newContent) {
          notificationStore.updateNotificationContent(existingReminder.id, {
            content: newContent,
            actionRequired: uncompletedCount > 0,
          });
        }
      } else {
        const content = buildReminderContentForMeeting(meeting, true);
        notificationStore.addNotification({
          type: 'reminder',
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          userId: host.userId,
          title: `会议即将开始：${meeting.title}`,
          content,
          actionRequired: uncompletedCount > 0,
        });
      }
    }
  }
}

export default function App() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const meetings = useMeetingStore.getState().meetings;
    useNotificationStore.getState().initializeFromMeetings(meetings);

    checkUpcomingMeetingReminders();

    timerRef.current = setInterval(() => {
      checkUpcomingMeetingReminders();
    }, 5 * 60 * 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return <RouterProvider router={router} />;
}
