import { create } from 'zustand';
import type { MeetingRoom, Device, CateringOption, Meeting } from '@/types';
import { mockRooms } from '@/data/rooms';
import { mockDevices } from '@/data/devices';
import { mockCatering } from '@/data/catering';

interface ResourceStoreState {
  rooms: MeetingRoom[];
  devices: Device[];
  cateringOptions: CateringOption[];
}

interface ResourceStoreActions {
  getRoomById: (roomId: string) => MeetingRoom | undefined;
  getDeviceById: (deviceId: string) => Device | undefined;
  getCateringById: (cateringId: string) => CateringOption | undefined;
  getAvailableRooms: (
    startTime: Date,
    endTime: Date,
    capacity?: number,
    excludeMeetingId?: string
  ) => MeetingRoom[];
  getAvailableDevices: (
    roomId: string,
    startTime: Date,
    endTime: Date,
    excludeMeetingId?: string
  ) => Device[];
  getDevicesByType: (type: Device['type']) => Device[];
  getCateringByType: (type: CateringOption['type']) => CateringOption[];
  getRoomsByFloor: (floor: number) => MeetingRoom[];
  setMeetingsForAvailability: (meetings: Meeting[]) => void;
}

export type ResourceStore = ResourceStoreState & ResourceStoreActions;

const isTimeOverlap = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean => {
  const s1 = start1.getTime();
  const e1 = end1.getTime();
  const s2 = start2.getTime();
  const e2 = end2.getTime();
  return s1 < e2 && s2 < e1;
};

let externalMeetings: Meeting[] = [];

export const useResourceStore = create<ResourceStore>((set, get) => ({
  rooms: mockRooms,
  devices: mockDevices,
  cateringOptions: mockCatering,

  setMeetingsForAvailability: (meetings: Meeting[]) => {
    externalMeetings = meetings;
  },

  getRoomById: (roomId: string) => {
    return get().rooms.find(r => r.id === roomId);
  },

  getDeviceById: (deviceId: string) => {
    return get().devices.find(d => d.id === deviceId);
  },

  getCateringById: (cateringId: string) => {
    return get().cateringOptions.find(c => c.id === cateringId);
  },

  getAvailableRooms: (
    startTime: Date,
    endTime: Date,
    capacity?: number,
    excludeMeetingId?: string
  ) => {
    const meetings = externalMeetings;

    return get().rooms.filter(room => {
      if (room.status === 'maintenance') return false;
      if (capacity !== undefined && room.capacity < capacity) return false;

      const conflictingMeeting = meetings.find(meeting => {
        if (excludeMeetingId && meeting.id === excludeMeetingId) return false;
        if (meeting.status === 'cancelled') return false;
        if (meeting.roomId !== room.id) return false;
        return isTimeOverlap(startTime, endTime, meeting.startTime, meeting.endTime);
      });

      return !conflictingMeeting;
    });
  },

  getAvailableDevices: (
    roomId: string,
    startTime: Date,
    endTime: Date,
    excludeMeetingId?: string
  ) => {
    const meetings = externalMeetings;
    const room = get().getRoomById(roomId);
    if (!room) return [];

    return get().devices.filter(device => {
      if (device.status === 'faulty' || device.status === 'maintenance') return false;
      if (!device.compatibleRooms.includes(roomId)) return false;

      const conflictingMeeting = meetings.find(meeting => {
        if (excludeMeetingId && meeting.id === excludeMeetingId) return false;
        if (meeting.status === 'cancelled') return false;
        if (!meeting.deviceIds.includes(device.id)) return false;
        return isTimeOverlap(startTime, endTime, meeting.startTime, meeting.endTime);
      });

      return !conflictingMeeting;
    });
  },

  getDevicesByType: (type: Device['type']) => {
    return get().devices.filter(d => d.type === type);
  },

  getCateringByType: (type: CateringOption['type']) => {
    return get().cateringOptions.filter(c => c.type === type);
  },

  getRoomsByFloor: (floor: number) => {
    return get().rooms.filter(r => r.floor === floor);
  },
}));
