export type UserRole = 'admin' | 'host' | 'attendee';

export type UserLevel = 'executive' | 'senior' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: UserRole;
  department: string;
  position: string;
  level: UserLevel;
}

export type RoomStatus = 'available' | 'occupied' | 'maintenance';

export interface MeetingRoom {
  id: string;
  name: string;
  capacity: number;
  location: string;
  floor: number;
  facilities: string[];
  image: string;
  status: RoomStatus;
}

export type DeviceType = 'projector' | 'whiteboard' | 'video-conferencing' | 'speaker' | 'microphone';

export type DeviceStatus = 'available' | 'in-use' | 'faulty' | 'maintenance';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  model: string;
  compatibleRooms: string[];
  roomId: string;
  status: DeviceStatus;
  faultRate: number;
  faultCount: number;
  useCount: number;
  lastMaintenanceAt: Date;
}

export type CateringType = 'coffee' | 'tea' | 'snacks' | 'lunch' | 'dinner' | 'fruit';

export interface CateringOption {
  id: string;
  name: string;
  type: CateringType;
  pricePerPerson: number;
  preparationTime: number;
  description: string;
  image: string;
}

export type AttendanceStatus = 'confirmed' | 'tentative' | 'declined' | 'late' | 'absent' | 'pending';

export interface Attendee {
  userId: string;
  user: User;
  status: AttendanceStatus;
  respondedAt?: Date;
  isHost: boolean;
}

export interface AgendaItem {
  id: string;
  title: string;
  duration: number;
  presenterId?: string;
  order: number;
}

export type MaterialType = 'pdf' | 'ppt' | 'doc' | 'xlsx' | 'image';

export interface Material {
  id: string;
  name: string;
  type: MaterialType;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  url: string;
  version: number;
  parentId: string;
  isLatest: boolean;
  versionNote?: string;
  visibility: 'public' | 'host-only';
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  createdAt: Date;
  completedAt?: Date;
}

export type MeetingStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export type MeetingPriority = 'high' | 'medium' | 'low';

export interface Meeting {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  expectedAttendees: number;
  priority: MeetingPriority;
  roomId: string;
  room: MeetingRoom;
  deviceIds: string[];
  devices: Device[];
  cateringIds: string[];
  catering: CateringOption[];
  attendees: Attendee[];
  agenda: AgendaItem[];
  materials: Material[];
  decisions: string[];
  status: MeetingStatus;
  createdAt: Date;
  createdBy: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
  preMeetingChecklist?: PreMeetingChecklistItem[];
  actionItems?: ActionItem[];
  actualAttendees?: string[];
}

export type ConflictReason =
  | 'time-overlap'
  | 'device-incompatible'
  | 'device-faulty'
  | 'device-maintenance'
  | 'device-in-use'
  | 'room-unavailable';

export interface ResourceConflict {
  type: 'room' | 'device' | 'time';
  resourceId: string;
  resourceName: string;
  conflictingMeetingId?: string;
  conflictingMeetingTitle?: string;
  startTime: Date;
  endTime: Date;
  reason?: ConflictReason;
  description?: string;
}

export interface AlternativeSuggestion {
  id: string;
  originalStartTime: Date;
  suggestedStartTime: Date;
  suggestedEndTime: Date;
  suggestedRoomId?: string;
  suggestedRoomName?: string;
  suggestedDeviceIds?: string[];
  suggestedDevicesInfo?: Device[];
  adjustmentType: 'time' | 'room' | 'both';
  adjustmentReason: string;
  confidence: number;
  conflictsResolved: ResourceConflict[];
}

export type NotificationType = 'invitation' | 'reminder' | 'change' | 'decision';

export interface Notification {
  id: string;
  type: NotificationType;
  meetingId: string;
  meetingTitle: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
  read: boolean;
  actionRequired: boolean;
}

export type ReportType = 'utilization' | 'attendance' | 'devices' | 'operations' | 'cost' | 'comprehensive';

export type ReportFormat = 'pdf' | 'xlsx' | 'excel' | 'csv';

export interface ReportOptions {
  includeSummary: boolean;
  includeDetail: boolean;
  includeCharts: boolean;
  includeRoomStats: boolean;
  includeDeviceStats: boolean;
}

export interface DecisionRecord {
  id: string;
  title: string;
  content: string;
  ownerName: string;
  dueDate: Date;
  status: 'completed' | 'in_progress' | 'pending' | 'overdue';
}

export interface MeetingReportData {
  id: string;
  title: string;
  format: ReportFormat;
  type: ReportType;
  generatedAt: Date;
  dateRange: { start: string; end: string };
  totalMeetings: number;
  totalHours: number;
  avgAttendance: number;
  avgUtilization: number;
  topRooms: { name: string; count: number }[];
  decisions?: DecisionRecord[];
}

export interface MeetingReport {
  meetingId: string;
  meetingTitle: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  attendanceRate: number;
  plannedDuration: number;
  actualDuration: number;
  resourceUsageEfficiency: number;
  keyDecisions: string[];
  roomUtilization: number;
  devicesUsed: string[];
  cateringItems: string[];
  cateringCost: number;
}

export interface MonthlyStatistics {
  month: string;
  totalMeetings: number;
  totalMeetingHours: number;
  averageAttendanceRate: number;
  roomUtilizationRates: { roomId: string; roomName: string; rate: number }[];
  deviceFaultRates: { deviceId: string; deviceName: string; rate: number; faultCount: number }[];
  topUsedRooms: { roomId: string; roomName: string; count: number }[];
  peakHours: { hour: number; count: number }[];
  cateringExpense: number;
}

export interface CreateMeetingData {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  expectedAttendees: number;
  priority: MeetingPriority;
  roomId: string;
  deviceIds: string[];
  cateringIds: string[];
  attendeeUserIds: string[];
  agenda?: Omit<AgendaItem, 'id'>[];
}

export type ResourceChangeType = 'room' | 'device' | 'catering' | 'time' | 'attendee';

export interface ResourceChange {
  id: string;
  type: ResourceChangeType;
  field: string;
  resourceId?: string;
  resourceName?: string;
  oldValue: string | Date | string[];
  newValue: string | Date | string[];
  changedAt: Date;
  changedBy: string;
  description: string;
}

export interface PreMeetingChecklistItem {
  id: string;
  category: 'agenda' | 'material' | 'attendance' | 'catering' | 'device';
  title: string;
  description: string;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
  autoDetect: boolean;
}

export type ScheduleResult = {
  success: boolean;
  meeting?: Meeting;
  conflicts: ResourceConflict[];
  suggestions: AlternativeSuggestion[];
  warnings?: string[];
  message?: string;
};
