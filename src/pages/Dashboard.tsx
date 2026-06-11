import { useEffect } from 'react';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useUserStore } from '@/store/useUserStore';
import KPICard from '@/components/common/KPICard';
import MeetingTimeline from '@/components/dashboard/MeetingTimeline';
import PendingInvitations from '@/components/dashboard/PendingInvitations';
import UsageTrendChart from '@/components/dashboard/UsageTrendChart';
import {
  Calendar,
  Percent,
  Mail,
  UserCheck,
  Plus,
  FileBarChart,
  BarChart3,
  CalendarPlus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getLatestStatistics } from '@/data/statistics';

export default function Dashboard() {
  const { getTodayMeetings, meetings, updateAttendanceStatus } = useMeetingStore();
  const {
    notifications,
    getNotificationsByUserId,
    markAsRead,
    respondToInvitation,
    initializeFromMeetings,
  } = useNotificationStore();
  const { currentUser } = useUserStore();
  const stats = getLatestStatistics();

  useEffect(() => {
    if (notifications.length === 0 && meetings.length > 0) {
      initializeFromMeetings(meetings);
    }
  }, [meetings, notifications.length, initializeFromMeetings]);

  const todayMeetings = getTodayMeetings();
  const userNotifications = currentUser
    ? getNotificationsByUserId(currentUser.id)
    : [];
  const pendingCount = userNotifications.filter(
    n => n.type === 'invitation' && n.actionRequired
  ).length;

  const confirmedAttendance = todayMeetings.reduce(
    (sum, m) =>
      sum + m.attendees.filter(a => a.status === 'confirmed').length,
    0
  );
  const totalAttendance = todayMeetings.reduce(
    (sum, m) => sum + m.attendees.length,
    0
  );
  const todayAttendanceRate =
    totalAttendance > 0
      ? Math.round((confirmedAttendance / totalAttendance) * 1000) / 10
      : 0;

  const today = new Date();
  const greeting = (() => {
    const h = today.getHours();
    if (h < 6) return '凌晨好';
    if (h < 12) return '早上好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    return '晚上好';
  })();

  const handleRespond = (
    notificationId: string,
    status: 'confirmed' | 'declined'
  ) => {
    respondToInvitation(notificationId, status, (meetingId, userId, s) => {
      updateAttendanceStatus(meetingId, userId, s);
    });
  };

  const quickActions = [
    { icon: CalendarPlus, label: '发起会议', to: '/meetings/create', color: 'primary' as const },
    { icon: Calendar, label: '会议列表', to: '/meetings', color: 'accent' as const },
    { icon: FileBarChart, label: '报表导出', to: '/reports', color: 'success' as const },
    { icon: BarChart3, label: '数据统计', to: '/statistics', color: 'warning' as const },
  ];

  return (
    <div className="space-y-6 animate-stagger">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-1">
            {greeting}，{currentUser?.name?.split('')?.[0] ?? ''}总 👋
          </h1>
          <p className="text-sm text-neutral-500">
            今天是 {today.toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
            ，您共有 <span className="font-semibold text-primary-600">{todayMeetings.length}</span> 场会议安排
          </p>
        </div>
        <Link to="/meetings/create" className="btn-primary shrink-0">
          <Plus className="w-4 h-4" />
          立即发起会议
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="今日会议"
          value={todayMeetings.length}
          icon={<Calendar className="w-6 h-6" />}
          suffix="场"
          trend={8.5}
          trendLabel="较昨日"
          variant="blue"
        />
        <KPICard
          title="平均利用率"
          value={stats.averageAttendanceRate}
          suffix="%"
          icon={<Percent className="w-6 h-6" />}
          trend={5.2}
          trendLabel="较上月"
          variant="cyan"
        />
        <KPICard
          title="待处理邀请"
          value={pendingCount}
          icon={<Mail className="w-6 h-6" />}
          suffix="条"
          trend={-15}
          trendLabel="较昨日"
          variant="orange"
        />
        <KPICard
          title="月度出席率"
          value={todayAttendanceRate || stats.averageAttendanceRate}
          suffix="%"
          icon={<UserCheck className="w-6 h-6" />}
          trend={3.8}
          trendLabel="较上月"
          variant="green"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map(action => {
          const colorClass = {
            primary: 'from-primary-500 to-primary-600 shadow-primary-500/30',
            accent: 'from-accent-500 to-accent-600 shadow-accent-500/30',
            success: 'from-success-500 to-success-600 shadow-success-500/30',
            warning: 'from-warning-500 to-warning-600 shadow-warning-500/30',
          }[action.color];
          return (
            <Link
              key={action.label}
              to={action.to}
              className="p-4 rounded-2xl bg-white border border-neutral-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group flex items-center gap-3"
            >
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colorClass} shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-800 group-hover:text-primary-600 transition-colors">
                  {action.label}
                </div>
                <div className="text-[10px] text-neutral-400">点击进入</div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-neutral-800">今日会议日程</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                点击卡片查看详情或进行操作
              </p>
            </div>
            <Link
              to="/meetings"
              className="text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors flex items-center gap-1"
            >
              查看全部
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
          <MeetingTimeline meetings={todayMeetings} />
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-neutral-800">待处理邀请</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {pendingCount > 0 ? `您有 ${pendingCount} 条待响应邀请` : '暂无待处理事项'}
                </p>
              </div>
              <Link
                to="/notifications"
                className="text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors"
              >
                全部 →
              </Link>
            </div>
            <PendingInvitations
              invitations={userNotifications}
              onRespond={handleRespond}
            />
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-neutral-800">近7日趋势图</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              月度会议数量与时长变化趋势
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-500" />
              <span className="text-neutral-500">会议数</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-primary-500" style={{ borderStyle: 'dashed' }} />
              <span className="text-neutral-500">会议时长</span>
            </div>
          </div>
        </div>
        <div className="h-64">
          <UsageTrendChart />
        </div>
      </div>
    </div>
  );
}
