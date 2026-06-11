import { useState, useMemo, useCallback } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useUserStore } from '@/store/useUserStore';
import InvitationCard from '@/components/notifications/InvitationCard';
import ReminderSettings from '@/components/notifications/ReminderSettings';
import {
  Search,
  CheckCheck,
  Bell,
  Mail,
  Calendar,
  RefreshCw,
  ClipboardList,
  Inbox,
} from 'lucide-react';
import type { Notification, NotificationType, AttendanceStatus } from '@/types';

type FilterType = 'all' | NotificationType;

const TABS: { id: FilterType; label: string; icon: typeof Bell }[] = [
  { id: 'all', label: '全部', icon: Inbox },
  { id: 'invitation', label: '邀请', icon: Calendar },
  { id: 'reminder', label: '提醒', icon: Bell },
  { id: 'change', label: '变更', icon: RefreshCw },
  { id: 'decision', label: '决策', icon: ClipboardList },
];

export default function Notifications() {
  const {
    getNotificationsByUserId,
    getUnreadNotificationsByUserId,
    getNotificationsByType,
    markAllAsRead,
    respondToInvitation,
    markAsRead,
  } = useNotificationStore();

  const { updateAttendanceStatus, meetings } = useMeetingStore();
  const { currentUser } = useUserStore();

  const [activeTab, setActiveTab] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);

  const currentUserId = currentUser?.id ?? '';
  const userNotifications = useMemo(() => {
    return currentUserId ? getNotificationsByUserId(currentUserId) : [];
  }, [currentUserId, getNotificationsByUserId]);
  const unreadCount = useMemo(() => {
    return currentUserId ? getUnreadNotificationsByUserId(currentUserId).length : 0;
  }, [currentUserId, getUnreadNotificationsByUserId]);

  const filteredNotifications = useMemo(() => {
    let result = [...userNotifications];

    if (activeTab !== 'all') {
      result = result.filter(n => n.type === activeTab);
    }

    if (onlyUnread) {
      result = result.filter(n => !n.read);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        n =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [userNotifications, activeTab, onlyUnread, search]);

  const tabsCount = useMemo(() => {
    if (!currentUserId) {
      return {
        all: 0,
        invitation: 0,
        reminder: 0,
        change: 0,
        decision: 0,
      } as Record<FilterType, number>;
    }
    const map: Record<FilterType, number> = {
      all: userNotifications.length,
      invitation: getNotificationsByType(currentUserId, 'invitation').length,
      reminder: getNotificationsByType(currentUserId, 'reminder').length,
      change: getNotificationsByType(currentUserId, 'change').length,
      decision: getNotificationsByType(currentUserId, 'decision').length,
    };
    return map;
  }, [userNotifications, currentUserId, getNotificationsByType]);

  const unreadTabsCount = useMemo(() => {
    const map: Record<FilterType, number> = {
      all: unreadCount,
      invitation: userNotifications.filter(n => n.type === 'invitation' && !n.read).length,
      reminder: userNotifications.filter(n => n.type === 'reminder' && !n.read).length,
      change: userNotifications.filter(n => n.type === 'change' && !n.read).length,
      decision: userNotifications.filter(n => n.type === 'decision' && !n.read).length,
    };
    return map;
  }, [userNotifications, unreadCount]);

  const handleOpen = (n: Notification) => {
    if (!n.read) {
      markAsRead(n.id);
    }
  };

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead(currentUserId || undefined);
  }, [markAllAsRead, currentUserId]);

  const handleRespond = useCallback((notificationId: string, status: AttendanceStatus, _meetingId: string) => {
    respondToInvitation(
      notificationId,
      status,
      (mid: string, uid: string, s: AttendanceStatus) => {
        updateAttendanceStatus(mid, uid, s);
      }
    );
  }, [respondToInvitation, updateAttendanceStatus]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-neutral-800">通知中心</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-gradient-danger text-white text-xs font-bold shadow-md shadow-danger-500/30">
                {unreadCount} 条未读
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-500">
            管理您的会议邀请、提醒和决策通知
          </p>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
          className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed self-start sm:self-auto"
        >
          <CheckCheck className="w-4 h-4" />
          全部标为已读
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="p-1 rounded-2xl bg-white border border-neutral-100 shadow-card">
            <div className="flex flex-wrap gap-1 p-1 bg-neutral-50 rounded-xl">
              {TABS.map(tab => {
                const unread = unreadTabsCount[tab.id];
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-[90px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all relative ${
                      activeTab === tab.id
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {unread > 0 && (
                      <span
                        className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                          activeTab === tab.id
                            ? 'bg-gradient-primary text-white'
                            : 'bg-danger-500 text-white'
                        }`}
                      >
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-neutral-100 shadow-card flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className="input-base pl-9"
                placeholder="搜索通知..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 cursor-pointer hover:bg-neutral-50 transition-colors">
              <input
                type="checkbox"
                checked={onlyUnread}
                onChange={e => setOnlyUnread(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500/20"
              />
              <span className="text-xs font-medium text-neutral-600">
                仅显示未读
              </span>
            </label>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="p-16 rounded-2xl bg-white border border-neutral-100 shadow-card text-center">
              <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-10 h-10 text-neutral-300" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-700 mb-1">
                暂无通知
              </h3>
              <p className="text-sm text-neutral-400">
                {search || onlyUnread || activeTab !== 'all'
                  ? '尝试调整筛选条件'
                  : '所有活动通知将显示在这里'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((n, idx) => {
                const meeting = meetings.find(m => m.id === n.meetingId);
                const host = meeting?.attendees.find(a => a.isHost)?.user;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleOpen(n)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer animate-slide-up ${
                      n.read
                        ? 'bg-white border-neutral-100 hover:border-primary-100 hover:shadow-card'
                        : 'bg-gradient-to-r from-primary-50/60 to-white border-primary-100 shadow-sm hover:shadow-card'
                    }`}
                    style={{ animationDelay: `${idx * 20}ms` }}
                  >
                    <InvitationCard
                      notification={n}
                      meeting={meeting}
                      host={host}
                      onRespond={handleRespond}
                      onMarkRead={markAsRead}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-gradient-primary text-white shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5" />
              <h3 className="text-sm font-bold">通知概览</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '总通知', value: userNotifications.length, icon: Inbox },
                { label: '未读', value: unreadCount, icon: Mail, accent: true },
                {
                  label: '邀请',
                  value: tabsCount.invitation,
                  icon: Calendar,
                },
                {
                  label: '提醒',
                  value: tabsCount.reminder,
                  icon: Bell,
                },
              ].map(s => (
                <div
                  key={s.label}
                  className={`p-3 rounded-xl ${
                    s.accent ? 'bg-accent-500/20' : 'bg-white/10'
                  } backdrop-blur`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-white/70 mb-1">
                    <s.icon className="w-3 h-3" />
                    {s.label}
                  </div>
                  <div className="text-xl font-bold">{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          <ReminderSettings />
        </div>
      </div>
    </div>
  );
}
