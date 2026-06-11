import { create } from 'zustand';
import type {
  Meeting,
  MeetingStatus,
  AttendanceStatus,
  Material,
  AgendaItem,
  CreateMeetingData,
  Attendee,
} from '@/types';
import { mockMeetings } from '@/data/meetings';
import { mockUsers } from '@/data/users';
import { useResourceStore } from './useResourceStore';

const generateId = (): string => {
  return 'id_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

const calculateDuration = (startTime: Date, endTime: Date): number => {
  return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
};

interface MeetingStoreState {
  meetings: Meeting[];
}

interface MeetingStoreActions {
  getMeetingById: (meetingId: string) => Meeting | undefined;
  getMeetingsByUserId: (userId: string) => Meeting[];
  getMeetingsByHostId: (hostId: string) => Meeting[];
  getMeetingsByStatus: (status: MeetingStatus) => Meeting[];
  getMeetingsByDateRange: (startDate: Date, endDate: Date) => Meeting[];
  getMeetingsByRoomId: (roomId: string) => Meeting[];
  getTodayMeetings: () => Meeting[];
  createMeeting: (data: CreateMeetingData, createdBy: string) => Meeting;
  updateMeeting: (meetingId: string, updates: Partial<Omit<Meeting, 'id'>>) => Meeting | undefined;
  deleteMeeting: (meetingId: string) => boolean;
  updateMeetingStatus: (meetingId: string, status: MeetingStatus) => Meeting | undefined;
  updateAttendanceStatus: (
    meetingId: string,
    userId: string,
    status: AttendanceStatus
  ) => Meeting | undefined;
  addMaterial: (meetingId: string, material: Omit<Material, 'id' | 'uploadedAt'>) => Meeting | undefined;
  removeMaterial: (meetingId: string, materialId: string) => Meeting | undefined;
  addAgendaItem: (meetingId: string, item: Omit<AgendaItem, 'id'>) => Meeting | undefined;
  updateAgendaItem: (
    meetingId: string,
    agendaId: string,
    updates: Partial<Omit<AgendaItem, 'id'>>
  ) => Meeting | undefined;
  removeAgendaItem: (meetingId: string, agendaId: string) => Meeting | undefined;
  adjustResources: (
    meetingId: string,
    deviceIds: string[],
    cateringIds: string[]
  ) => Meeting | undefined;
  addDecision: (meetingId: string, decision: string) => Meeting | undefined;
  startMeeting: (meetingId: string) => Meeting | undefined;
  endMeeting: (meetingId: string) => Meeting | undefined;
  cancelMeeting: (meetingId: string) => Meeting | undefined;
}

export type MeetingStore = MeetingStoreState & MeetingStoreActions;

export const useMeetingStore = create<MeetingStore>((set, get) => ({
  meetings: mockMeetings,

  getMeetingById: (meetingId: string) => {
    return get().meetings.find(m => m.id === meetingId);
  },

  getMeetingsByUserId: (userId: string) => {
    return get().meetings.filter(m =>
      m.attendees.some(a => a.userId === userId)
    );
  },

  getMeetingsByHostId: (hostId: string) => {
    return get().meetings.filter(m =>
      m.attendees.some(a => a.userId === hostId && a.isHost)
    );
  },

  getMeetingsByStatus: (status: MeetingStatus) => {
    return get().meetings.filter(m => m.status === status);
  },

  getMeetingsByDateRange: (startDate: Date, endDate: Date) => {
    const start = startDate.getTime();
    const end = endDate.getTime();
    return get().meetings.filter(m => {
      const mStart = m.startTime.getTime();
      const mEnd = m.endTime.getTime();
      return mStart < end && mEnd > start;
    });
  },

  getMeetingsByRoomId: (roomId: string) => {
    return get().meetings.filter(m => m.roomId === roomId);
  },

  getTodayMeetings: () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    return get().getMeetingsByDateRange(todayStart, todayEnd);
  },

  createMeeting: (data: CreateMeetingData, createdBy: string) => {
    const resourceStore = useResourceStore.getState();
    const room = resourceStore.getRoomById(data.roomId);
    const devices = resourceStore.devices.filter(d => data.deviceIds.includes(d.id));
    const catering = resourceStore.cateringOptions.filter(c => data.cateringIds.includes(c.id));

    const attendees: Attendee[] = data.attendeeUserIds.map(userId => {
      const user = mockUsers.find(u => u.id === userId);
      if (!user) throw new Error(`User not found: ${userId}`);
      return {
        userId,
        user,
        status: userId === createdBy ? 'confirmed' : 'pending',
        respondedAt: userId === createdBy ? new Date() : undefined,
        isHost: userId === createdBy,
      };
    });

    if (!attendees.some(a => a.isHost)) {
      const hostUser = mockUsers.find(u => u.id === createdBy);
      if (hostUser) {
        attendees.unshift({
          userId: createdBy,
          user: hostUser,
          status: 'confirmed',
          respondedAt: new Date(),
          isHost: true,
        });
      }
    }

    const agenda: AgendaItem[] = (data.agenda ?? []).map((item, index) => ({
      ...item,
      id: generateId(),
      order: item.order ?? index + 1,
    }));

    if (!room) {
      throw new Error(`Room not found: ${data.roomId}`);
    }

    const newMeeting: Meeting = {
      id: generateId(),
      title: data.title,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
      duration: calculateDuration(data.startTime, data.endTime),
      expectedAttendees: data.expectedAttendees,
      priority: data.priority,
      roomId: data.roomId,
      room,
      deviceIds: data.deviceIds,
      devices,
      cateringIds: data.cateringIds,
      catering,
      attendees,
      agenda,
      materials: [],
      decisions: [],
      status: 'scheduled',
      createdAt: new Date(),
      createdBy,
    };

    set(state => ({
      meetings: [...state.meetings, newMeeting],
    }));

    return newMeeting;
  },

  updateMeeting: (meetingId: string, updates: Partial<Omit<Meeting, 'id'>>) => {
    const resourceStore = useResourceStore.getState();
    let updated: Meeting | undefined;

    set(state => {
      const meetings = state.meetings.map(meeting => {
        if (meeting.id !== meetingId) return meeting;

        let merged: Meeting = { ...meeting, ...updates };

        if (updates.startTime || updates.endTime) {
          merged.duration = calculateDuration(merged.startTime, merged.endTime);
        }

        if (updates.roomId && updates.roomId !== meeting.roomId) {
          const room = resourceStore.getRoomById(updates.roomId);
          if (room) merged.room = room;
        }

        if (updates.deviceIds) {
          merged.devices = resourceStore.devices.filter(d => updates.deviceIds!.includes(d.id));
        }

        if (updates.cateringIds) {
          merged.catering = resourceStore.cateringOptions.filter(c => updates.cateringIds!.includes(c.id));
        }

        updated = merged;
        return merged;
      });
      return { meetings };
    });

    return updated;
  },

  deleteMeeting: (meetingId: string) => {
    const exists = get().meetings.some(m => m.id === meetingId);
    if (!exists) return false;

    set(state => ({
      meetings: state.meetings.filter(m => m.id !== meetingId),
    }));
    return true;
  },

  updateMeetingStatus: (meetingId: string, status: MeetingStatus) => {
    return get().updateMeeting(meetingId, { status });
  },

  updateAttendanceStatus: (
    meetingId: string,
    userId: string,
    status: AttendanceStatus
  ) => {
    let updated: Meeting | undefined;

    set(state => {
      const meetings = state.meetings.map(meeting => {
        if (meeting.id !== meetingId) return meeting;

        const attendees = meeting.attendees.map(attendee => {
          if (attendee.userId !== userId) return attendee;
          return {
            ...attendee,
            status,
            respondedAt: new Date(),
          };
        });

        updated = { ...meeting, attendees };
        return updated;
      });
      return { meetings };
    });

    return updated;
  },

  addMaterial: (meetingId: string, material: Omit<Material, 'id' | 'uploadedAt'>) => {
    let updated: Meeting | undefined;
    const newMaterial: Material = {
      ...material,
      id: generateId(),
      uploadedAt: new Date(),
    };

    set(state => {
      const meetings = state.meetings.map(meeting => {
        if (meeting.id !== meetingId) return meeting;
        updated = {
          ...meeting,
          materials: [...meeting.materials, newMaterial],
        };
        return updated;
      });
      return { meetings };
    });

    return updated;
  },

  removeMaterial: (meetingId: string, materialId: string) => {
    let updated: Meeting | undefined;

    set(state => {
      const meetings = state.meetings.map(meeting => {
        if (meeting.id !== meetingId) return meeting;
        updated = {
          ...meeting,
          materials: meeting.materials.filter(m => m.id !== materialId),
        };
        return updated;
      });
      return { meetings };
    });

    return updated;
  },

  addAgendaItem: (meetingId: string, item: Omit<AgendaItem, 'id'>) => {
    let updated: Meeting | undefined;

    set(state => {
      const meetings = state.meetings.map(meeting => {
        if (meeting.id !== meetingId) return meeting;

        const order = item.order ?? meeting.agenda.length + 1;
        const newAgendaItem: AgendaItem = {
          ...item,
          id: generateId(),
          order,
        };

        const agenda = [...meeting.agenda, newAgendaItem].sort((a, b) => a.order - b.order);

        updated = { ...meeting, agenda };
        return updated;
      });
      return { meetings };
    });

    return updated;
  },

  updateAgendaItem: (
    meetingId: string,
    agendaId: string,
    updates: Partial<Omit<AgendaItem, 'id'>>
  ) => {
    let updated: Meeting | undefined;

    set(state => {
      const meetings = state.meetings.map(meeting => {
        if (meeting.id !== meetingId) return meeting;

        const agenda = meeting.agenda.map(item => {
          if (item.id !== agendaId) return item;
          return { ...item, ...updates };
        }).sort((a, b) => a.order - b.order);

        updated = { ...meeting, agenda };
        return updated;
      });
      return { meetings };
    });

    return updated;
  },

  removeAgendaItem: (meetingId: string, agendaId: string) => {
    let updated: Meeting | undefined;

    set(state => {
      const meetings = state.meetings.map(meeting => {
        if (meeting.id !== meetingId) return meeting;
        updated = {
          ...meeting,
          agenda: meeting.agenda.filter(a => a.id !== agendaId),
        };
        return updated;
      });
      return { meetings };
    });

    return updated;
  },

  adjustResources: (
    meetingId: string,
    deviceIds: string[],
    cateringIds: string[]
  ) => {
    return get().updateMeeting(meetingId, { deviceIds, cateringIds });
  },

  addDecision: (meetingId: string, decision: string) => {
    let updated: Meeting | undefined;

    set(state => {
      const meetings = state.meetings.map(meeting => {
        if (meeting.id !== meetingId) return meeting;
        updated = {
          ...meeting,
          decisions: [...meeting.decisions, decision],
        };
        return updated;
      });
      return { meetings };
    });

    return updated;
  },

  startMeeting: (meetingId: string) => {
    return get().updateMeeting(meetingId, {
      status: 'in-progress',
      actualStartTime: new Date(),
    });
  },

  endMeeting: (meetingId: string) => {
    return get().updateMeeting(meetingId, {
      status: 'completed',
      actualEndTime: new Date(),
    });
  },

  cancelMeeting: (meetingId: string) => {
    return get().updateMeeting(meetingId, { status: 'cancelled' });
  },
}));
