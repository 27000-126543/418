import { useState } from 'react';
import { Crown, CheckCircle2, HelpCircle, Clock, XCircle, XSquare, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Attendee, AttendanceStatus } from '@/types';

interface AttendanceGridProps {
  attendees: Attendee[];
  onStatusChange?: (userId: string, status: AttendanceStatus) => void;
  readOnly?: boolean;
}

type FilterType = 'all' | AttendanceStatus;

const statusConfig: Record<
  AttendanceStatus,
  { label: string; color: string; bg: string; icon: typeof CheckCircle2; dot: string }
> = {
  confirmed: {
    label: '已确认',
    color: 'text-success-600',
    bg: 'bg-success-500',
    icon: CheckCircle2,
    dot: 'bg-success-500',
  },
  tentative: {
    label: '待定',
    color: 'text-warning-600',
    bg: 'bg-warning-500',
    icon: HelpCircle,
    dot: 'bg-warning-500',
  },
  late: {
    label: '迟到',
    color: 'text-warning-600',
    bg: 'bg-warning-500',
    icon: Clock,
    dot: 'bg-warning-500',
  },
  absent: {
    label: '缺席',
    color: 'text-neutral-500',
    bg: 'bg-neutral-400',
    icon: XSquare,
    dot: 'bg-neutral-400',
  },
  declined: {
    label: '拒绝',
    color: 'text-danger-600',
    bg: 'bg-danger-500',
    icon: XCircle,
    dot: 'bg-danger-500',
  },
  pending: {
    label: '待确认',
    color: 'text-primary-600',
    bg: 'bg-primary-500',
    icon: HelpCircle,
    dot: 'bg-primary-500',
  },
};

const filterTabs: Array<{ key: FilterType; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'confirmed', label: '已确认' },
  { key: 'pending', label: '待确认' },
  { key: 'tentative', label: '待定' },
  { key: 'late', label: '迟到' },
  { key: 'absent', label: '缺席' },
  { key: 'declined', label: '拒绝' },
];

export default function AttendanceGrid({ attendees }: AttendanceGridProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [tooltipAttendee, setTooltipAttendee] = useState<string | null>(null);

  const filtered =
    activeFilter === 'all'
      ? attendees
      : attendees.filter((a) => a.status === activeFilter);

  const stats = {
    all: attendees.length,
    confirmed: attendees.filter((a) => a.status === 'confirmed').length,
    pending: attendees.filter((a) => a.status === 'pending').length,
    tentative: attendees.filter((a) => a.status === 'tentative').length,
    late: attendees.filter((a) => a.status === 'late').length,
    absent: attendees.filter((a) => a.status === 'absent').length,
    declined: attendees.filter((a) => a.status === 'declined').length,
  };

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-neutral-100">
      <div className="px-6 py-4 bg-gradient-primary">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-lg">出席情况</h3>
            <p className="text-primary-100 text-sm mt-0.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              共 {attendees.length} 位参会人
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {filterTabs.map((tab) => {
            const count = stats[tab.key];
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                  isActive
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'bg-white/15 text-white/90 hover:bg-white/25'
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-md text-[10px] font-bold',
                    isActive ? 'bg-primary-100 text-primary-700' : 'bg-white/20 text-white'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
            <p className="text-neutral-400 text-sm">暂无该状态的参会人</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {filtered.map((attendee) => {
              const config = statusConfig[attendee.status];
              const StatusIcon = config.icon;
              const isHost = attendee.isHost;
              const showTooltip = tooltipAttendee === attendee.userId;

              return (
                <div
                  key={attendee.userId}
                  className="relative group"
                  onMouseEnter={() => setTooltipAttendee(attendee.userId)}
                  onMouseLeave={() => setTooltipAttendee(null)}
                >
                  <div className="relative flex flex-col items-center">
                    <div className="relative mb-2">
                      <div
                        className={cn(
                          'w-14 h-14 rounded-2xl p-0.5',
                          `ring-2 ring-offset-2 ${config.dot.replace('bg-', 'ring-')} ring-offset-white`
                        )}
                      >
                        <img
                          src={attendee.user.avatar}
                          alt={attendee.user.name}
                          className="w-full h-full rounded-xl object-cover"
                        />
                      </div>
                      {isHost && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md">
                          <Crown className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm',
                          config.bg
                        )}
                      >
                        <StatusIcon className="w-3 h-3" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-neutral-800 truncate w-full text-center">
                      {attendee.user.name}
                    </p>
                    <p
                      className={cn(
                        'text-xs mt-0.5 font-medium',
                        config.color
                      )}
                    >
                      {config.label}
                    </p>
                  </div>

                  {showTooltip && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 w-52 pointer-events-none">
                      <div className="bg-neutral-800 text-white rounded-xl p-3 shadow-xl animate-fade-in">
                        <div className="flex items-center gap-2 mb-2">
                          <img
                            src={attendee.user.avatar}
                            alt={attendee.user.name}
                            className="w-9 h-9 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-semibold text-sm flex items-center gap-1">
                              {attendee.user.name}
                              {isHost && (
                                <Crown className="w-3 h-3 text-yellow-400" />
                              )}
                            </p>
                            <p className="text-xs text-neutral-300">
                              {attendee.user.id}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1 text-xs text-neutral-300 border-t border-neutral-700 pt-2">
                          <p>
                            部门：{attendee.user.department}
                          </p>
                          <p>
                            职级：
                            {attendee.user.level === 'executive'
                              ? '高管'
                              : attendee.user.level === 'senior'
                              ? '资深'
                              : '普通'}
                          </p>
                          <p className="flex items-center gap-1.5">
                            状态：
                            <span className={config.color.replace('text-', 'text-')}>
                              {config.label}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="w-3 h-3 bg-neutral-800 rotate-45 mx-auto -mt-1.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-neutral-50/80 border-t border-neutral-100">
        <div className="flex flex-wrap gap-2 justify-center">
          {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => {
            const config = statusConfig[status];
            const count = stats[status];
            const percent = attendees.length
              ? Math.round((count / attendees.length) * 100)
              : 0;
            return (
              <div
                key={status}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-neutral-100"
              >
                <div
                  className={cn('w-2 h-2 rounded-full', config.dot)}
                />
                <span className="text-xs text-neutral-500">{config.label}</span>
                <span className="text-xs font-semibold text-neutral-800">
                  {count}
                </span>
                <span className="text-xs text-neutral-400">({percent}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
