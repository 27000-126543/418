import { useState } from 'react';
import {
  Play,
  Square,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  UserCheck,
  ClipboardList,
  Target,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Meeting, ActionItem, Attendee, AttendanceStatus } from '@/types';

type AttendanceAction = 'present' | 'late' | 'absent';

const attendanceActionConfig: Record<AttendanceAction, { label: string; color: string; bg: string }> = {
  present: { label: '出席', color: 'text-success-600', bg: 'bg-success-500' },
  late: { label: '迟到', color: 'text-warning-600', bg: 'bg-warning-500' },
  absent: { label: '缺席', color: 'text-danger-600', bg: 'bg-danger-500' },
};

const actionItemStatusConfig: Record<ActionItem['status'], { label: string; color: string; bg: string }> = {
  pending: { label: '待处理', color: 'text-primary-600', bg: 'bg-primary-500' },
  in_progress: { label: '进行中', color: 'text-accent-600', bg: 'bg-accent-500' },
  completed: { label: '已完成', color: 'text-success-600', bg: 'bg-success-500' },
  overdue: { label: '已逾期', color: 'text-danger-600', bg: 'bg-danger-500' },
};

const nextStatusMap: Record<ActionItem['status'], ActionItem['status']> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: 'completed',
  overdue: 'in_progress',
};

