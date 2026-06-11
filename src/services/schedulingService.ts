import type {
  Meeting,
  MeetingRoom,
  Device,
  ResourceConflict,
  AlternativeSuggestion,
  ScheduleResult,
  Attendee,
} from '@/types';
import { detectAllConflicts } from './conflictDetection';
import { generateAlternatives } from './recommendationEngine';
import { generateId, getMinutesDiff } from '@/utils/dateUtils';

export interface CreateMeetingParams {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  roomId: string;
  room: MeetingRoom;
  deviceIds?: string[];
  devices?: Device[];
  cateringIds?: string[];
  attendees: Attendee[];
  agenda?: Meeting['agenda'];
  materials?: Meeting['materials'];
  priority?: Meeting['priority'];
  createdBy: string;
  expectedAttendees?: number;
}

export function createMeetingSchedule(
  meetingParams: CreateMeetingParams,
  existingMeetings: Meeting[],
  rooms: MeetingRoom[],
  devices: Device[]
): ScheduleResult {
  const meetingData = {
    roomId: meetingParams.roomId,
    room: meetingParams.room,
    deviceIds: meetingParams.deviceIds || [],
    startTime: meetingParams.startTime,
    endTime: meetingParams.endTime,
    attendeeIds: meetingParams.attendees.map((a) => a.userId),
  };
  const conflicts = detectAllConflicts(meetingData, existingMeetings, devices);
  if (conflicts.length > 0) {
    const suggestions = generateAlternatives(
      conflicts,
      {
        title: meetingParams.title,
        startTime: meetingParams.startTime,
        endTime: meetingParams.endTime,
        roomId: meetingParams.roomId,
        room: meetingParams.room,
        deviceIds: meetingParams.deviceIds || [],
        attendees: meetingParams.attendees,
        priority: meetingParams.priority || 'medium',
      },
      existingMeetings,
      rooms,
      devices
    );
    return {
      success: false,
      conflicts,
      suggestions,
      warnings: [`检测到 ${conflicts.length} 个冲突`],
    };
  }
  const duration = Math.round(getMinutesDiff(meetingParams.endTime, meetingParams.startTime));
  const meeting: Meeting = {
    id: generateId(),
    title: meetingParams.title,
    description: meetingParams.description || '',
    startTime: new Date(meetingParams.startTime),
    endTime: new Date(meetingParams.endTime),
    duration,
    expectedAttendees: meetingParams.expectedAttendees || meetingParams.attendees.length,
    priority: meetingParams.priority || 'medium',
    roomId: meetingParams.roomId,
    room: meetingParams.room,
    deviceIds: meetingParams.deviceIds || [],
    devices: meetingParams.devices || [],
    cateringIds: meetingParams.cateringIds || [],
    catering: [],
    attendees: meetingParams.attendees,
    agenda: meetingParams.agenda || [],
    materials: meetingParams.materials || [],
    decisions: [],
    status: 'scheduled',
    createdAt: new Date(),
    createdBy: meetingParams.createdBy,
  };
  return {
    success: true,
    conflicts: [],
    suggestions: [],
    warnings: [],
    meeting,
  };
}

export function validateAndBook(
  meetingParams: CreateMeetingParams,
  existingMeetings: Meeting[],
  rooms: MeetingRoom[],
  devices: Device[]
): ScheduleResult {
  const result = createMeetingSchedule(meetingParams, existingMeetings, rooms, devices);
  if (!result.success) {
    return result;
  }
  return {
    ...result,
    message: '会议预订成功，已发送邀请通知',
  };
}

export function reSchedule(
  meetingId: string,
  newData: Partial<CreateMeetingParams> & { originalMeeting: Meeting },
  existingMeetings: Meeting[],
  rooms: MeetingRoom[],
  devices: Device[]
): ScheduleResult {
  const { originalMeeting, ...restNewData } = newData;
  const mergedParams: CreateMeetingParams = {
    title: restNewData.title || originalMeeting.title,
    description: restNewData.description ?? originalMeeting.description,
    startTime: restNewData.startTime || originalMeeting.startTime,
    endTime: restNewData.endTime || originalMeeting.endTime,
    roomId: restNewData.roomId || originalMeeting.roomId,
    room: restNewData.room || originalMeeting.room,
    deviceIds: restNewData.deviceIds || originalMeeting.deviceIds,
    devices: restNewData.devices || originalMeeting.devices,
    cateringIds: restNewData.cateringIds || originalMeeting.cateringIds,
    attendees: restNewData.attendees || originalMeeting.attendees,
    agenda: restNewData.agenda || originalMeeting.agenda,
    materials: restNewData.materials || originalMeeting.materials,
    priority: restNewData.priority || originalMeeting.priority,
    createdBy: originalMeeting.createdBy,
    expectedAttendees: restNewData.expectedAttendees || originalMeeting.expectedAttendees,
  };
  const meetingData = {
    id: meetingId,
    roomId: mergedParams.roomId,
    room: mergedParams.room,
    deviceIds: mergedParams.deviceIds || [],
    startTime: mergedParams.startTime,
    endTime: mergedParams.endTime,
    attendeeIds: mergedParams.attendees.map((a) => a.userId),
  };
  const conflicts = detectAllConflicts(meetingData, existingMeetings, devices);
  if (conflicts.length > 0) {
    const suggestions = generateAlternatives(
      conflicts,
      {
        id: meetingId,
        title: mergedParams.title,
        startTime: mergedParams.startTime,
        endTime: mergedParams.endTime,
        roomId: mergedParams.roomId,
        room: mergedParams.room,
        deviceIds: mergedParams.deviceIds || [],
        attendees: mergedParams.attendees,
        priority: mergedParams.priority || 'medium',
      },
      existingMeetings,
      rooms,
      devices
    );
    return {
      success: false,
      conflicts,
      suggestions,
      warnings: [`重新调度失败，检测到 ${conflicts.length} 个冲突`],
    };
  }
  const duration = Math.round(getMinutesDiff(mergedParams.endTime, mergedParams.startTime));
  const updatedMeeting: Meeting = {
    ...originalMeeting,
    ...mergedParams,
    id: meetingId,
    duration,
    startTime: new Date(mergedParams.startTime),
    endTime: new Date(mergedParams.endTime),
  };
  return {
    success: true,
    conflicts: [],
    suggestions: [],
    meeting: updatedMeeting,
    warnings: ['会议重新调度成功，已发送变更通知'],
  };
}

export function cancelMeeting(meeting: Meeting): Meeting {
  return {
    ...meeting,
    status: 'cancelled',
  };
}

export function startMeeting(meeting: Meeting): Meeting {
  return {
    ...meeting,
    status: 'in-progress',
    actualStartTime: new Date(),
  };
}

export function completeMeeting(meeting: Meeting, decisions: string[] = []): Meeting {
  return {
    ...meeting,
    status: 'completed',
    actualEndTime: new Date(),
    decisions: [...meeting.decisions, ...decisions],
  };
}
