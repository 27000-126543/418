import type {
  Notification,
  AttendanceStatus,
  Meeting,
  User,
  AgendaItem,
  Attendee,
} from '@/types';
import StatusBadge from '@/components/common/StatusBadge';
import {
  Check,
  X,
  HelpCircle,
  Clock,
  CalendarDays,
  MapPin,
  Crown,
  ChevronDown,
  ChevronUp,
  Users,
  Loader2,
  FileText,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface InvitationCardProps {
  notification: Notification;
  meeting?: Meeting;
  host?: User;
  onRespond?: (
    notificationId: string,
    status: AttendanceStatus,
    meetingId: string
  ) => void;
  onMarkRead?: (notificationId: string) => void;
  onAccept?: (notificationId: string, meetingId: string) => void;
  onDecline?: (notificationId: string, meetingId: string) => void;
  onTentative?: (notificationId: string, meetingId: string) => void;
}

type RespondingStatus = AttendanceStatus | null;

export default function InvitationCard({
  notification,
  meeting,
  host,
  onRespond,
  onMarkRead,
  onAccept,
  onDecline,
  onTentative,
}: InvitationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [responding, setResponding] = useState<RespondingStatus>(null);

  const isUnread = !notification.read;

  const formatDateTime = (date?: Date) => {
    if (!date) return '-';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleRespond = async (status: AttendanceStatus) => {
    if (!meeting?.id) return;
    const hasHandler = onRespond || onAccept || onDecline || onTentative;
    if (!hasHandler) return;
    setResponding(status);
    await new Promise((r) => setTimeout(r, 600));
    onRespond?.(notification.id, status, meeting.id);
    if (status === 'confirmed') onAccept?.(notification.id, meeting.id);
    if (status === 'tentative') onTentative?.(notification.id, meeting.id);
    if (status === 'declined') onDecline?.(notification.id, meeting.id);
    setResponding(null);
    onMarkRead?.(notification.id);
  };

  const handleToggleExpand = () => {
    setExpanded(!expanded);
    if (isUnread) {
      onMarkRead?.(notification.id);
    }
  };

  const attendees: Attendee[] = meeting?.attendees || [];
  const agenda: AgendaItem[] = meeting?.agenda || [];

  return (
    <div
      className={cn(
        'relative rounded-2xl border transition-all duration-300 overflow-hidden',
        isUnread
          ? 'bg-white border-primary-100 shadow-md shadow-primary-500/5 hover:shadow-lg hover:shadow-primary-500/10'
          : 'bg-white border-neutral-100 hover:shadow-card-hover'
      )}
    >
      {isUnread && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 to-accent-500" />
      )}

      <div className={cn('p-5', isUnread && 'pl-6')}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="text-base font-bold text-neutral-800 truncate">
                {meeting?.title || notification.title}
              </h3>
              {meeting && (
                <StatusBadge
                  status={
                    meeting.status === 'scheduled'
                      ? 'confirmed'
                      : meeting.status === 'in-progress'
                      ? 'tentative'
                      : meeting.status === 'completed'
                      ? 'confirmed'
                      : 'declined'
                  }
                  type="attendance"
                />
              )}
              {isUnread && (
                <span className="flex-shrink-0 px-2 py-0.5 rounded-md bg-danger-500/10 text-danger-600 text-[10px] font-bold">
                  新消息
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 line-clamp-2">
              {notification.content}
            </p>
          </div>
          <Link
            to={`/meetings/${meeting?.id || notification.meetingId}`}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 transition-all hover:scale-105"
          >
            <CalendarDays className="w-5 h-5 text-white" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50">
            <Clock className="w-4 h-4 text-accent-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-neutral-400">会议时间</p>
              <p className="text-xs font-medium text-neutral-800 truncate">
                {formatDateTime(meeting?.startTime)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50">
            <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-neutral-400">会议地点</p>
              <p className="text-xs font-medium text-neutral-800 truncate">
                {meeting?.room?.name || '待定'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50">
            {host ? (
              <>
                <img
                  src={host.avatar}
                  alt={host.name}
                  className="w-5 h-5 rounded-full object-cover flex-shrink-0 ring-2 ring-warning-200"
                />
                <div className="min-w-0">
                  <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-warning-500" />
                    主持人
                  </p>
                  <p className="text-xs font-medium text-neutral-800 truncate">
                    {host.name}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Crown className="w-4 h-4 text-warning-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-neutral-400">主持人</p>
                  <p className="text-xs font-medium text-neutral-800 truncate">
                    待定
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {notification.actionRequired && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => handleRespond('confirmed')}
              disabled={!!responding}
              className={cn(
                'flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all',
                responding === 'confirmed'
                  ? 'bg-success-100 text-success-600'
                  : 'bg-success-500 text-white hover:bg-success-600 hover:shadow-md hover:shadow-success-500/30 active:scale-[0.98]',
                responding && responding !== 'confirmed' && 'opacity-50'
              )}
            >
              {responding === 'confirmed' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              确认出席
            </button>
            <button
              onClick={() => handleRespond('tentative')}
              disabled={!!responding}
              className={cn(
                'flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all',
                responding === 'tentative'
                  ? 'bg-warning-100 text-warning-600'
                  : 'bg-warning-50 text-warning-600 hover:bg-warning-100 active:scale-[0.98]',
                responding && responding !== 'tentative' && 'opacity-50'
              )}
            >
              {responding === 'tentative' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <HelpCircle className="w-4 h-4" />
              )}
              暂定
            </button>
            <button
              onClick={() => handleRespond('declined')}
              disabled={!!responding}
              className={cn(
                'flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all',
                responding === 'declined'
                  ? 'bg-danger-100 text-danger-600'
                  : 'bg-danger-50 text-danger-500 hover:bg-danger-100 active:scale-[0.98]',
                responding && responding !== 'declined' && 'opacity-50'
              )}
            >
              {responding === 'declined' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
              拒绝
            </button>
          </div>
        )}

        <button
          onClick={handleToggleExpand}
          className="w-full flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium text-neutral-500 hover:bg-neutral-50 hover:text-primary-600 transition-colors"
        >
          {expanded ? (
            <>
              收起详情
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              查看更多详情
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-neutral-100 space-y-4 animate-slide-down">
            {meeting?.description && (
              <div>
                <h5 className="text-xs font-semibold text-neutral-700 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-accent-500" />
                  会议描述
                </h5>
                <p className="text-xs text-neutral-600 leading-relaxed bg-neutral-50/50 p-3 rounded-xl">
                  {meeting.description}
                </p>
              </div>
            )}

            {attendees.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-neutral-700 mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary-500" />
                  参会人员
                  <span className="text-neutral-400 font-normal">
                    ({attendees.length} 人)
                  </span>
                </h5>
                <div className="flex flex-wrap gap-2">
                  {attendees.slice(0, 12).map((a) => {
                    const isHost = a.isHost;
                    return (
                      <div
                        key={a.userId}
                        className="relative group"
                        title={`${a.user.name} - ${a.user.department}`}
                      >
                        <img
                          src={a.user.avatar}
                          alt={a.user.name}
                          className="w-8 h-8 rounded-lg object-cover ring-2 ring-white shadow-sm"
                        />
                        {isHost && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-sm">
                            <Crown className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {attendees.length > 12 && (
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-[10px] font-bold text-neutral-500">
                      +{attendees.length - 12}
                    </div>
                  )}
                </div>
              </div>
            )}

            {agenda.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-neutral-700 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-warning-500" />
                  会议议程
                  <span className="text-neutral-400 font-normal">
                    ({agenda.length} 项)
                  </span>
                </h5>
                <div className="space-y-2">
                  {agenda.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-2 p-2.5 rounded-xl bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-gradient-primary text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-neutral-800 truncate">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          {item.duration} 分钟
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
