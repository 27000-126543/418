import type { MeetingStatus, AttendanceStatus, MeetingPriority, RoomStatus, NotificationType, DeviceStatus } from '@/types';
import { cn } from '@/lib/utils';

type BadgeSize = 'sm' | 'md';

interface StatusBadgeBaseProps {
  size?: BadgeSize;
  className?: string;
  pulse?: boolean;
}

interface MeetingBadgeProps extends StatusBadgeBaseProps {
  type: 'meeting';
  status: MeetingStatus;
}

interface AttendanceBadgeProps extends StatusBadgeBaseProps {
  type: 'attendance';
  status: AttendanceStatus;
}

interface PriorityBadgeProps extends StatusBadgeBaseProps {
  type: 'priority';
  status: MeetingPriority;
}

interface RoomBadgeProps extends StatusBadgeBaseProps {
  type: 'room';
  status: RoomStatus;
}

interface NotificationBadgeProps extends StatusBadgeBaseProps {
  type: 'notification';
  status: NotificationType;
}

interface DeviceBadgeProps extends StatusBadgeBaseProps {
  type: 'device';
  status: DeviceStatus;
}

type StatusBadgeProps = MeetingBadgeProps | AttendanceBadgeProps | PriorityBadgeProps | RoomBadgeProps | NotificationBadgeProps | DeviceBadgeProps;

const meetingConfig: Record<MeetingStatus, { label: string; className: string; dot: string }> = {
  scheduled: {
    label: '待开始',
    className: 'bg-primary-50 text-primary-700 border-primary-200',
    dot: 'bg-primary-500',
  },
  'in-progress': {
    label: '进行中',
    className: 'bg-accent-50 text-accent-700 border-accent-200',
    dot: 'bg-accent-500',
  },
  completed: {
    label: '已完成',
    className: 'bg-success-50 text-success-600 border-success-200',
    dot: 'bg-success-500',
  },
  cancelled: {
    label: '已取消',
    className: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    dot: 'bg-neutral-400',
  },
};

const attendanceConfig: Record<AttendanceStatus, { label: string; className: string; dot: string }> = {
  confirmed: {
    label: '已确认',
    className: 'bg-success-50 text-success-600 border-success-200',
    dot: 'bg-success-500',
  },
  tentative: {
    label: '待定',
    className: 'bg-warning-50 text-warning-600 border-warning-200',
    dot: 'bg-warning-500',
  },
  declined: {
    label: '已拒绝',
    className: 'bg-danger-50 text-danger-500 border-danger-200',
    dot: 'bg-danger-500',
  },
  late: {
    label: '迟到',
    className: 'bg-orange-50 text-orange-600 border-orange-200',
    dot: 'bg-orange-500',
  },
  absent: {
    label: '缺席',
    className: 'bg-red-50 text-red-600 border-red-200',
    dot: 'bg-red-500',
  },
  pending: {
    label: '待回复',
    className: 'bg-neutral-50 text-neutral-600 border-neutral-200',
    dot: 'bg-neutral-400',
  },
};

const priorityConfig: Record<MeetingPriority, { label: string; className: string; dot: string }> = {
  high: {
    label: '高优先级',
    className: 'bg-gradient-to-r from-red-50 to-orange-50 text-red-600 border-red-200',
    dot: 'bg-red-500',
  },
  medium: {
    label: '中优先级',
    className: 'bg-gradient-to-r from-warning-50 to-yellow-50 text-warning-600 border-warning-200',
    dot: 'bg-warning-500',
  },
  low: {
    label: '低优先级',
    className: 'bg-gradient-to-r from-primary-50 to-blue-50 text-primary-600 border-primary-200',
    dot: 'bg-primary-500',
  },
};

const roomConfig: Record<RoomStatus, { label: string; className: string; dot: string }> = {
  available: {
    label: '可用',
    className: 'bg-success-50 text-success-600 border-success-200',
    dot: 'bg-success-500',
  },
  occupied: {
    label: '占用中',
    className: 'bg-danger-50 text-danger-500 border-danger-200',
    dot: 'bg-danger-500',
  },
  maintenance: {
    label: '维护中',
    className: 'bg-warning-50 text-warning-600 border-warning-200',
    dot: 'bg-warning-500',
  },
};

const notificationConfig: Record<NotificationType, { label: string; className: string; dot: string }> = {
  invitation: {
    label: '会议邀请',
    className: 'bg-primary-50 text-primary-700 border-primary-200',
    dot: 'bg-primary-500',
  },
  reminder: {
    label: '会议提醒',
    className: 'bg-accent-50 text-accent-700 border-accent-200',
    dot: 'bg-accent-500',
  },
  change: {
    label: '变更通知',
    className: 'bg-warning-50 text-warning-600 border-warning-200',
    dot: 'bg-warning-500',
  },
  decision: {
    label: '决策记录',
    className: 'bg-success-50 text-success-600 border-success-200',
    dot: 'bg-success-500',
  },
};

const deviceConfig: Record<DeviceStatus, { label: string; className: string; dot: string }> = {
  available: {
    label: '正常',
    className: 'bg-success-50 text-success-600 border-success-200',
    dot: 'bg-success-500',
  },
  'in-use': {
    label: '使用中',
    className: 'bg-primary-50 text-primary-600 border-primary-200',
    dot: 'bg-primary-500',
  },
  faulty: {
    label: '故障',
    className: 'bg-danger-50 text-danger-500 border-danger-200',
    dot: 'bg-danger-500',
  },
  maintenance: {
    label: '维护中',
    className: 'bg-warning-50 text-warning-600 border-warning-200',
    dot: 'bg-warning-500',
  },
};

const sizeConfig: Record<BadgeSize, { padding: string; text: string; dot: string }> = {
  sm: {
    padding: 'px-2 py-0.5',
    text: 'text-xs',
    dot: 'h-1.5 w-1.5',
  },
  md: {
    padding: 'px-3 py-1.5',
    text: 'text-sm',
    dot: 'h-2 w-2',
  },
};

function getConfig(props: StatusBadgeProps) {
  switch (props.type) {
    case 'meeting':
      return meetingConfig[props.status];
    case 'attendance':
      return attendanceConfig[props.status];
    case 'priority':
      return priorityConfig[props.status];
    case 'room':
      return roomConfig[props.status];
    case 'notification':
      return notificationConfig[props.status];
    case 'device':
      return deviceConfig[props.status];
  }
}

export default function StatusBadge(props: StatusBadgeProps) {
  const { size = 'sm', className, pulse = false } = props;
  const config = getConfig(props);
  const sizeStyles = sizeConfig[size];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-all',
        config.className,
        sizeStyles.padding,
        sizeStyles.text,
        pulse && 'animate-pulse',
        className,
      )}
    >
      <span
        className={cn(
          'shrink-0 rounded-full',
          config.dot,
          sizeStyles.dot,
          pulse && 'animate-ping',
        )}
      />
      {config.label}
    </span>
  );
}
