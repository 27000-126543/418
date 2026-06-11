import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useUserStore } from '@/store/useUserStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { cn } from '@/lib/utils';
import { formatTime, formatDate } from '@/utils/dateUtils';
import type { Meeting, PreMeetingChecklistItem } from '@/types';
import {
  Clock,
  MapPin,
  FileText,
  Paperclip,
  Users,
  Coffee,
  Monitor,
  ClipboardCheck,
  Bell,
  Eye,
  Upload,
  Plus,
  CalendarClock,
  AlertTriangle,
} from 'lucide-react';

type ChecklistCategory = PreMeetingChecklistItem['category'];

const categoryConfig: Record<
  ChecklistCategory,
  { label: string; icon: typeof FileText; dotColor: string; completedColor: string }
> = {
  agenda: { label: '议程', icon: FileText, dotColor: 'bg-primary-500', completedColor: 'bg-primary-400' },
  material: { label: '材料', icon: Paperclip, dotColor: 'bg-accent-500', completedColor: 'bg-accent-400' },
  attendance: { label: '参会', icon: Users, dotColor: 'bg-success-500', completedColor: 'bg-success-500' },
  catering: { label: '餐饮', icon: Coffee, dotColor: 'bg-warning-500', completedColor: 'bg-warning-500' },
  device: { label: '设备', icon: Monitor, dotColor: 'bg-purple-500', completedColor: 'bg-purple-400' },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  high: { label: '高优先级', className: 'bg-danger-50 text-danger-500 border-danger-200' },
  medium: { label: '中优先级', className: 'bg-warning-50 text-warning-500 border-warning-200' },
  low: { label: '低优先级', className: 'bg-neutral-100 text-neutral-500 border-neutral-200' },
};

function getAutoDetectStatus(meeting: Meeting, category: ChecklistCategory): boolean {
  switch (category) {
    case 'agenda':
      return meeting.agenda.length > 0;
    case 'material':
      return meeting.materials.length > 0;
    case 'attendance': {
      if (meeting.attendees.length === 0) return false;
      const respondedCount = meeting.attendees.filter(a => a.status !== 'pending').length;
      return respondedCount / meeting.attendees.length >= 0.8;
    }
    case 'catering':
      return meeting.catering.length > 0 || meeting.cateringIds.length === 0;
    case 'device':
      return meeting.devices.length > 0 || meeting.deviceIds.length === 0;
    default:
      return false;
  }
}

function isWithin24Hours(startTime: Date): boolean {
  const diff = new Date(startTime).getTime() - Date.now();
  return diff > 0 && diff <= 24 * 60 * 60 * 1000;
}

function getChecklistProgress(meeting: Meeting) {
  const checklist = meeting.preMeetingChecklist ?? [];
  if (checklist.length === 0) return { completed: 0, total: 0, percent: 0 };

  const resolved = checklist.map(item => ({
    ...item,
    completed: item.autoDetect ? getAutoDetectStatus(meeting, item.category) : item.completed,
  }));
  const completed = resolved.filter(i => i.completed).length;
  return {
    completed,
    total: resolved.length,
    percent: resolved.length > 0 ? Math.round((completed / resolved.length) * 100) : 0,
  };
}

function getCategoryStatus(meeting: Meeting, category: ChecklistCategory): boolean {
  const checklist = meeting.preMeetingChecklist ?? [];
  const categoryItems = checklist.filter(i => i.category === category);
  if (categoryItems.length === 0) return getAutoDetectStatus(meeting, category);
  return categoryItems.every(
    item => item.autoDetect ? getAutoDetectStatus(meeting, item.category) : item.completed
  );
}

