import type { Meeting, Notification, ResourceChange, Attendee } from '@/types';
import { generateId, formatDateTime, formatDuration } from '@/utils/dateUtils';

export function createMeetingNotifications(meeting: Meeting): Notification[] {
  const notifications: Notification[] = [];
  const timeInfo = `${formatDateTime(meeting.startTime)} - ${formatDateTime(meeting.endTime)}`;
  const durationInfo = formatDuration(meeting.duration);
  const locationInfo = meeting.room
    ? `${meeting.room.name}（${meeting.room.location}）`
    : '待定';
  for (const attendee of meeting.attendees) {
    const isHost = attendee.isHost;
    const actionRequired = !isHost && attendee.status === 'pending';
    const title = isHost ? `您发起的会议：${meeting.title}` : `会议邀请：${meeting.title}`;
    const hostInfo = meeting.attendees.find((a) => a.isHost);
    const content = buildInvitationContent({
      title: meeting.title,
      time: timeInfo,
      duration: durationInfo,
      location: locationInfo,
      host: hostInfo?.user?.name || '未知',
      attendeeCount: meeting.attendees.length,
      description: meeting.description,
      isHost,
    });
    notifications.push({
      id: generateId(),
      type: 'invitation',
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      userId: attendee.userId,
      title,
      content,
      createdAt: new Date(),
      read: false,
      actionRequired,
    });
  }
  return notifications;
}

function buildInvitationContent(params: {
  title: string;
  time: string;
  duration: string;
  location: string;
  host: string;
  attendeeCount: number;
  description: string;
  isHost: boolean;
}): string {
  const lines: string[] = [];
  lines.push(params.isHost ? '会议详情：' : '诚邀您参加会议：');
  lines.push(`📅 时间：${params.time}`);
  lines.push(`⏱️ 时长：${params.duration}`);
  lines.push(`📍 地点：${params.location}`);
  lines.push(`👤 组织者：${params.host}`);
  lines.push(`👥 参会人数：${params.attendeeCount}人`);
  if (params.description) {
    lines.push(`📝 简介：${params.description}`);
  }
  if (!params.isHost) {
    lines.push('请及时确认您的出席状态。');
  }
  return lines.join('\n');
}

export function createReminder(meeting: Meeting, minutesBefore: number = 15): Notification[] {
  const notifications: Notification[] = [];
  const timeInfo = `${formatDateTime(meeting.startTime)} - ${formatDateTime(meeting.endTime)}`;
  const locationInfo = meeting.room
    ? `${meeting.room.name}（${meeting.room.location}）`
    : '待定';
  for (const attendee of meeting.attendees) {
    if (attendee.status === 'declined') continue;
    const title = `会议即将开始：${meeting.title}`;
    const content = buildReminderContent({
      title: meeting.title,
      time: timeInfo,
      location: locationInfo,
      minutesBefore,
      agendaCount: meeting.agenda.length,
      materialCount: meeting.materials.length,
    });
    notifications.push({
      id: generateId(),
      type: 'reminder',
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      userId: attendee.userId,
      title,
      content,
      createdAt: new Date(),
      read: false,
      actionRequired: false,
    });
  }
  return notifications;
}

function buildReminderContent(params: {
  title: string;
  time: string;
  location: string;
  minutesBefore: number;
  agendaCount: number;
  materialCount: number;
}): string {
  const lines: string[] = [];
  lines.push(`⏰ 提醒：会议将在 ${params.minutesBefore} 分钟后开始`);
  lines.push(`📅 时间：${params.time}`);
  lines.push(`📍 地点：${params.location}`);
  if (params.agendaCount > 0) {
    lines.push(`📋 议程项：${params.agendaCount}项`);
  }
  if (params.materialCount > 0) {
    lines.push(`📎 材料：${params.materialCount}份，请提前查看`);
  }
  lines.push('请准时参加！');
  return lines.join('\n');
}

export function createResourceChangeNotification(
  meeting: Meeting,
  changes: ResourceChange[]
): Notification[] {
  const notifications: Notification[] = [];
  if (changes.length === 0) return notifications;
  const title = `会议信息变更：${meeting.title}`;
  for (const attendee of meeting.attendees) {
    if (attendee.status === 'declined') continue;
    const content = buildChangeContent({
      title: meeting.title,
      changes,
      time: `${formatDateTime(meeting.startTime)} - ${formatDateTime(meeting.endTime)}`,
      location: meeting.room?.name || '待定',
    });
    notifications.push({
      id: generateId(),
      type: 'change',
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      userId: attendee.userId,
      title,
      content,
      createdAt: new Date(),
      read: false,
      actionRequired: true,
    });
  }
  return notifications;
}

function buildChangeContent(params: {
  title: string;
  changes: ResourceChange[];
  time: string;
  location: string;
}): string {
  const lines: string[] = [];
  lines.push(`📢 会议"${params.title}"的信息有变更：`);
  lines.push('');
  params.changes.forEach((change, index) => {
    lines.push(`${index + 1}. ${formatChangeType(change.type)} - ${change.field}`);
    lines.push(`   变更前：${formatValue(change.oldValue)}`);
    lines.push(`   变更后：${formatValue(change.newValue)}`);
  });
  lines.push('');
  lines.push(`📅 当前时间：${params.time}`);
  lines.push(`📍 当前地点：${params.location}`);
  lines.push('请确认新的安排是否方便您参加。');
  return lines.join('\n');
}

