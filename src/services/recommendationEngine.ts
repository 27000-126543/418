import type {
  Meeting,
  ResourceConflict,
  AlternativeSuggestion,
  MeetingRoom,
  Device,
  Attendee,
} from '@/types';
import { detectAllConflicts, detectDeviceConflict } from './conflictDetection';
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

function getAvailableDevicesForRoom(
  roomId: string,
  startTime: Date,
  endTime: Date,
  devices: Device[],
  existingMeetings: Meeting[],
  excludeMeetingId?: string
): Device[] {
  const compatibleDevices = devices.filter(
    (d) =>
      d.compatibleRooms.includes(roomId) &&
      d.status !== 'faulty' &&
      d.status !== 'maintenance'
  );
  const conflicts = detectDeviceConflict(
    compatibleDevices.map((d) => d.id),
    startTime,
    endTime,
    existingMeetings,
    devices,
    excludeMeetingId
  );
  const conflictedDeviceIds = new Set(conflicts.map((c) => c.resourceId));
  return compatibleDevices.filter((d) => !conflictedDeviceIds.has(d.id));
}

function calculateDeviceMatchRate(
  originalDeviceIds: string[],
  suggestedDevices: Device[],
  allDevices: Device[]
): number {
  if (originalDeviceIds.length === 0) return 1;
  const originalDeviceTypes = new Set(
    originalDeviceIds
      .map((id) => allDevices.find((d) => d.id === id)?.type)
      .filter(Boolean)
  );
  const suggestedDeviceTypes = new Set(suggestedDevices.map((d) => d.type));
  let matchedCount = 0;
  for (const type of originalDeviceTypes) {
    if (suggestedDeviceTypes.has(type)) {
      matchedCount++;
    }
  }
  return originalDeviceTypes.size > 0 ? matchedCount / originalDeviceTypes.size : 1;
}

export function calculateConfidence(
  suggestion: AlternativeSuggestion,
  original: { startTime: Date; endTime: Date; roomId: string; deviceIds?: string[]; devices?: Device[] }
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

  if (
    (suggestion.adjustmentType === 'room' || suggestion.adjustmentType === 'both') &&
    original.deviceIds &&
    original.deviceIds.length > 0 &&
    suggestion.suggestedDevicesInfo &&
    original.devices
  ) {
    const deviceMatchRate = calculateDeviceMatchRate(
      original.deviceIds,
      suggestion.suggestedDevicesInfo,
      original.devices
    );
    const deviceScore = deviceMatchRate * 15;
    score = Math.min(100, score + deviceScore - 7.5);
  }

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
      suggestion.confidence = calculateConfidence(suggestion, { ...meetingData, devices });
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
      const availableDevices = getAvailableDevicesForRoom(
        room.id,
        meetingData.startTime,
        meetingData.endTime,
        devices,
        existingMeetings,
        meetingData.id
      );
      const suggestedDeviceIds = meetingData.deviceIds.length > 0
        ? availableDevices.slice(0, meetingData.deviceIds.length).map((d) => d.id)
        : [];
      const newConflicts = detectAllConflicts(
        {
          id: meetingData.id,
          roomId: room.id,
          deviceIds: suggestedDeviceIds,
          startTime: meetingData.startTime,
          endTime: meetingData.endTime,
          attendeeIds,
        },
        existingMeetings,
        devices
      );
      if (newConflicts.length === 0 || newConflicts.length < conflicts.length) {
        const deviceMatchRate = calculateDeviceMatchRate(
          meetingData.deviceIds,
          availableDevices,
          devices
        );
        let reason = '最小调整原则';
        if (deviceMatchRate >= 0.8) {
          reason = '设备高度兼容；' + reason;
        } else if (deviceMatchRate > 0) {
          reason = '设备部分兼容；' + reason;
        }
        const suggestion: AlternativeSuggestion = {
          id: generateId(),
          originalStartTime: meetingData.startTime,
          suggestedStartTime: meetingData.startTime,
          suggestedEndTime: meetingData.endTime,
          suggestedRoomId: room.id,
          suggestedRoomName: room.name,
          suggestedDeviceIds: availableDevices.map((d) => d.id),
          suggestedDevicesInfo: availableDevices,
          adjustmentType: 'room',
          adjustmentReason: reason,
          confidence: 0,
          conflictsResolved: conflicts.filter((c) => c.type === 'room' || c.type === 'device'),
        };
        suggestion.confidence = calculateConfidence(
          suggestion,
          { ...meetingData, deviceIds: meetingData.deviceIds, devices }
        );
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
        const availableDevices = getAvailableDevicesForRoom(
          room.id,
          newStart,
          newEnd,
          devices,
          existingMeetings,
          meetingData.id
        );
        const suggestedDeviceIds = meetingData.deviceIds.length > 0
          ? availableDevices.slice(0, meetingData.deviceIds.length).map((d) => d.id)
          : [];
        const newConflicts = detectAllConflicts(
          {
            id: meetingData.id,
            roomId: room.id,
            deviceIds: suggestedDeviceIds,
            startTime: newStart,
            endTime: newEnd,
            attendeeIds,
          },
          existingMeetings,
          devices
        );
        if (newConflicts.length === 0) {
          const deviceMatchRate = calculateDeviceMatchRate(
            meetingData.deviceIds,
            availableDevices,
            devices
          );
          let reason = '综合调整方案';
          if (deviceMatchRate >= 0.8) {
            reason = '设备高度兼容；' + reason;
          } else if (deviceMatchRate > 0) {
            reason = '设备部分兼容；' + reason;
          }
          const suggestion: AlternativeSuggestion = {
            id: generateId(),
            originalStartTime: meetingData.startTime,
            suggestedStartTime: newStart,
            suggestedEndTime: newEnd,
            suggestedRoomId: room.id,
            suggestedRoomName: room.name,
            suggestedDeviceIds: availableDevices.map((d) => d.id),
            suggestedDevicesInfo: availableDevices,
            adjustmentType: 'both',
            adjustmentReason: reason,
            confidence: 0,
            conflictsResolved: conflicts,
          };
          suggestion.confidence = calculateConfidence(
            suggestion,
            { ...meetingData, deviceIds: meetingData.deviceIds, devices }
          );
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

export { getPriorityScore, getAvailableDevicesForRoom, calculateDeviceMatchRate };