interface MeetingExecutionPanelProps {
  meeting: Meeting;
  isHost: boolean;
  onStartMeeting?: () => void;
  onEndMeeting?: () => void;
  onMarkAttendee?: (userId: string, present: boolean) => void;
  onAddActionItem?: (item: Omit<ActionItem, 'id' | 'createdAt'>) => void;
  onUpdateActionItem?: (itemId: string, updates: Partial<ActionItem>) => void;
  onRemoveActionItem?: (itemId: string) => void;
  onAddDecision?: (decision: string) => void;
  onUpdateAttendanceStatus?: (userId: string, status: AttendanceStatus) => void;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}小时${m}分` : `${h}小时`;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

function getAttendeeAction(attendee: Attendee, actualAttendees: string[]): AttendanceAction {
  if (actualAttendees.includes(attendee.userId)) {
    return attendee.status === 'late' ? 'late' : 'present';
  }
  if (attendee.status === 'declined') return 'absent';
  if (attendee.status === 'late') return 'late';
  return 'absent';
}

export default function MeetingExecutionPanel({
  meeting,
  isHost,
  onStartMeeting: _onStartMeeting,
  onEndMeeting,
  onMarkAttendee,
  onAddActionItem,
  onUpdateActionItem,
  onRemoveActionItem,
  onAddDecision,
  onUpdateAttendanceStatus,
}: MeetingExecutionPanelProps) {
  const actualAttendees = meeting.actualAttendees ?? [];
  const actionItems = meeting.actionItems ?? [];
  const isInProgress = meeting.status === 'in-progress';
  const isCompleted = meeting.status === 'completed';

  const [showActionForm, setShowActionForm] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionDesc, setActionDesc] = useState('');
  const [actionAssignee, setActionAssignee] = useState('');
  const [actionDueDate, setActionDueDate] = useState('');

  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [newDecision, setNewDecision] = useState('');

  const [lateMinutesMap, setLateMinutesMap] = useState<Record<string, string>>({});

  const actualStartTime = meeting.actualStartTime
    ? new Date(meeting.actualStartTime)
    : null;
  const actualEndTime = meeting.actualEndTime
    ? new Date(meeting.actualEndTime)
    : null;

  const actualDuration = actualStartTime && actualEndTime
    ? Math.round((actualEndTime.getTime() - actualStartTime.getTime()) / (1000 * 60))
    : null;
  const plannedDuration = meeting.duration;

  const presentCount = meeting.attendees.filter(
    a => actualAttendees.includes(a.userId) && a.status !== 'late'
  ).length;
  const lateCount = meeting.attendees.filter(
    a => actualAttendees.includes(a.userId) && a.status === 'late'
  ).length;
  const absentCount = meeting.attendees.length - presentCount - lateCount;

  const completedActionCount = actionItems.filter(i => i.status === 'completed').length;

  const handleAttendanceAction = (attendee: Attendee, action: AttendanceAction) => {
    if (attendee.isHost && action !== 'present') return;

    const isPresent = action === 'present' || action === 'late';
    onMarkAttendee?.(attendee.userId, isPresent);

    let newStatus: AttendanceStatus;
    if (action === 'present') newStatus = 'confirmed';
    else if (action === 'late') newStatus = 'late';
    else newStatus = 'absent';
    onUpdateAttendanceStatus?.(attendee.userId, newStatus);
  };

  const handleAddAction = () => {
    if (!actionTitle.trim() || !actionAssignee || !actionDueDate) return;
    const assignee = meeting.attendees.find(a => a.userId === actionAssignee);
    if (!assignee) return;

    onAddActionItem?.({
      title: actionTitle.trim(),
      description: actionDesc.trim(),
      assigneeId: assignee.userId,
      assigneeName: assignee.user.name,
      dueDate: new Date(actionDueDate),
      status: 'pending',
    });

    setActionTitle('');
    setActionDesc('');
    setActionAssignee('');
    setActionDueDate('');
    setShowActionForm(false);
  };

  const handleToggleActionStatus = (item: ActionItem) => {
    const next = nextStatusMap[item.status];
    onUpdateActionItem?.(item.id, { status: next });
  };

  const handleAddDecision = () => {
    if (!newDecision.trim()) return;
    onAddDecision?.(newDecision.trim());
    setNewDecision('');
    setShowDecisionForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0a1628] to-[#0d2847] text-white relative overflow-hidden shadow-card border border-[#1a3a5c]">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-accent-500/10" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-primary-500/10" />

        <div className="relative">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center">
                {isInProgress ? (
                  <Play className="w-5 h-5 text-accent-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-success-400" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold">
                  {isInProgress ? '会议进行中' : '会议已结束'}
                </h3>
                <p className="text-xs text-white/50 mt-0.5">执行面板</p>
              </div>
            </div>

            {isHost && isInProgress && (
              <button
                onClick={onEndMeeting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-success-500 text-white text-xs font-semibold hover:bg-success-600 transition-colors shadow-lg shadow-success-500/30"
              >
                <Square className="w-3.5 h-3.5" />
                结束会议
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-white/40 mb-1">计划时间</div>
              <div className="text-sm font-semibold">
                {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">{formatDuration(plannedDuration)}</div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-white/40 mb-1">实际开始</div>
              <div className="text-sm font-semibold">
                {actualStartTime ? formatTime(actualStartTime) : '-'}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">
                {actualStartTime ? formatDate(actualStartTime) : '未开始'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-white/40 mb-1">实际结束</div>
              <div className="text-sm font-semibold">
                {actualEndTime ? formatTime(actualEndTime) : '-'}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">
                {actualEndTime ? formatDate(actualEndTime) : isInProgress ? '进行中' : '未结束'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-white/40 mb-1">时长对比</div>
              <div className="text-sm font-semibold">
                {actualDuration !== null ? formatDuration(actualDuration) : '-'}
              </div>
              <div className={cn(
                'text-[10px] mt-0.5',
                actualDuration !== null && actualDuration > plannedDuration
                  ? 'text-danger-400'
                  : 'text-success-400'
              )}>
                {actualDuration !== null
                  ? actualDuration > plannedDuration
                    ? `超出 ${actualDuration - plannedDuration} 分钟`
                    : actualDuration < plannedDuration
                    ? `节省 ${plannedDuration - actualDuration} 分钟`
                    : '与计划一致'
                  : '待统计'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-primary-500" />
          </div>
          <h3 className="text-sm font-bold text-neutral-800">实际参会记录</h3>
        </div>

        <div className="space-y-2">
          {meeting.attendees.map(attendee => {
            const action = getAttendeeAction(attendee, actualAttendees);
            const isHostUser = attendee.isHost;

            return (
              <div
                key={attendee.userId}
                className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100/80 transition-colors"
              >
                <img
                  src={attendee.user.avatar}
                  alt={attendee.user.name}
                  className="w-8 h-8 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-neutral-800 truncate">
                      {attendee.user.name}
                    </span>
                    {isHostUser && (
                      <span className="px-1.5 py-0.5 rounded bg-accent-500/10 text-accent-600 text-[10px] font-semibold">
                        主持人
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium',
                    attendee.status === 'confirmed' ? 'text-success-500' :
                    attendee.status === 'tentative' ? 'text-warning-500' :
                    attendee.status === 'declined' ? 'text-danger-500' :
                    'text-primary-500'
                  )}>
                    原定：{
                      attendee.status === 'confirmed' ? '已确认' :
                      attendee.status === 'tentative' ? '待定' :
                      attendee.status === 'declined' ? '已拒绝' :
                      attendee.status === 'late' ? '迟到' :
                      attendee.status === 'absent' ? '缺席' : '待确认'
                    }
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {(isInProgress || isCompleted) && (
                    <>
                      {(['present', 'late', 'absent'] as AttendanceAction[]).map(act => {
                        const config = attendanceActionConfig[act];
                        const isActive = action === act;
                        const isDisabled = isHostUser && act !== 'present';

                        return (
                          <button
                            key={act}
                            disabled={isDisabled || !isHost}
                            onClick={() => handleAttendanceAction(attendee, act)}
                            className={cn(
                              'px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all',
                              isActive
                                ? `${config.bg} text-white shadow-sm`
                                : 'bg-white border border-neutral-200 text-neutral-500 hover:border-neutral-300',
                              isDisabled && 'opacity-40 cursor-not-allowed',
                              !isHost && 'cursor-default'
                            )}
                          >
                            {config.label}
                          </button>
                        );
                      })}

                      {action === 'late' && isHost && (
                        <input
                          type="number"
                          min={1}
                          placeholder="分钟"
                          value={lateMinutesMap[attendee.userId] ?? ''}
                          onChange={e => setLateMinutesMap(prev => ({
                            ...prev,
                            [attendee.userId]: e.target.value,
                          }))}
                          className="w-16 px-2 py-1 rounded-lg border border-neutral-200 text-[10px] text-center focus:outline-none focus:ring-1 focus:ring-warning-400"
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success-50">
            <div className="w-2 h-2 rounded-full bg-success-500" />
            <span className="text-xs text-neutral-600">出席</span>
            <span className="text-xs font-bold text-success-600">{presentCount}人</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning-50">
            <div className="w-2 h-2 rounded-full bg-warning-500" />
            <span className="text-xs text-neutral-600">迟到</span>
            <span className="text-xs font-bold text-warning-600">{lateCount}人</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger-50">
            <div className="w-2 h-2 rounded-full bg-danger-500" />
            <span className="text-xs text-neutral-600">缺席</span>
            <span className="text-xs font-bold text-danger-600">{absentCount}人</span>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-accent-500" />
            </div>
            <h3 className="text-sm font-bold text-neutral-800">决议记录</h3>
          </div>
          {isHost && (
            <button
              onClick={() => setShowDecisionForm(!showDecisionForm)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent-50 text-accent-600 text-xs font-medium hover:bg-accent-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              添加决议
            </button>
          )}
        </div>

        {showDecisionForm && (
          <div className="mb-4 p-3 rounded-xl bg-accent-50 border border-accent-100 animate-slide-up">
            <textarea
              className="w-full p-3 rounded-lg bg-white border border-accent-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400"
              rows={2}
              placeholder="输入决策内容..."
              value={newDecision}
              onChange={e => setNewDecision(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setShowDecisionForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:bg-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddDecision}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent-500 text-white text-xs font-medium hover:bg-accent-600 transition-colors"
              >
                <Save className="w-3 h-3" />
                保存
              </button>
            </div>
          </div>
        )}

        {meeting.decisions.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">暂无决策记录</p>
          </div>
        ) : (
          <div className="space-y-2">
            {meeting.decisions.map((decision, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-neutral-50 border-l-4 border-accent-400 hover:bg-primary-50/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-gradient-accent text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-neutral-700 leading-relaxed">{decision}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-800">行动项</h3>
              {actionItems.length > 0 && (
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  已完成 {completedActionCount}/{actionItems.length}
                </p>
              )}
            </div>
          </div>
          {isHost && (
            <button
              onClick={() => setShowActionForm(!showActionForm)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 text-xs font-medium hover:bg-primary-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              添加行动项
            </button>
          )}
        </div>

        {actionItems.length > 0 && (
          <div className="mb-4">
            <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full bg-gradient-accent rounded-full transition-all duration-500"
                style={{
                  width: `${actionItems.length > 0 ? (completedActionCount / actionItems.length) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-neutral-400 mt-1 text-right">
              完成率 {actionItems.length > 0 ? Math.round((completedActionCount / actionItems.length) * 100) : 0}%
            </p>
          </div>
        )}

        {showActionForm && (
          <div className="mb-5 p-4 rounded-xl bg-primary-50/50 border border-primary-100 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-[10px] text-neutral-500 mb-1 block">标题 *</label>
                <input
                  type="text"
                  value={actionTitle}
                  onChange={e => setActionTitle(e.target.value)}
                  placeholder="行动项标题"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] text-neutral-500 mb-1 block">描述</label>
                <textarea
                  value={actionDesc}
                  onChange={e => setActionDesc(e.target.value)}
                  placeholder="行动项描述"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 mb-1 block">负责人 *</label>
                <select
                  value={actionAssignee}
                  onChange={e => setActionAssignee(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-white"
                >
                  <option value="">选择负责人</option>
                  {meeting.attendees.map(a => (
                    <option key={a.userId} value={a.userId}>{a.user.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 mb-1 block">截止日期 *</label>
                <input
                  type="date"
                  value={actionDueDate}
                  onChange={e => setActionDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setShowActionForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:bg-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddAction}
                disabled={!actionTitle.trim() || !actionAssignee || !actionDueDate}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-3 h-3" />
                添加
              </button>
            </div>
          </div>
        )}

        {actionItems.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">
            <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">暂无行动项</p>
          </div>
        ) : (
          <div className="space-y-2">
            {actionItems.map(item => {
              const config = actionItemStatusConfig[item.status];
              const isOverdue = item.status === 'overdue' ||
                (item.status !== 'completed' && new Date(item.dueDate) < new Date());

              return (
                <div
                  key={item.id}
                  className={cn(
                    'p-3 rounded-xl border transition-colors',
                    isOverdue && item.status !== 'completed'
                      ? 'bg-danger-50/50 border-danger-200'
                      : 'bg-neutral-50 border-transparent hover:bg-primary-50/30'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'text-sm font-medium',
                          item.status === 'completed' ? 'text-neutral-400 line-through' : 'text-neutral-800'
                        )}>
                          {item.title}
                        </span>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-semibold text-white',
                          config.bg
                        )}>
                          {config.label}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-neutral-500 mb-1.5">{item.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-neutral-400">
                        <span className="flex items-center gap-1">
                          <img
                            src={meeting.attendees.find(a => a.userId === item.assigneeId)?.user.avatar ?? ''}
                            alt={item.assigneeName}
                            className="w-4 h-4 rounded object-cover"
                          />
                          {item.assigneeName}
                        </span>
                        <span className={cn(
                          'flex items-center gap-0.5',
                          isOverdue && item.status !== 'completed' ? 'text-danger-500' : ''
                        )}>
                          {isOverdue && item.status !== 'completed' && (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          截止 {formatDate(item.dueDate)}
                        </span>
                      </div>
                    </div>

                    {isHost && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.status !== 'completed' && (
                          <button
                            onClick={() => handleToggleActionStatus(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent-50 text-accent-600 text-[10px] font-medium hover:bg-accent-100 transition-colors"
                          >
                            <ChevronRight className="w-3 h-3" />
                            {item.status === 'pending' ? '开始' : item.status === 'in_progress' || item.status === 'overdue' ? '完成' : ''}
                          </button>
                        )}
                        <button
                          onClick={() => onRemoveActionItem?.(item.id)}
                          className="p-1 rounded-lg text-neutral-400 hover:text-danger-500 hover:bg-danger-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
