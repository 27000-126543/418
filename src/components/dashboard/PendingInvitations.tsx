import type { Notification } from '@/types';
import StatusBadge from '@/components/common/StatusBadge';
import { Check, X, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PendingInvitationsProps {
  invitations: Notification[];
  onRespond?: (notificationId: string, status: 'confirmed' | 'declined') => void;
}

export default function PendingInvitations({ invitations, onRespond }: PendingInvitationsProps) {
  const pending = invitations.filter(n => n.type === 'invitation' && n.actionRequired);

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center mb-3">
          <Check className="w-8 h-8 text-success-500" />
        </div>
        <div className="text-sm font-medium text-neutral-600 mb-1">暂无待处理邀请</div>
        <div className="text-xs text-neutral-400">所有邀请都已响应 🎉</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pending.slice(0, 5).map(invitation => (
        <Link
          key={invitation.id}
          to={`/meetings/${invitation.meetingId}`}
          className="block p-3 rounded-xl bg-neutral-50 hover:bg-primary-50/50 border border-transparent hover:border-primary-100 transition-all group"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0 group-hover:bg-gradient-primary group-hover:shadow-lg transition-all">
              <Clock className="w-5 h-5 text-primary-500 group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge status={invitation.type} type="notification" />
                {!invitation.read && (
                  <span className="w-2 h-2 rounded-full bg-danger-500" />
                )}
              </div>
              <h4 className="text-sm font-semibold text-neutral-800 truncate mb-0.5">
                {invitation.title}
              </h4>
              <p className="text-xs text-neutral-500 line-clamp-2 mb-2">
                {invitation.meetingTitle}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRespond?.(invitation.id, 'confirmed');
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-success-500 text-white text-xs font-medium hover:bg-success-600 transition-colors flex items-center justify-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  接受
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRespond?.(invitation.id, 'declined');
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-danger-50 text-danger-500 text-xs font-medium hover:bg-danger-100 transition-colors flex items-center justify-center gap-1"
                >
                  <X className="w-3 h-3" />
                  谢绝
                </button>
              </div>
            </div>
          </div>
        </Link>
      ))}
      {pending.length > 5 && (
        <Link
          to="/notifications"
          className="block text-center text-xs text-primary-500 font-medium py-2 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          查看全部 {pending.length} 条邀请 →
        </Link>
      )}
    </div>
  );
}
