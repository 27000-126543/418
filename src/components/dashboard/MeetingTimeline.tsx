import type { Meeting } from '@/types';
import StatusBadge from '@/components/common/StatusBadge';
import { Clock, MapPin, Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MeetingTimelineProps {
  meetings: Meeting[];
}

const formatTime = (date: Date) => {
  const d = new Date(date);
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

export default function MeetingTimeline({ meetings }: MeetingTimelineProps) {
  const sorted = [...meetings].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-4">
          <Clock className="w-10 h-10 text-primary-300" />
        </div>
        <div className="text-sm font-medium text-neutral-600 mb-1">今日暂无会议</div>
        <div className="text-xs text-neutral-400">享受一段宁静的时光吧 ☕</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-200 via-accent-200 to-transparent rounded-full" />

      <div className="space-y-4">
        {sorted.map((meeting, idx) => {
          const isNow = meeting.status === 'in-progress';
          const start = new Date(meeting.startTime);
          const end = new Date(meeting.endTime);

          return (
            <Link
              key={meeting.id}
              to={`/meetings/${meeting.id}`}
              className={`relative pl-14 block group ${idx === sorted.length - 1 ? '' : 'pb-2'}`}
            >
              <div
                className={`absolute left-2 top-2 w-6 h-6 rounded-full border-4 flex items-center justify-center z-10 transition-all duration-300 ${
                  isNow
                    ? 'bg-white border-accent-500 shadow-glow animate-pulse-once'
                    : meeting.status === 'completed'
                    ? 'bg-success-500 border-success-500'
                    : 'bg-white border-primary-300 group-hover:border-primary-500'
                }`}
              >
                {isNow && <div className="w-2 h-2 rounded-full bg-accent-500" />}
                {meeting.status === 'completed' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>

              <div
                className={`card-base p-4 transition-all duration-300 group-hover:translate-x-1 ${
                  isNow ? 'ring-2 ring-accent-300 ring-offset-2' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg font-bold text-primary-600 tabular-nums">
                        {formatTime(start)}
                      </span>
                      <span className="text-xs text-neutral-400">-</span>
                      <span className="text-sm text-neutral-500 tabular-nums">{formatTime(end)}</span>
                      {isNow && (
                        <span className="badge bg-accent-500 text-white animate-pulse">LIVE</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-neutral-800 truncate group-hover:text-primary-600 transition-colors">
                      {meeting.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={meeting.status} type="meeting" />
                    <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary-400" />
                    {meeting.room.name}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary-400" />
                    {meeting.attendees.filter(a => a.status === 'confirmed').length}/{meeting.attendees.length} 已确认
                  </div>
                  <div className="flex -space-x-2">
                    {meeting.attendees.slice(0, 4).map(a => (
                      <img
                        key={a.userId}
                        src={a.user.avatar}
                        alt={a.user.name}
                        className="w-6 h-6 rounded-full border-2 border-white object-cover"
                      />
                    ))}
                    {meeting.attendees.length > 4 && (
                      <div className="w-6 h-6 rounded-full border-2 border-white bg-primary-100 text-[10px] font-semibold text-primary-600 flex items-center justify-center">
                        +{meeting.attendees.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