function formatChangeType(type: ResourceChange['type']): string {
  const map: Record<ResourceChange['type'], string> = {
    room: '地点变更',
    device: '设备变更',
    time: '时间变更',
    catering: '餐饮变更',
    attendee: '参会人员变更',
  };
  return map[type] || type;
}

function formatValue(value: string | Date | string[]): string {
  if (value instanceof Date) {
    return formatDateTime(value);
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join('、') : '无';
  }
  return value || '无';
}

export function createDecisionNotification(
  meeting: Meeting,
  decision: string
): Notification[] {
  const notifications: Notification[] = [];
  const title = `会议决策通知：${meeting.title}`;
  for (const attendee of meeting.attendees) {
    if (attendee.status === 'declined') continue;
    const content = buildDecisionContent({
      title: meeting.title,
      decision,
      time: formatDateTime(meeting.startTime),
      location: meeting.room?.name || '待定',
      decisionCount: meeting.decisions.length + 1,
    });
    notifications.push({
      id: generateId(),
      type: 'decision',
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      userId: attendee.userId,
      title,
      content,
      createdAt: new Date(),
      read: false,
      actionRequired: false,
    });
  }
  return notifications;
}

function buildDecisionContent(params: {
  title: string;
  decision: string;
  time: string;
  location: string;
  decisionCount: number;
}): string {
  const lines: string[] = [];
  lines.push(`📋 会议"${params.title}"的决策记录 #${params.decisionCount}`);
  lines.push(`📅 时间：${params.time}`);
  lines.push(`📍 地点：${params.location}`);
  lines.push('');
  lines.push('决策内容：');
  lines.push(`「${params.decision}」`);
  lines.push('');
  lines.push('请相关人员知悉并跟进执行。');
  return lines.join('\n');
}

export function createCancellationNotification(meeting: Meeting): Notification[] {
  const notifications: Notification[] = [];
  const title = `会议已取消：${meeting.title}`;
  for (const attendee of meeting.attendees) {
    if (attendee.status === 'declined') continue;
    const content = buildCancellationContent({
      title: meeting.title,
      time: formatDateTime(meeting.startTime),
      location: meeting.room?.name || '待定',
    });
    notifications.push({
      id: generateId(),
      type: 'change',
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      userId: attendee.userId,
      title,
      content,
      createdAt: new Date(),
      read: false,
      actionRequired: false,
    });
  }
  return notifications;
}

function buildCancellationContent(params: {
  title: string;
  time: string;
  location: string;
}): string {
  const lines: string[] = [];
  lines.push(`❌ 原定于 ${params.time} 的会议已取消：`);
  lines.push(`会议名称：${params.title}`);
  lines.push(`原定地点：${params.location}`);
  lines.push('');
  lines.push('给您带来不便，敬请谅解。');
  return lines.join('\n');
}

export function createSummaryNotification(meeting: Meeting): Notification[] {
  const notifications: Notification[] = [];
  const title = `会议纪要：${meeting.title}`;
  for (const attendee of meeting.attendees) {
    const content = buildSummaryContent({
      title: meeting.title,
      decisionCount: meeting.decisions.length,
      decisions: meeting.decisions,
      attendanceCount: meeting.attendees.filter(
        (a) => a.status === 'confirmed' || a.status === 'late'
      ).length,
      totalCount: meeting.attendees.length,
    });
    notifications.push({
      id: generateId(),
      type: 'decision',
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      userId: attendee.userId,
      title,
      content,
      createdAt: new Date(),
      read: false,
      actionRequired: false,
    });
  }
  return notifications;
}

function buildSummaryContent(params: {
  title: string;
  decisionCount: number;
  decisions: string[];
  attendanceCount: number;
  totalCount: number;
}): string {
  const lines: string[] = [];
  lines.push(`📝 会议"${params.title}"已结束`);
  lines.push(`👥 出席情况：${params.attendanceCount}/${params.totalCount}人`);
  if (params.decisionCount > 0) {
    lines.push(`📋 共形成 ${params.decisionCount} 项决策：`);
    params.decisions.slice(0, 5).forEach((d, i) => {
      lines.push(`${i + 1}. ${d}`);
    });
    if (params.decisions.length > 5) {
      lines.push(`... 还有 ${params.decisions.length - 5} 项，请查看会议详情`);
    }
  }
  return lines.join('\n');
}

export function getUnreadNotifications(notifications: Notification[]): Notification[] {
  return notifications.filter((n) => !n.read);
}

export function getActionRequiredNotifications(notifications: Notification[]): Notification[] {
  return notifications.filter((n) => n.actionRequired && !n.read);
}

export function groupNotificationsByMeeting(
  notifications: Notification[]
): Record<string, Notification[]> {
  return notifications.reduce((acc, n) => {
    if (!acc[n.meetingId]) {
      acc[n.meetingId] = [];
    }
    acc[n.meetingId].push(n);
    return acc;
  }, {} as Record<string, Notification[]>);
}
