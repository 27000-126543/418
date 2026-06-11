export const padZero = (num: number): string => {
  return num.toString().padStart(2, '0');
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = padZero(d.getMonth() + 1);
  const day = padZero(d.getDate());
  const hour = padZero(d.getHours());
  const minute = padZero(d.getMinutes());
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = padZero(d.getMonth() + 1);
  const day = padZero(d.getDate());
  return `${year}-${month}-${day}`;
};

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hour = padZero(d.getHours());
  const minute = padZero(d.getMinutes());
  return `${hour}:${minute}`;
};

export const getTodayRange = (): { start: Date; end: Date } => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const addMinutes = (date: Date, minutes: number): Date => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
};

export const isTimeOverlap = (
  start1: Date | string,
  end1: Date | string,
  start2: Date | string,
  end2: Date | string
): boolean => {
  const s1 = typeof start1 === 'string' ? new Date(start1).getTime() : start1.getTime();
  const e1 = typeof end1 === 'string' ? new Date(end1).getTime() : end1.getTime();
  const s2 = typeof start2 === 'string' ? new Date(start2).getTime() : start2.getTime();
  const e2 = typeof end2 === 'string' ? new Date(end2).getTime() : end2.getTime();
  return s1 < e2 && s2 < e1;
};

export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const getMonthDays = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

export const getMonthKey = (date: Date): string => {
  return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}`;
};

export const getWeekDay = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return weekdays[d.getDay()];
};

export const getRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) return `${diffDay}天前`;
  if (diffHour > 0) return `${diffHour}小时前`;
  if (diffMin > 0) return `${diffMin}分钟前`;
  return '刚刚';
};

export const subtractMinutes = (date: Date, minutes: number): Date => {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() - minutes);
  return result;
};

export const getMinutesDiff = (start: Date | string, end: Date | string): number => {
  const s = typeof start === 'string' ? new Date(start).getTime() : start.getTime();
  const e = typeof end === 'string' ? new Date(end).getTime() : end.getTime();
  return Math.round((e - s) / (1000 * 60));
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}小时`;
  }
  return `${hours}小时${remainingMinutes}分钟`;
};

export const generateId = (prefix: string = 'id'): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}-${timestamp}-${random}`;
};

export const isSameMonth = (date: Date, month: string): boolean => {
  const [year, monthNum] = month.split('-').map(Number);
  return date.getFullYear() === year && date.getMonth() === monthNum - 1;
};

export const getLastNMonths = (n: number): string[] => {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(getMonthKey(d));
  }
  return months;
};

export const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getWorkingHoursSlots = (startHour = 9, endHour = 18, step = 30): { startTime: Date; endTime: Date }[] => {
  const slots: { startTime: Date; endTime: Date }[] = [];
  const today = new Date();
  let current = new Date(today);
  current.setHours(startHour, 0, 0, 0);
  const end = new Date(today);
  end.setHours(endHour, 0, 0, 0);
  while (current.getTime() < end.getTime()) {
    const slotEnd = addMinutes(current, step);
    slots.push({ startTime: new Date(current), endTime: slotEnd });
    current = slotEnd;
  }
  return slots;
};

export const getMeetingsByMonth = <T extends { startTime: Date }>(meetings: T[], month: string): T[] => {
  return meetings.filter((m) => isSameMonth(m.startTime, month));
};

export const getMeetingsByDateRange = <T extends { startTime: Date }>(
  meetings: T[],
  startDate: Date,
  endDate: Date
): T[] => {
  return meetings.filter(
    (m) => m.startTime.getTime() >= startDate.getTime() && m.startTime.getTime() <= endDate.getTime()
  );
};