export default function PreMeetingWorkbench() {
  const navigate = useNavigate();
  const { getMeetingsByHostId } = useMeetingStore();
  const { currentUser } = useUserStore();
  const { addBulkNotifications } = useNotificationStore();

  const hostMeetings = useMemo(() => {
    if (!currentUser) return [];
    return getMeetingsByHostId(currentUser.id).filter(m => m.status === 'scheduled');
  }, [currentUser, getMeetingsByHostId]);

  const sortedMeetings = useMemo(() => {
    return [...hostMeetings].sort((a, b) => {
      const aWithin24 = isWithin24Hours(a.startTime);
      const bWithin24 = isWithin24Hours(b.startTime);
      if (aWithin24 && !bWithin24) return -1;
      if (!aWithin24 && bWithin24) return 1;
      return a.startTime.getTime() - b.startTime.getTime();
    });
  }, [hostMeetings]);

  const stats = useMemo(() => {
    const within24Count = sortedMeetings.filter(m => isWithin24Hours(m.startTime)).length;

    let uncompletedTodos = 0;
    sortedMeetings.forEach(m => {
      const checklist = m.preMeetingChecklist ?? [];
      checklist.forEach(item => {
        const isCompleted = item.autoDetect ? getAutoDetectStatus(m, item.category) : item.completed;
        if (!isCompleted) uncompletedTodos++;
      });
    });

    let pendingAttendees = 0;
    sortedMeetings.forEach(m => {
      pendingAttendees += m.attendees.filter(a => a.status === 'pending' && !a.isHost).length;
    });

    const materialGapCount = sortedMeetings.filter(m => m.materials.length === 0).length;

    return { within24Count, uncompletedTodos, pendingAttendees, materialGapCount };
  }, [sortedMeetings]);

  const handleRemindAttendees = (meeting: Meeting) => {
    const pendingAttendees = meeting.attendees.filter(a => a.status === 'pending' && !a.isHost);
    if (pendingAttendees.length === 0) return;

    const notifications = pendingAttendees.map(attendee => ({
      type: 'reminder' as const,
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      userId: attendee.userId,
      title: '会议参会提醒',
      content: `主持人提醒您：「${meeting.title}」即将开始，请尽快确认是否出席。`,
      actionRequired: true,
    }));

    addBulkNotifications(notifications);
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center animate-fade-in">
          <ClipboardCheck className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
          <h2 className="text-xl font-bold text-neutral-600 mb-2">请先登录</h2>
          <p className="text-sm text-neutral-400">登录后可查看您的会前工作台</p>
        </div>
      </div>
    );
  }

  if (hostMeetings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center animate-fade-in">
          <ClipboardCheck className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
          <h2 className="text-xl font-bold text-neutral-600 mb-2">暂无主持的会议</h2>
          <p className="text-sm text-neutral-400 mb-6">发起会议后，会前工作台将帮助您高效处理会前准备</p>
          <button onClick={() => navigate('/meetings/create')} className="btn-primary">
            <Plus className="w-4 h-4" />
            发起会议
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-stagger">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800 mb-1">会前工作台</h1>
        <p className="text-sm text-neutral-500">集中处理即将主持的会议准备工作，确保万无一失</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<CalendarClock className="w-5 h-5" />}
          label="即将开始"
          value={stats.within24Count}
          suffix="场"
          variant="blue"
        />
        <StatCard
          icon={<ClipboardCheck className="w-5 h-5" />}
          label="未完成待办"
          value={stats.uncompletedTodos}
          suffix="项"
          variant="orange"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="参会响应缺口"
          value={stats.pendingAttendees}
          suffix="人"
          variant="cyan"
        />
        <StatCard
          icon={<Paperclip className="w-5 h-5" />}
          label="材料缺口"
          value={stats.materialGapCount}
          suffix="场"
          variant="red"
        />
      </div>

      <div className="space-y-4">
        {sortedMeetings.map((meeting, index) => {
          const progress = getChecklistProgress(meeting);
          const priority = priorityConfig[meeting.priority] ?? priorityConfig.low;
          const pendingCount = meeting.attendees.filter(a => a.status === 'pending' && !a.isHost).length;
          const within24 = isWithin24Hours(meeting.startTime);

          return (
            <div
              key={meeting.id}
              className="p-5 rounded-2xl bg-white border border-neutral-100 shadow-card hover:shadow-card-hover transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-bold text-neutral-800 truncate">
                      {meeting.title}
                    </h3>
                    <span className={cn('shrink-0 px-2 py-0.5 rounded-md text-[10px] font-medium border', priority.className)}>
                      {priority.label}
                    </span>
                    {within24 && (
                      <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-medium bg-accent-50 text-accent-600 border border-accent-200">
                        24h内
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(meeting.startTime)} {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {meeting.room.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {(Object.keys(categoryConfig) as ChecklistCategory[]).map(category => {
                    const config = categoryConfig[category];
                    const completed = getCategoryStatus(meeting, category);
                    return (
                      <div key={category} className="flex flex-col items-center gap-1" title={`${config.label}：${completed ? '已完成' : '未完成'}`}>
                        <div className={cn(
                          'w-3 h-3 rounded-full transition-colors',
                          completed ? config.completedColor : 'bg-neutral-200'
                        )} />
                        <span className="text-[10px] text-neutral-400">{config.label}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <ActionButton
                    icon={<Plus className="w-4 h-4" />}
                    label="添加议程"
                    onClick={() => navigate(`/meetings/${meeting.id}?tab=agenda`)}
                  />
                  <ActionButton
                    icon={<Upload className="w-4 h-4" />}
                    label="上传材料"
                    onClick={() => navigate(`/meetings/${meeting.id}?tab=agenda`)}
                  />
                  <ActionButton
                    icon={<Bell className="w-4 h-4" />}
                    label={`提醒参会人${pendingCount > 0 ? `(${pendingCount})` : ''}`}
                    onClick={() => handleRemindAttendees(meeting)}
                    disabled={pendingCount === 0}
                  />
                  <ActionButton
                    icon={<Eye className="w-4 h-4" />}
                    label="查看详情"
                    onClick={() => navigate(`/meetings/${meeting.id}`)}
                    variant="primary"
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-neutral-400">会前准备完成度</span>
                  <div className="flex items-center gap-2">
                    {progress.percent < 100 && within24 && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-danger-500">
                        <AlertTriangle className="w-3 h-3" />
                        未就绪
                      </span>
                    )}
                    <span className={cn(
                      'text-[10px] font-bold',
                      progress.percent === 100 ? 'text-success-500' : 'text-neutral-500'
                    )}>
                      {progress.percent}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500 ease-out',
                      progress.percent === 100
                        ? 'bg-gradient-to-r from-success-500 to-success-600'
                        : 'bg-gradient-accent'
                    )}
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix: string;
  variant: 'blue' | 'orange' | 'cyan' | 'red';
}) {
  const variantStyles = {
    blue: {
      iconBg: 'bg-primary-50',
      iconColor: 'text-primary-500',
      valueColor: 'text-primary-600',
    },
    orange: {
      iconBg: 'bg-warning-50',
      iconColor: 'text-warning-500',
      valueColor: 'text-warning-600',
    },
    cyan: {
      iconBg: 'bg-accent-50',
      iconColor: 'text-accent-500',
      valueColor: 'text-accent-600',
    },
    red: {
      iconBg: 'bg-danger-50',
      iconColor: 'text-danger-500',
      valueColor: 'text-danger-600',
    },
  };
  const style = variantStyles[variant];

  return (
    <div className="p-4 rounded-2xl bg-white border border-neutral-100 shadow-card">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', style.iconBg, style.iconColor)}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] text-neutral-400 font-medium">{label}</p>
          <p className={cn('text-xl font-bold', style.valueColor)}>
            {value}
            <span className="text-xs font-normal text-neutral-400 ml-0.5">{suffix}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled = false,
  variant = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary';
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        'group relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200',
        disabled && 'opacity-40 cursor-not-allowed',
        variant === 'primary'
          ? 'bg-gradient-primary text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30'
          : 'bg-neutral-50 text-neutral-500 hover:bg-primary-50 hover:text-primary-600 border border-neutral-100 hover:border-primary-200',
        !disabled && variant !== 'primary' && 'hover:-translate-y-0.5',
      )}
    >
      {icon}
      <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-neutral-800 text-white text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {label}
      </span>
    </button>
  );
}
