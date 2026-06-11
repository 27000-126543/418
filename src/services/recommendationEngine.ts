import type {
  Meeting,
  ResourceConflict,
  AlternativeSuggestion,
  MeetingRoom,
  Device,
  Attendee,
} from '@/types';
import { detectAllConflicts } from './conflictDetection';
import { addMinutes, subtractMinutes, getMinutesDiff, generateId } from '@/utils/dateUtils';

function hasExecutive(attendees: Attendee[]): boolean {
  return attendees.some((a) => a.user?.level === 'executive');
}

function getPriorityScore(meeting: Meeting | { attendees: Attendee[]; priority: string }): number {
  let score = 0;
  if (meeting.priority === 'high') score += 30;
  else if (meeting.priority === 'medium') score += 15;
  if (hasExecutive(meeting.attendees)) score += 40;
  const seniorCount = meeting.attendees.filter((a) => a.user?.level === 'senior').length;
  score += Math.min(seniorCount * 5, 20);
  return score;
}

export function calculateConfidence(
  suggestion: AlternativeSuggestion,
  original: { startTime: Date; endTime: Date; roomId: string }
): number {
  let score = 100;
  const timeDiff = getMinutesDiff(suggestion.suggestedStartTime, original.startTime);
  if (timeDiff > 0) {
    if (timeDiff <= 30) score -= timeDiff * 0.5;
    else if (timeDiff <= 60) score -= 15 + (timeDiff - 30) * 0.8;
    else score -= 40 + Math.min((timeDiff - 60) * 0.3, 30);
  }
  if (suggestion.adjustmentType === 'room') {
    score -= 10;
  } else if (suggestion.adjustmentType === 'both') {
    score -= 25;
  }
  const conflictPenalty = (1 - suggestion.conflictsResolved.length * 0.05) * 100;
  score = (score * 0.6 + conflictPenalty * 0.4);
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function generateAlternatives(
  conflicts: ResourceConflict[],
  meetingData: {
    id?: string;
    title: string;
    startTime: Date;
    endTime: Date;
    roomId: string;
    room?: MeetingRoom;
    deviceIds: string[];
    attendees: Attendee[];
    priority: string;
  },
  existingMeetings: Meeting[],
  rooms: MeetingRoom[],
  devices: Device[]
): AlternativeSuggestion[] {
  const suggestions: AlternativeSuggestion[] = [];
  const duration = getMinutesDiff(meetingData.endTime, meetingData.startTime);
  const attendeeIds = meetingData.attendees.map((a) => a.userId);
  const timeOffsets = [30, -30, 60, -60, 90, -90, 120, -120];
  for (const offset of timeOffsets) {
    const newStart = offset > 0
      ? addMinutes(meetingData.startTime, offset)
      : subtractMinutes(meetingData.startTime, Math.abs(offset));
    const newEnd = addMinutes(newStart, duration);
    const newConflicts = detectAllConflicts(
      {
        id: meetingData.id,
        roomId: meetingData.roomId,
        deviceIds: meetingData.deviceIds,
        startTime: newStart,
        endTime: newEnd,
        attendeeIds,
      },
      existingMeetings,
      devices
    );
    if (newConflicts.length === 0) {
      const suggestion: AlternativeSuggestion = {
        id: generateId(),
        originalStartTime: meetingData.startTime,
        suggestedStartTime: newStart,
        suggestedEndTime: newEnd,
        suggestedRoomId: meetingData.roomId,
        suggestedRoomName: meetingData.room?.name,
        adjustmentType: 'time',
        adjustmentReason: Math.abs(offset) <= 30 ? '就近时间段原则' : '最小调整原则',
        confidence: 0,
        conflictsResolved: conflicts,
      };
      suggestion.confidence = calculateConfidence(suggestion, meetingData);
      suggestions.push(suggestion);
      if (suggestions.length >= 5) break;
    }
  }
  const hasRoomConflict = conflicts.some((c) => c.type === 'room');
  if (hasRoomConflict) {
    const availableRooms = rooms.filter(
      (r) =>
        r.id !== meetingData.roomId &&
        r.status === 'available' &&
        (!meetingData.room || r.capacity >= meetingData.room.capacity)
    );
    for (const room of availableRooms) {
      const newConflicts = detectAllConflicts(
        {
          id: meetingData.id,
          roomId: room.id,
          deviceIds: meetingData.deviceIds,
          startTime: meetingData.startTime,
          endTime: meetingData.endTime,
          attendeeIds,
        },
        existingMeetings,
        devices
      );
      if (newConflicts.length === 0 || newConflicts.length < conflicts.length) {
        const suggestion: AlternativeSuggestion = {
          id: generateId(),
          originalStartTime: meetingData.startTime,
          suggestedStartTime: meetingData.startTime,
          suggestedEndTime: meetingData.endTime,
          suggestedRoomId: room.id,
          suggestedRoomName: room.name,
          adjustmentType: 'room',
          adjustmentReason: '最小调整原则',
          confidence: 0,
          conflictsResolved: conflicts.filter((c) => c.type === 'room'),
        };
        suggestion.confidence = calculateConfidence(suggestion, meetingData);
        suggestions.push(suggestion);
        if (suggestions.length >= 8) break;
      }
    }
  }
  if (suggestions.length < 3) {
    for (const room of rooms.filter((r) => r.status === 'available' && r.id !== meetingData.roomId)) {
      for (const offset of [30, -30, 60, -60]) {
        const newStart = offset > 0
          ? addMinutes(meetingData.startTime, offset)
          : subtractMinutes(meetingData.startTime, Math.abs(offset));
        const newEnd = addMinutes(newStart, duration);
        const newConflicts = detectAllConflicts(
          {
            id: meetingData.id,
            roomId: room.id,
            deviceIds: meetingData.deviceIds,
            startTime: newStart,
            endTime: newEnd,
            attendeeIds,
          },
          existingMeetings,
          devices
        );
        if (newConflicts.length === 0) {
          const suggestion: AlternativeSuggestion = {
            id: generateId(),
            originalStartTime: meetingData.startTime,
            suggestedStartTime: newStart,
            suggestedEndTime: newEnd,
            suggestedRoomId: room.id,
            suggestedRoomName: room.name,
            adjustmentType: 'both',
            adjustmentReason: '综合调整方案',
            confidence: 0,
            conflictsResolved: conflicts,
          };
          suggestion.confidence = calculateConfidence(suggestion, meetingData);
          suggestions.push(suggestion);
          if (suggestions.length >= 10) break;
        }
      }
      if (suggestions.length >= 10) break;
    }
  }
  const isExecMeeting = hasExecutive(meetingData.attendees) || meetingData.priority === 'high';
  if (isExecMeeting) {
    suggestions.forEach((s) => {
      s.adjustmentReason = '高管会议优先；' + s.adjustmentReason;
      s.confidence = Math.min(100, s.confidence + 10);
    });
  }
  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);
}

export function getTopSuggestions(
  suggestions: AlternativeSuggestion[],
  count = 3
): AlternativeSuggestion[] {
  return suggestions.slice(0, count);
}

export function filterSuggestionsByType(
  suggestions: AlternativeSuggestion[],
  type: 'time' | 'room' | 'both'
): AlternativeSuggestion[] {
  return suggestions.filter((s) => s.adjustmentType === type);
}

export { getPriorityScore };
