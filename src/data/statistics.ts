import type { MonthlyStatistics } from '@/types';
import { rooms } from '@/data/rooms';
import { devices } from '@/data/devices';

const roomNames = rooms.map((r) => ({ roomId: r.id, roomName: r.name }));
const deviceNames = devices.map((d) => ({ deviceId: d.id, deviceName: d.name }));

const generateRoomUtilizationRates = (baseSeed: number) => {
  return roomNames.map((rn, idx) => ({
    ...rn,
    rate: Math.round((45 + ((baseSeed + idx * 7) % 35) + Math.random() * 10) * 100) / 100,
  }));
};

const generateDeviceFaultRates = (baseSeed: number) => {
  return deviceNames.map((dn, idx) => {
    const faultCount = Math.floor(((baseSeed + idx * 3) % 6) + (idx % 2));
    const totalUsage = 80 + ((baseSeed + idx * 5) % 40);
    return {
      ...dn,
      rate: Math.round((faultCount / totalUsage) * 10000) / 100,
      faultCount,
    };
  });
};

const generateTopUsedRooms = () => {
  const shuffled = [...roomNames].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map((rn, idx) => ({
    ...rn,
    count: 28 - idx * 5 + Math.floor(Math.random() * 6),
  }));
};

const generatePeakHours = () => {
  const hours = [9, 10, 11, 14, 15, 16, 17];
  const counts = [18, 25, 22, 20, 28, 24, 15];
  return hours.map((hour, idx) => ({
    hour,
    count: counts[idx] + Math.floor(Math.random() * 6) - 3,
  }));
};

const monthData = [
  { month: '2026-01', seed: 12, meetings: 78, hours: 156, attendance: 85.6, expense: 12580 },
  { month: '2026-02', seed: 18, meetings: 65, hours: 132, attendance: 83.2, expense: 10920 },
  { month: '2026-03', seed: 25, meetings: 92, hours: 188, attendance: 88.1, expense: 15340 },
  { month: '2026-04', seed: 32, meetings: 88, hours: 176, attendance: 86.4, expense: 14680 },
  { month: '2026-05', seed: 40, meetings: 105, hours: 210, attendance: 89.7, expense: 17520 },
  { month: '2026-06', seed: 48, meetings: 96, hours: 194, attendance: 87.8, expense: 16280 },
];

export const monthlyStatistics: MonthlyStatistics[] = monthData.map((m) => ({
  month: m.month,
  totalMeetings: m.meetings,
  totalMeetingHours: m.hours,
  averageAttendanceRate: m.attendance,
  roomUtilizationRates: generateRoomUtilizationRates(m.seed),
  deviceFaultRates: generateDeviceFaultRates(m.seed),
  topUsedRooms: generateTopUsedRooms(),
  peakHours: generatePeakHours(),
  cateringExpense: m.expense,
}));

export const getStatisticsByMonth = (month: string): MonthlyStatistics | undefined => {
  return monthlyStatistics.find((s) => s.month === month);
};

export const getLatestStatistics = (): MonthlyStatistics => {
  return monthlyStatistics[monthlyStatistics.length - 1];
};

export const getStatisticsRange = (startMonth: string, endMonth: string): MonthlyStatistics[] => {
  return monthlyStatistics.filter((s) => s.month >= startMonth && s.month <= endMonth);
};

export const getSummaryStatistics = () => {
  const latest = getLatestStatistics();
  const previous = monthlyStatistics[monthlyStatistics.length - 2];

  const totalMeetings = monthlyStatistics.reduce((sum, s) => sum + s.totalMeetings, 0);
  const totalHours = monthlyStatistics.reduce((sum, s) => sum + s.totalMeetingHours, 0);
  const avgAttendance = monthlyStatistics.reduce((sum, s) => sum + s.averageAttendanceRate, 0) / monthlyStatistics.length;
  const totalExpense = monthlyStatistics.reduce((sum, s) => sum + s.cateringExpense, 0);

  const avgRoomUtilization = latest.roomUtilizationRates.reduce((sum, r) => sum + r.rate, 0) / latest.roomUtilizationRates.length;

  return {
    latest,
    previous,
    totalMeetings,
    totalHours,
    averageAttendance: Math.round(avgAttendance * 100) / 100,
    totalExpense,
    averageRoomUtilization: Math.round(avgRoomUtilization * 100) / 100,
    meetingGrowth: previous ? Math.round(((latest.totalMeetings - previous.totalMeetings) / previous.totalMeetings) * 10000) / 100 : 0,
    expenseGrowth: previous ? Math.round(((latest.cateringExpense - previous.cateringExpense) / previous.cateringExpense) * 10000) / 100 : 0,
  };
};
