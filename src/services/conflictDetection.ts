import type { Meeting, ResourceConflict, MeetingRoom, Device } from '@/types';
import { isTimeOverlap } from '@/utils/dateUtils';

export function detectRoomConflict(
  roomId: string,
  startTime: Date,
  endTime: Date,
  existingMeetings: Meeting[],
  excludeMeetingId?: string
): ResourceConflict[] {
  const conflicts: ResourceConflict[] = [];
  const filteredMeetings = existingMeetings.filter(
    (m) => m.roomId === roomId && m.id !== excludeMeetingId && m.status !== 'cancelled'
  );
  for (const meeting of filteredMeetings) {
    if (isTimeOverlap(startTime, endTime, meeting.startTime, meeting.endTime)) {
      conflicts.push({
        type: 'room',
        resourceId: roomId,
        resourceName: meeting.room?.name || roomId,
        conflictingMeetingId: meeting.id,
        conflictingMeetingTitle: meeting.title,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        reason: 'time-overlap',
        description: '会议室时间冲突',
      });
    }
  }
  return conflicts;
}

export function detectDeviceConflict(
  deviceIds: string[],
  startTime: Date,
  endTime: Date,
  existingMeetings: Meeting[],
  devices: Device[],
  excludeMeetingId?: string
): ResourceConflict[] {
  const conflicts: ResourceConflict[] = [];
  for (const deviceId of deviceIds) {
    const device = devices.find((d) => d.id === deviceId);
    const filteredMeetings = existingMeetings.filter(
      (m) => m.deviceIds.includes(deviceId) && m.id !== excludeMeetingId && m.status !== 'cancelled'
    );
    for (const meeting of filteredMeetings) {
      if (isTimeOverlap(startTime, endTime, meeting.startTime, meeting.endTime)) {
        conflicts.push({
          type: 'device',
          resourceId: deviceId,
          resourceName: device?.name || deviceId,
          conflictingMeetingId: meeting.id,
          conflictingMeetingTitle: meeting.title,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          reason: 'time-overlap',
          description: '设备时间冲突',
        });
      }
    }
  }
  return conflicts;
}

export function detectDeviceCompatibilityConflict(
  roomId: string,
  deviceIds: string[],
  devices: Device[]
): ResourceConflict[] {
  const conflicts: ResourceConflict[] = [];
  const now = new Date();

  for (const deviceId of deviceIds) {
    const device = devices.find((d) => d.id === deviceId);
    if (!device) continue;

    if (!device.compatibleRooms.includes(roomId)) {
      conflicts.push({
        type: 'device',
        resourceId: deviceId,
        resourceName: device.name,
        startTime: now,
        endTime: now,
        reason: 'device-incompatible',
        description: `${device.name} 不兼容当前会议室`,
      });
    }

    if (device.status === 'faulty') {
      conflicts.push({
        type: 'device',
        resourceId: deviceId,
        resourceName: device.name,
        startTime: now,
        endTime: now,
        reason: 'device-faulty',
        description: `${device.name} 设备故障，暂时无法使用`,
      });
    }

    if (device.status === 'maintenance') {
      conflicts.push({
        type: 'device',
        resourceId: deviceId,
        resourceName: device.name,
        startTime: now,
        endTime: now,
        reason: 'device-maintenance',
        description: `${device.name} 设备维护中，暂时无法使用`,
      });
    }
  }

  return conflicts;
}

export function detectTimeConflict(
  startTime: Date,
  endTime: Date,
  attendeeIds: string[],
  existingMeetings: Meeting[],
  excludeMeetingId?: string
): ResourceConflict[] {
  const conflicts: ResourceConflict[] = [];
  for (const attendeeId of attendeeIds) {
    const filteredMeetings = existingMeetings.filter(
      (m) =>
        m.attendees.some((a) => a.userId === attendeeId) &&
        m.id !== excludeMeetingId &&
        m.status !== 'cancelled'
    );
    for (const meeting of filteredMeetings) {
      if (isTimeOverlap(startTime, endTime, meeting.startTime, meeting.endTime)) {
        const attendee = meeting.attendees.find((a) => a.userId === attendeeId);
        conflicts.push({
          type: 'time',
          resourceId: attendeeId,
          resourceName: attendee?.user?.name || attendeeId,
          conflictingMeetingId: meeting.id,
          conflictingMeetingTitle: meeting.title,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
        });
      }
    }
  }
  return conflicts;
}

export function detectAllConflicts(
  meetingData: {
    roomId: string;
    room?: MeetingRoom;
    deviceIds: string[];
    startTime: Date;
    endTime: Date;
    attendeeIds?: string[];
    id?: string;
  },
  existingMeetings: Meeting[],
  devices: Device[]
): ResourceConflict[] {
  const roomConflicts = detectRoomConflict(
    meetingData.roomId,
    meetingData.startTime,
    meetingData.endTime,
    existingMeetings,
    meetingData.id
  );
  const deviceConflicts = detectDeviceConflict(
    meetingData.deviceIds,
    meetingData.startTime,
    meetingData.endTime,
    existingMeetings,
    devices,
    meetingData.id
  );
  const timeConflicts = meetingData.attendeeIds
    ? detectTimeConflict(
        meetingData.startTime,
        meetingData.endTime,
        meetingData.attendeeIds,
        existingMeetings,
        meetingData.id
      )
    : [];
  return [...roomConflicts, ...deviceConflicts, ...timeConflicts];
}

export function getConflictSummary(conflicts: ResourceConflict[]): {
  roomCount: number;
  deviceCount: number;
  timeCount: number;
  total: number;
} {
  return {
    roomCount: conflicts.filter((c) => c.type === 'room').length,
    deviceCount: conflicts.filter((c) => c.type === 'device').length,
    timeCount: conflicts.filter((c) => c.type === 'time').length,
    total: conflicts.length,
  };
}

export function hasCriticalConflict(conflicts: ResourceConflict[]): boolean {
  return conflicts.some((c) => c.type === 'room');
}
