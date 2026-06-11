import type { Meeting, MeetingRoom, Device, MonthlyStatistics } from '@/types';
import {
  isSameMonth,
  getMonthKey,
  getLastNMonths,
  getMinutesDiff,
} from '@/utils/dateUtils';
import { calculateAttendanceRate, calculateCateringCost } from './reportService';

export function findPeakHours(meetings: Meeting[]): { hour: number; count: number }[] {
  const hourCounts: Record<number, number> = {};
  for (let h = 0; h < 24; h++) {
    hourCounts[h] = 0;
  }
  meetings
    .filter((m) => m.status !== 'cancelled')
    .forEach((meeting) => {
      let current = new Date(meeting.startTime);
      current.setMinutes(0, 0, 0);
      const end = new Date(meeting.endTime);
      while (current.getTime() < end.getTime()) {
        const hour = current.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        current.setHours(current.getHours() + 1);
      }
    });
  return Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: Number(hour), count }))
    .sort((a, b) => b.count - a.count);
}

export function calculateRoomUtilization(
  meetings: Meeting[],
  rooms: MeetingRoom[],
  month?: string
): { roomId: string; roomName: string; rate: number; usageHours: number }[] {
  const filteredMeetings = month
    ? meetings.filter((m) => isSameMonth(m.startTime, month) && m.status !== 'cancelled')
    : meetings.filter((m) => m.status !== 'cancelled');
  const totalWorkingHoursPerMonth = 22 * 9;
  return rooms.map((room) => {
    const roomMeetings = filteredMeetings.filter((m) => m.roomId === room.id);
    const usageHours = roomMeetings.reduce(
      (sum, m) => sum + getMinutesDiff(m.endTime, m.startTime) / 60,
      0
    );
    const rate = totalWorkingHoursPerMonth > 0 ? usageHours / totalWorkingHoursPerMonth : 0;
    return {
      roomId: room.id,
      roomName: room.name,
      rate: Math.min(1, rate),
      usageHours: Math.round(usageHours * 10) / 10,
    };
  });
}

export function calculateDeviceFaultRates(
  devices: Device[],
  meetings: Meeting[]
): { deviceId: string; deviceName: string; rate: number; faultCount: number; totalUses: number }[] {
  const deviceUsage: Record<string, number> = {};
  devices.forEach((d) => {
    deviceUsage[d.id] = 0;
  });
  meetings
    .filter((m) => m.status !== 'cancelled')
    .forEach((meeting) => {
      meeting.deviceIds.forEach((deviceId) => {
        if (deviceUsage[deviceId] !== undefined) {
          deviceUsage[deviceId]++;
        }
      });
    });
  return devices.map((device) => {
    const totalUses = deviceUsage[device.id] || 0;
    const historicalFaults = Math.round(device.faultRate * Math.max(totalUses, 10));
    const faultCount = device.status === 'faulty' ? historicalFaults + 1 : historicalFaults;
    const rate = totalUses > 0 ? faultCount / totalUses : device.faultRate;
    return {
      deviceId: device.id,
      deviceName: device.name,
      rate: Math.min(1, rate),
      faultCount,
      totalUses,
    };
  });
}

