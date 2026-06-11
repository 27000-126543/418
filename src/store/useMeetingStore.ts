import { create } from 'zustand';
import type {
  Meeting,
  MeetingStatus,
  AttendanceStatus,
  Material,
  AgendaItem,
  CreateMeetingData,
  Attendee,
  Notification,
  ResourceChange,
  PreMeetingChecklistItem,
  ActionItem,
} from '@/types';
import { mockMeetings } from '@/data/meetings';
import { mockUsers } from '@/data/users';
import { useResourceStore } from './useResourceStore';
import { useNotificationStore } from './useNotificationStore';
import { createMeetingNotifications, createResourceChangeNotification, getUncompletedChecklistDetails, buildReminderContentForMeeting } from '@/services/notificationService';

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
  addMaterial: (meetingId: string, material: Omit<Material, 'id' | 'uploadedAt' | 'version' | 'parentId' | 'isLatest'>) => Meeting | undefined;
  removeMaterial: (meetingId: string, materialId: string) => Meeting | undefined;
  getMaterialVersions: (meetingId: string, parentId: string) => Material[];
  setMaterialLatestVersion: (meetingId: string, materialId: string) => Meeting | undefined;
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
  toggleChecklistItem: (
    meetingId: string,
    itemId: string,
    completed: boolean,
    userId: string
  ) => Meeting | undefined;
  addChecklistItem: (
    meetingId: string,
    item: Omit<PreMeetingChecklistItem, 'id'>
  ) => Meeting | undefined;
  removeChecklistItem: (meetingId: string, itemId: string) => Meeting | undefined;
  markActualAttendee: (meetingId: string, userId: string, present: boolean) => Meeting | undefined;
  addActionItem: (meetingId: string, item: Omit<ActionItem, 'id' | 'createdAt'>) => Meeting | undefined;
  updateActionItem: (meetingId: string, itemId: string, updates: Partial<ActionItem>) => Meeting | undefined;
  removeActionItem: (meetingId: string, itemId: string) => Meeting | undefined;
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

    const preMeetingChecklist: PreMeetingChecklistItem[] = [
      {
        id: generateId(),
        category: 'agenda',
        title: '议程已填写',
        description: '确认会议议程是否已完整填写',
        completed: agenda.length > 0,
        completedAt: agenda.length > 0 ? new Date() : undefined,
        completedBy: agenda.length > 0 ? createdBy : undefined,
        autoDetect: true,
      },
      {
        id: generateId(),
        category: 'material',
        title: '材料已上传',
        description: '确认会议所需材料是否已上传',
        completed: false,
        autoDetect: true,
      },
      {
        id: generateId(),
        category: 'attendance',
        title: '参会人已响应',
        description: '确认80%以上参会人已确认出席',
        completed: false,
        autoDetect: true,
      },
      {
        id: generateId(),
        category: 'catering',
        title: '餐饮已确认',
        description: '确认餐饮安排是否已落实',
        completed: catering.length > 0 || data.cateringIds.length === 0,
        completedAt: catering.length > 0 || data.cateringIds.length === 0 ? new Date() : undefined,
        completedBy: catering.length > 0 || data.cateringIds.length === 0 ? createdBy : undefined,
        autoDetect: true,
      },
      {
        id: generateId(),
        category: 'device',
        title: '设备已预定',
        description: '确认所需设备是否已预定',
        completed: devices.length > 0 || data.deviceIds.length === 0,
        completedAt: devices.length > 0 || data.deviceIds.length === 0 ? new Date() : undefined,
        completedBy: devices.length > 0 || data.deviceIds.length === 0 ? createdBy : undefined,
        autoDetect: true,
      },
    ];

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
      preMeetingChecklist,
    };

    set(state => ({
      meetings: [...state.meetings, newMeeting],
    }));

    const allNotifications = createMeetingNotifications(newMeeting);
    const attendeeNotifications = allNotifications.filter(n => {
      const attendee = newMeeting.attendees.find(a => a.userId === n.userId);
      return attendee && !attendee.isHost;
    });
    const notificationData: Array<Omit<Notification, 'id' | 'createdAt' | 'read'>> = attendeeNotifications.map(n => ({
      type: n.type,
      meetingId: n.meetingId,
      meetingTitle: n.meetingTitle,
      userId: n.userId,
      title: n.title,
      content: n.content,
      actionRequired: n.actionRequired,
    }));
    useNotificationStore.getState().addBulkNotifications(notificationData);

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

  addMaterial: (meetingId: string, material: Omit<Material, 'id' | 'uploadedAt' | 'version' | 'parentId' | 'isLatest'>) => {
    let updated: Meeting | undefined;
    const newId = generateId();

    set(state => {
      const meetings = state.meetings.map(meeting => {
        if (meeting.id !== meetingId) return meeting;

        const existingMaterials = meeting.materials;
        const sameNameMaterials = existingMaterials.filter(m => m.name === material.name);

        let version: number;
        let parentId: string;
        let isLatest = true;

        if (sameNameMaterials.length > 0) {
          const maxVersion = Math.max(...sameNameMaterials.map(m => m.version));
          version = maxVersion + 1;
          parentId = sameNameMaterials[0].parentId;
        } else {
          version = 1;
          parentId = newId;
        }

        const existingLatest = sameNameMaterials.find(m => m.isLatest);
        const visibility = material.visibility ?? existingLatest?.visibility ?? 'public';

        const newMaterial: Material = {
          ...material,
          id: newId,
          uploadedAt: new Date(),
          version,
          parentId,
          isLatest,
          visibility,
        };

        const updatedMaterials = existingMaterials.map(m => {
          if (m.name === material.name) {
            return { ...m, isLatest: false };
          }
          return m;
        });

        updatedMaterials.push(newMaterial);

        updatedMaterials.sort((a, b) => {
          if (a.name !== b.name) return a.name.localeCompare(b.name);
          return b.version - a.version;
        });

        updated = {
          ...meeting,
          materials: updatedMaterials,
        };
        return updated;
      });
      return { meetings };
    });

    return updated;
  },

  getMaterialVersions: (meetingId: string, parentId: string) => {
    const meeting = get().getMeetingById(meetingId);
    if (!meeting) return [];
    return meeting.materials
      .filter(m => m.parentId === parentId)
      .sort((a, b) => b.version - a.version);
  },

  setMaterialLatestVersion: (meetingId: string, materialId: string) => {
    let updated: Meeting | undefined;

    set(state => {
      const meetings = state.meetings.map(meeting => {
        if (meeting.id !== meetingId) return meeting;

        const targetMaterial = meeting.materials.find(m => m.id === materialId);
        if (!targetMaterial) return meeting;

        const updatedMaterials = meeting.materials.map(m => {
          if (m.parentId === targetMaterial.parentId) {
            return { ...m, isLatest: m.id === materialId };
          }
          return m;
        });

        updatedMaterials.sort((a, b) => {
          if (a.name !== b.name) return a.name.localeCompare(b.name);
          return b.version - a.version;
        });

        updated = {
          ...meeting,
          materials: updatedMaterials,
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
    const meeting = get().getMeetingById(meetingId);
    if (!meeting) return undefined;

    const resourceStore = useResourceStore.getState();
    const changes: ResourceChange[] = [];

    const oldDeviceNames = meeting.devices.map(d => d.name);
    const newDevices = resourceStore.devices.filter(d => deviceIds.includes(d.id));
    const newDeviceNames = newDevices.map(d => d.name);

    const oldDeviceIdsSet = new Set(meeting.deviceIds);
    const newDeviceIdsSet = new Set(deviceIds);
    const devicesChanged =
      oldDeviceIdsSet.size !== newDeviceIdsSet.size ||
      [...oldDeviceIdsSet].some(id => !newDeviceIdsSet.has(id));

    if (devicesChanged) {
      changes.push({
        id: generateId(),
        type: 'device',
        field: '设备',
        oldValue: oldDeviceNames,
        newValue: newDeviceNames,
        changedAt: new Date(),
        changedBy: meeting.createdBy,
        description: '会议设备已变更',
      });
    }

    const oldCateringNames = meeting.catering.map(c => c.name);
    const newCatering = resourceStore.cateringOptions.filter(c => cateringIds.includes(c.id));
    const newCateringNames = newCatering.map(c => c.name);

    const oldCateringIdsSet = new Set(meeting.cateringIds);
    const newCateringIdsSet = new Set(cateringIds);
    const cateringChanged =
      oldCateringIdsSet.size !== newCateringIdsSet.size ||
      [...oldCateringIdsSet].some(id => !newCateringIdsSet.has(id));

    if (cateringChanged) {
      changes.push({
        id: generateId(),
        type: 'catering',
        field: '餐饮项目',
        oldValue: oldCateringNames,
        newValue: newCateringNames,
        changedAt: new Date(),
        changedBy: meeting.createdBy,
        description: '会议餐饮项目已变更',
      });
    }

    const updatedMeeting = get().updateMeeting(meetingId, { deviceIds, cateringIds });

    if (changes.length > 0 && updatedMeeting) {
      const notifications = createResourceChangeNotification(updatedMeeting, changes);
      const notificationData: Array<Omit<Notification, 'id' | 'createdAt' | 'read'>> =
        notifications.map(n => ({
          type: n.type,
          meetingId: n.meetingId,
          meetingTitle: n.meetingTitle,
          userId: n.userId,
          title: n.title,
          content: n.content,
          actionRequired: n.actionRequired,
        }));
      useNotificationStore.getState().addBulkNotifications(notificationData);
    }

    return updatedMeeting;
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
    const meeting = get().getMeetingById(meetingId);
    if (!meeting) return undefined;

    const actualAttendees = meeting.attendees
      .filter(a => a.status === 'confirmed')
      .map(a => a.userId);

    return get().updateMeeting(meetingId, {
      status: 'in-progress',
      actualStartTime: new Date(),
      actualAttendees,
    });
  },

  endMeeting: (meetingId: string) => {
    const meeting = get().getMeetingById(meetingId);
    if (!meeting) return undefined;

    const now = new Date();
    const updatedActionItems = (meeting.actionItems ?? []).map(item => {
      if (item.status === 'completed') return item;
      const isOverdue = new Date(item.dueDate) < now;
      return {
        ...item,
        status: isOverdue ? 'overdue' as const : item.status === 'in_progress' ? 'in_progress' as const : 'pending' as const,
      };
    });

    return get().updateMeeting(meetingId, {
      status: 'completed',
      actualEndTime: now,
      actionItems: updatedActionItems,
    });
  },

  cancelMeeting: (meetingId: string) => {
    return get().updateMeeting(meetingId, { status: 'cancelled' });
  },

  toggleChecklistItem: (
    meetingId: string,
    itemId: string,
    completed: boolean,
    userId: string
  ) => {
    let updated: Meeting | undefined;

    set(state => {
      const meetings = state.meetings.map(meeting => {
        if (meeting.id !== meetingId) return meeting;

        const checklist = meeting.preMeetingChecklist?.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            completed,
            completedAt: completed ? new Date() : undefined,
            completedBy: completed ? userId : undefined,
          };
        }) ?? [];

        updated = { ...meeting, preMeetingChecklist: checklist };
        return updated;
      });
      return { meetings };
    });

    if (updated) {
      const notificationStore = useNotificationStore.getState();
      const reminderNotifications = notificationStore.notifications.filter(
        n => n.meetingId === meetingId && n.type === 'reminder'
      );

      const uncompletedDetails = getUncompletedChecklistDetails(updated);
      const uncompletedCount = uncompletedDetails.length;

      for (const reminder of reminderNotifications) {
        const hostAttendee = updated.attendees.find(a => a.userId === reminder.userId);
        const isHost = hostAttendee?.isHost ?? false;
        const newContent = buildReminderContentForMeeting(updated, isHost);

        notificationStore.updateNotificationContent(reminder.id, {
          content: newContent,
          actionRequired: uncompletedCount > 0 && isHost,
        });
      }
    }

    return updated;
  },

  addChecklistItem: (
    meetingId: string,
    item: Omit<PreMeetingChecklistItem, 'id'>
  ) => {
    let updated: Meeting | undefined;
    const newItem: PreMeetingChecklistItem = {
      ...item,
      id: generateId(),
    };

    set(state => {
      const meetings = state.meetings.map(meeting => {
        if (meeting.id !== meetingId) return meeting;

        const checklist = [...(meeting.preMeetingChecklist ?? []), newItem];
        updated = { ...meeting, preMeetingChecklist: checklist };
        return updated;
      });
      return { meetings };
    });

    return updated;
  },

  removeChecklistItem: (meetingId: string, itemId: string) => {
    let updated: Meeting | undefined;

    set(state => {
      const meetings = state.meetings.map(meeting => {
        if (meeting.id !== meetingId) return meeting;

        const checklist = meeting.preMeetingChecklist?.filter(item => item.id !== itemId) ?? [];
        updated = { ...meeting, preMeetingChecklist: checklist };
        return updated;
      });
      return { meetings };
    });

    return updated;
  },

  markActualAttendee: (meetingId: string, userId: string, present: boolean) => {
    let updated: Meeting | undefined;

    set(state => {
      const meetings = state.meetings.map(meeting => {
        if (meeting.id !== meetingId) return meeting;

        const actualAttendees = present
          ? [...new Set([...(meeting.actualAttendees ?? []), userId])]
          : (meeting.actualAttendees ?? []).filter(id => id !== userId);

        updated = { ...meeting, actualAttendees };
        return updated;
      });
      return { meetings };
    });

    return updated;
  },

  addActionItem: (meetingId: string, item: Omit<ActionItem, 'id' | 'createdAt'>) => {
    let updated: Meeting | undefined;

    set(state => {
      const meetings = state.meetings.map(meeting => {
        if (meeting.id !== meetingId) return meeting;

        const newItem: ActionItem = {
          ...item,
          id: generateId(),
          createdAt: new Date(),
        };

        updated = {
          ...meeting,
          actionItems: [...(meeting.actionItems ?? []), newItem],
        };
        return updated;
      });
      return { meetings };
    });

    return updated;
  },

  updateActionItem: (meetingId: string, itemId: string, updates: Partial<ActionItem>) => {
    let updated: Meeting | undefined;

    set(state => {
      const meetings = state.meetings.map(meeting => {
        if (meeting.id !== meetingId) return meeting;

        const actionItems = (meeting.actionItems ?? []).map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            ...updates,
            completedAt: updates.status === 'completed' ? new Date() : item.completedAt,
          };
        });

        updated = { ...meeting, actionItems };
        return updated;
      });
      return { meetings };
    });

    return updated;
  },

  removeActionItem: (meetingId: string, itemId: string) => {
    let updated: Meeting | undefined;

    set(state => {
      const meetings = state.meetings.map(meeting => {
        if (meeting.id !== meetingId) return meeting;

        updated = {
          ...meeting,
          actionItems: (meeting.actionItems ?? []).filter(item => item.id !== itemId),
        };
        return updated;
      });
      return { meetings };
    });

    return updated;
  },
}));
