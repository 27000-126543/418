import { create } from 'zustand';
import type { Notification, AttendanceStatus, Meeting } from '@/types';
import { useMeetingStore } from './useMeetingStore';

const generateId = (): string => {
  return 'notif_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

const generateInitialNotifications = (meetings: Meeting[]): Notification[] => {
  const notifications: Notification[] = [];
  const now = new Date();

  meetings.forEach(meeting => {
    if (meeting.status === 'cancelled') return;

    meeting.attendees.forEach(attendee => {
      if (attendee.isHost) return;

      if (attendee.status === 'pending') {
        notifications.push({
          id: generateId(),
          type: 'invitation',
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          userId: attendee.userId,
          title: '新的会议邀请',
          content: `${meeting.attendees.find(a => a.isHost)?.user.name ?? '主持人'}邀请您参加「${meeting.title}」会议，请确认是否出席。`,
          createdAt: meeting.createdAt,
          read: false,
          actionRequired: true,
        });
      }

      const timeUntilStart = meeting.startTime.getTime() - now.getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (timeUntilStart > 0 && timeUntilStart < oneDayMs && meeting.status === 'scheduled') {
        const hours = Math.round(timeUntilStart / (60 * 60 * 1000));
        notifications.push({
          id: generateId(),
          type: 'reminder',
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          userId: attendee.userId,
          title: '会议即将开始',
          content: `「${meeting.title}」将在 ${hours} 小时后开始，请准时参加。地点：${meeting.room.name}`,
          createdAt: new Date(now.getTime() - 30 * 60 * 1000),
          read: attendee.status !== 'pending',
          actionRequired: false,
        });
      }
    });

    if (meeting.status === 'in-progress') {
      meeting.attendees.forEach(attendee => {
        notifications.push({
          id: generateId(),
          type: 'reminder',
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          userId: attendee.userId,
          title: '会议进行中',
          content: `「${meeting.title}」正在进行中，请尽快前往 ${meeting.room.name} 参会。`,
          createdAt: meeting.actualStartTime ?? now,
          read: false,
          actionRequired: false,
        });
      });
    }
  });

  return notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

interface NotificationStoreState {
  notifications: Notification[];
}

interface NotificationStoreComputed {
  getUnreadCount: () => number;
}

interface NotificationStoreActions {
  getNotificationsByUserId: (userId: string) => Notification[];
  getUnreadNotificationsByUserId: (userId: string) => Notification[];
  getNotificationsByType: (userId: string, type: Notification['type']) => Notification[];
  getNotificationsByMeetingId: (meetingId: string) => Notification[];
  markAsRead: (notificationId: string) => void;
  markAllAsRead: (userId?: string) => void;
  markAsUnread: (notificationId: string) => void;
  respondToInvitation: (
    notificationId: string,
    status: AttendanceStatus,
    onUpdateMeeting?: (meetingId: string, userId: string, status: AttendanceStatus) => void
  ) => Notification | undefined;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => Notification;
  addBulkNotifications: (
    notifications: Array<Omit<Notification, 'id' | 'createdAt' | 'read'>>
  ) => Notification[];
  removeNotification: (notificationId: string) => boolean;
  clearAllNotifications: (userId?: string) => void;
  initializeFromMeetings: (meetings: Meeting[]) => void;
}

export type NotificationStore = NotificationStoreState &
  NotificationStoreComputed &
  NotificationStoreActions;

export const useNotificationStore = create<NotificationStore>((set, get) => {
  let initialized = false;

  return {
    notifications: [],

    initializeFromMeetings: (meetings: Meeting[]) => {
      if (initialized) return;
      initialized = true;
      const notifications = generateInitialNotifications(meetings);
      set({ notifications });
    },

    getUnreadCount: () => {
      return get().notifications.filter(n => !n.read).length;
    },

    getNotificationsByUserId: (userId: string) => {
      return get().notifications
        .filter(n => n.userId === userId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    },

    getUnreadNotificationsByUserId: (userId: string) => {
      return get()
        .getNotificationsByUserId(userId)
        .filter(n => !n.read);
    },

    getNotificationsByType: (userId: string, type: Notification['type']) => {
      return get()
        .getNotificationsByUserId(userId)
        .filter(n => n.type === type);
    },

    getNotificationsByMeetingId: (meetingId: string) => {
      return get().notifications.filter(n => n.meetingId === meetingId);
    },

    markAsRead: (notificationId: string) => {
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
      }));
    },

    markAllAsRead: (userId?: string) => {
      set(state => ({
        notifications: state.notifications.map(n =>
          !userId || n.userId === userId ? { ...n, read: true } : n
        ),
      }));
    },

    markAsUnread: (notificationId: string) => {
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, read: false } : n
        ),
      }));
    },

    respondToInvitation: (
      notificationId: string,
      status: AttendanceStatus,
      onUpdateMeeting?: (meetingId: string, userId: string, status: AttendanceStatus) => void
    ) => {
      const notification = get().notifications.find(n => n.id === notificationId);
      if (!notification) return undefined;

      let updatedNotification: Notification | undefined;

      set(state => {
        const notifications = state.notifications.map(n => {
          if (n.id !== notificationId) return n;
          const statusText: Record<AttendanceStatus, string> = {
            confirmed: '已确认出席',
            tentative: '暂定出席',
            declined: '已谢绝邀请',
            late: '可能迟到',
            absent: '无法出席',
            pending: '待确认',
          };
          updatedNotification = {
            ...n,
            read: true,
            actionRequired: false,
            content: `${statusText[status]}：「${n.meetingTitle}」`,
          };
          return updatedNotification;
        });
        return { notifications };
      });

      useMeetingStore.getState().updateAttendanceStatus(
        notification.meetingId,
        notification.userId,
        status
      );

      if (onUpdateMeeting) {
        onUpdateMeeting(notification.meetingId, notification.userId, status);
      }

      return updatedNotification;
    },

    addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
      const newNotification: Notification = {
        ...notification,
        id: generateId(),
        createdAt: new Date(),
        read: false,
      };

      set(state => ({
        notifications: [newNotification, ...state.notifications],
      }));

      return newNotification;
    },

    addBulkNotifications: (
      items: Array<Omit<Notification, 'id' | 'createdAt' | 'read'>>
    ) => {
      const now = new Date();
      const newNotifications: Notification[] = items.map((n, index) => ({
        ...n,
        id: generateId(),
        createdAt: new Date(now.getTime() - index * 1000),
        read: false,
      }));

      set(state => ({
        notifications: [...newNotifications, ...state.notifications],
      }));

      return newNotifications;
    },

    removeNotification: (notificationId: string) => {
      const exists = get().notifications.some(n => n.id === notificationId);
      if (!exists) return false;

      set(state => ({
        notifications: state.notifications.filter(n => n.id !== notificationId),
      }));
      return true;
    },

    clearAllNotifications: (userId?: string) => {
      set(state => ({
        notifications: userId
          ? state.notifications.filter(n => n.userId !== userId)
          : [],
      }));
    },
  };
});