export function calculateMonthlyStats(
  meetings: Meeting[],
  month: string,
  rooms: MeetingRoom[],
  devices: Device[]
): MonthlyStatistics {
  const monthMeetings = meetings.filter(
    (m) => isSameMonth(m.startTime, month) && m.status !== 'cancelled'
  );
  const totalMeetings = monthMeetings.length;
  const totalMeetingHours = monthMeetings.reduce(
    (sum, m) => sum + getMinutesDiff(m.endTime, m.startTime) / 60,
    0
  );
  const completedMeetings = monthMeetings.filter((m) => m.status === 'completed');
  const attendanceBase = completedMeetings.length > 0 ? completedMeetings : monthMeetings;
  const averageAttendanceRate = attendanceBase.length > 0
    ? attendanceBase.reduce((sum, m) => sum + calculateAttendanceRate(m), 0) / attendanceBase.length
    : 0;
  const roomUtilizationRates = calculateRoomUtilization(meetings, rooms, month).map(
    ({ roomId, roomName, rate }) => ({ roomId, roomName, rate })
  );
  const deviceFaultRates = calculateDeviceFaultRates(devices, monthMeetings).map(
    ({ deviceId, deviceName, rate, faultCount }) => ({ deviceId, deviceName, rate, faultCount })
  );
  const roomUsageCount: Record<string, { roomId: string; roomName: string; count: number }> = {};
  monthMeetings.forEach((m) => {
    if (!roomUsageCount[m.roomId]) {
      roomUsageCount[m.roomId] = {
        roomId: m.roomId,
        roomName: m.room?.name || m.roomId,
        count: 0,
      };
    }
    roomUsageCount[m.roomId].count++;
  });
  const topUsedRooms = Object.values(roomUsageCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const peakHours = findPeakHours(monthMeetings).slice(0, 10);
  const cateringExpense = monthMeetings.reduce((sum, m) => sum + calculateCateringCost(m), 0);
  return {
    month,
    totalMeetings,
    totalMeetingHours: Math.round(totalMeetingHours * 10) / 10,
    averageAttendanceRate,
    roomUtilizationRates,
    deviceFaultRates,
    topUsedRooms,
    peakHours,
    cateringExpense: Math.round(cateringExpense * 100) / 100,
  };
}

export interface TrendDataPoint {
  month: string;
  totalMeetings: number;
  totalHours: number;
  avgAttendance: number;
  cateringExpense: number;
}

export function getTrendData(
  meetings: Meeting[],
  months: number = 6
): TrendDataPoint[] {
  const monthKeys = getLastNMonths(months);
  return monthKeys.map((month) => {
    const monthMeetings = meetings.filter(
      (m) => isSameMonth(m.startTime, month) && m.status !== 'cancelled'
    );
    const totalMeetings = monthMeetings.length;
    const totalHours = monthMeetings.reduce(
      (sum, m) => sum + getMinutesDiff(m.endTime, m.startTime) / 60,
      0
    );
    const completed = monthMeetings.filter((m) => m.status === 'completed');
    const base = completed.length > 0 ? completed : monthMeetings;
    const avgAttendance = base.length > 0
      ? base.reduce((sum, m) => sum + calculateAttendanceRate(m), 0) / base.length
      : 0;
    const cateringExpense = monthMeetings.reduce(
      (sum, m) => sum + calculateCateringCost(m),
      0
    );
    return {
      month,
      totalMeetings,
      totalHours: Math.round(totalHours * 10) / 10,
      avgAttendance,
      cateringExpense: Math.round(cateringExpense * 100) / 100,
    };
  });
}

export function getDepartmentStats(meetings: Meeting[]): {
  department: string;
  meetingCount: number;
  meetingHours: number;
}[] {
  const deptMap: Record<
    string,
    { department: string; meetingCount: number; meetingHours: number }
  > = {};
  meetings
    .filter((m) => m.status !== 'cancelled')
    .forEach((meeting) => {
      const departments = new Set<string>();
      meeting.attendees.forEach((a) => {
        if (a.user?.department) {
          departments.add(a.user.department);
        }
      });
      const hours = getMinutesDiff(meeting.endTime, meeting.startTime) / 60;
      departments.forEach((dept) => {
        if (!deptMap[dept]) {
          deptMap[dept] = { department: dept, meetingCount: 0, meetingHours: 0 };
        }
        deptMap[dept].meetingCount++;
        deptMap[dept].meetingHours += hours;
      });
    });
  return Object.values(deptMap).map((d) => ({
    ...d,
    meetingHours: Math.round(d.meetingHours * 10) / 10,
  }));
}

export function getKPISummary(meetings: Meeting[], rooms: MeetingRoom[], devices: Device[]): {
  totalMeetings: number;
  totalHours: number;
  avgAttendance: number;
  avgRoomUtilization: number;
  avgDeviceFaultRate: number;
  totalCateringExpense: number;
  peakHour: number;
} {
  const activeMeetings = meetings.filter((m) => m.status !== 'cancelled');
  const completedMeetings = meetings.filter((m) => m.status === 'completed');
  const attendanceBase = completedMeetings.length > 0 ? completedMeetings : activeMeetings;
  const totalMeetings = activeMeetings.length;
  const totalHours = activeMeetings.reduce(
    (sum, m) => sum + getMinutesDiff(m.endTime, m.startTime) / 60,
    0
  );
  const avgAttendance = attendanceBase.length > 0
    ? attendanceBase.reduce((sum, m) => sum + calculateAttendanceRate(m), 0) / attendanceBase.length
    : 0;
  const roomUtil = calculateRoomUtilization(meetings, rooms);
  const avgRoomUtilization = roomUtil.length > 0
    ? roomUtil.reduce((sum, r) => sum + r.rate, 0) / roomUtil.length
    : 0;
  const deviceFaults = calculateDeviceFaultRates(devices, meetings);
  const avgDeviceFaultRate = deviceFaults.length > 0
    ? deviceFaults.reduce((sum, d) => sum + d.rate, 0) / deviceFaults.length
    : 0;
  const totalCateringExpense = activeMeetings.reduce(
    (sum, m) => sum + calculateCateringCost(m),
    0
  );
  const peakHours = findPeakHours(activeMeetings);
  const peakHour = peakHours.length > 0 ? peakHours[0].hour : 10;
  return {
    totalMeetings,
    totalHours: Math.round(totalHours * 10) / 10,
    avgAttendance,
    avgRoomUtilization,
    avgDeviceFaultRate,
    totalCateringExpense: Math.round(totalCateringExpense * 100) / 100,
    peakHour,
  };
}

export function getHeatmapData(
  meetings: Meeting[]
): { day: number; hour: number; count: number }[] {
  const data: { day: number; hour: number; count: number }[] = [];
  const activeMeetings = meetings.filter((m) => m.status !== 'cancelled');
  for (let day = 0; day < 7; day++) {
    for (let hour = 8; hour < 20; hour++) {
      data.push({ day, hour, count: 0 });
    }
  }
  activeMeetings.forEach((meeting) => {
    let current = new Date(meeting.startTime);
    current.setMinutes(0, 0, 0);
    const end = new Date(meeting.endTime);
    while (current.getTime() < end.getTime()) {
      const day = current.getDay();
      const hour = current.getHours();
      if (hour >= 8 && hour < 20) {
        const item = data.find((d) => d.day === day && d.hour === hour);
        if (item) {
          item.count++;
        }
      }
      current.setHours(current.getHours() + 1);
    }
  });
  return data;
}
