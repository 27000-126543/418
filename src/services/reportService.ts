import type { Meeting, MeetingReport, AttendanceStatus } from '@/types';
import { getMinutesDiff } from '@/utils/dateUtils';

export function calculateAttendanceRate(meeting: Meeting): number {
  const total = meeting.attendees.length;
  if (total === 0) return 0;
  const attended = meeting.attendees.filter(
    (a) => a.status === 'confirmed' || a.status === 'late'
  ).length;
  return attended / total;
}

export function calculateResourceEfficiency(meeting: Meeting): number {
  if (meeting.status !== 'completed') {
    return 0.8;
  }
  let efficiency = 1;
  if (meeting.actualStartTime && meeting.actualEndTime) {
    const actualDuration = getMinutesDiff(meeting.actualEndTime, meeting.actualStartTime);
    const plannedDuration = meeting.duration;
    if (actualDuration > 0 && plannedDuration > 0) {
      const durationRatio = Math.min(actualDuration / plannedDuration, 1.2);
      if (durationRatio >= 0.8 && durationRatio <= 1.1) {
        efficiency *= 1;
      } else if (durationRatio > 1.1) {
        efficiency *= Math.max(0.7, 1 - (durationRatio - 1.1) * 2);
      } else {
        efficiency *= Math.max(0.8, durationRatio / 0.8);
      }
    }
  }
  const attendanceRate = calculateAttendanceRate(meeting);
  efficiency *= 0.5 + attendanceRate * 0.5;
  if (meeting.agenda.length > 0) {
    efficiency *= 0.95;
  }
  if (meeting.decisions.length > 0) {
    efficiency = Math.min(1, efficiency + 0.1);
  }
  return Math.max(0, Math.min(1, efficiency));
}

export function calculateRoomUtilization(meeting: Meeting): number {
  if (meeting.room?.capacity === 0) return 0;
  const actualAttendees = meeting.attendees.filter(
    (a) => a.status === 'confirmed' || a.status === 'late'
  ).length;
  const attendees = actualAttendees > 0 ? actualAttendees : meeting.expectedAttendees;
  return Math.min(1, attendees / (meeting.room?.capacity || 1));
}

export function calculateCateringCost(meeting: Meeting): number {
  const attendeeCount = meeting.attendees.length || meeting.expectedAttendees;
  return meeting.catering.reduce(
    (sum, c) => sum + c.pricePerPerson * attendeeCount,
    0
  );
}

export function generateMeetingReport(meeting: Meeting): MeetingReport {
  const actualDuration = meeting.actualStartTime && meeting.actualEndTime
    ? Math.round(getMinutesDiff(meeting.actualEndTime, meeting.actualStartTime))
    : meeting.duration;
  return {
    meetingId: meeting.id,
    meetingTitle: meeting.title,
    date: new Date(meeting.startTime),
    startTime: new Date(meeting.startTime),
    endTime: new Date(meeting.endTime),
    attendanceRate: calculateAttendanceRate(meeting),
    plannedDuration: meeting.duration,
    actualDuration,
    resourceUsageEfficiency: calculateResourceEfficiency(meeting),
    keyDecisions: [...meeting.decisions],
    roomUtilization: calculateRoomUtilization(meeting),
    devicesUsed: meeting.devices.map((d) => d.name),
    cateringCost: calculateCateringCost(meeting),
  };
}

export function getAttendanceBreakdown(meeting: Meeting): {
  status: AttendanceStatus;
  count: number;
  ratio: number;
}[] {
  const total = meeting.attendees.length;
  if (total === 0) return [];
  const statuses: AttendanceStatus[] = [
    'confirmed',
    'tentative',
    'declined',
    'late',
    'absent',
    'pending',
  ];
  return statuses.map((status) => {
    const count = meeting.attendees.filter((a) => a.status === status).length;
    return {
      status,
      count,
      ratio: count / total,
    };
  });
}

export function getTimelineDeviation(meeting: Meeting): {
  startDeviation: number;
  endDeviation: number;
  durationDeviation: number;
} {
  const startDeviation = meeting.actualStartTime
    ? Math.round(getMinutesDiff(meeting.actualStartTime, meeting.startTime))
    : 0;
  const endDeviation = meeting.actualEndTime
    ? Math.round(getMinutesDiff(meeting.actualEndTime, meeting.endTime))
    : 0;
  const actualDuration = meeting.actualStartTime && meeting.actualEndTime
    ? Math.round(getMinutesDiff(meeting.actualEndTime, meeting.actualStartTime))
    : meeting.duration;
  const durationDeviation = actualDuration - meeting.duration;
  return { startDeviation, endDeviation, durationDeviation };
}

export interface AggregatedReport {
  totalMeetings: number;
  completedMeetings: number;
  totalMeetingHours: number;
  averageAttendanceRate: number;
  averageResourceEfficiency: number;
  totalCateringCost: number;
  averageDuration: number;
  reports: MeetingReport[];
}

export function aggregateReports(meetings: Meeting[]): AggregatedReport {
  const completedMeetings = meetings.filter(
    (m) => m.status === 'completed'
  );
  const reports = meetings.map(generateMeetingReport);
  const totalMeetings = meetings.length;
  if (totalMeetings === 0) {
    return {
      totalMeetings: 0,
      completedMeetings: 0,
      totalMeetingHours: 0,
      averageAttendanceRate: 0,
      averageResourceEfficiency: 0,
      totalCateringCost: 0,
      averageDuration: 0,
      reports: [],
    };
  }
  const totalMeetingHours = meetings.reduce(
    (sum, m) => sum + m.duration / 60,
    0
  );
  const sumAttendance = completedMeetings.length > 0
    ? completedMeetings.reduce((sum, m) => sum + calculateAttendanceRate(m), 0)
    : meetings.reduce((sum, m) => sum + calculateAttendanceRate(m), 0);
  const sumEfficiency = completedMeetings.length > 0
    ? completedMeetings.reduce((sum, m) => sum + calculateResourceEfficiency(m), 0)
    : meetings.reduce((sum, m) => sum + calculateResourceEfficiency(m), 0);
  const attendanceBase = completedMeetings.length > 0 ? completedMeetings.length : totalMeetings;
  return {
    totalMeetings,
    completedMeetings: completedMeetings.length,
    totalMeetingHours: Math.round(totalMeetingHours * 10) / 10,
    averageAttendanceRate: sumAttendance / attendanceBase,
    averageResourceEfficiency: sumEfficiency / attendanceBase,
    totalCateringCost: meetings.reduce((sum, m) => sum + calculateCateringCost(m), 0),
    averageDuration: Math.round(
      meetings.reduce((sum, m) => sum + m.duration, 0) / totalMeetings
    ),
    reports,
  };
}

export function getReportRating(efficiency: number): {
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  label: string;
  color: string;
} {
  if (efficiency >= 0.9) return { grade: 'A', label: '优秀', color: 'green' };
  if (efficiency >= 0.8) return { grade: 'B', label: '良好', color: 'blue' };
  if (efficiency >= 0.7) return { grade: 'C', label: '一般', color: 'yellow' };
  if (efficiency >= 0.6) return { grade: 'D', label: '待改进', color: 'orange' };
  return { grade: 'E', label: '较差', color: 'red' };
}
