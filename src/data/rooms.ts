import type { MeetingRoom } from '@/types';

export const mockRooms: MeetingRoom[] = [
  {
    id: 'room-001',
    name: '星辰会议室',
    capacity: 8,
    location: 'A栋东侧',
    floor: 3,
    facilities: ['投影仪', '白板', '视频会议系统', '无线投屏'],
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    status: 'available',
  },
  {
    id: 'room-002',
    name: '阳光厅',
    capacity: 16,
    location: 'A栋西侧',
    floor: 5,
    facilities: ['投影仪', '白板', '视频会议系统', '扬声器', '麦克风阵列', '无线投屏'],
    image: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800',
    status: 'available',
  },
  {
    id: 'room-003',
    name: '智库会议室',
    capacity: 4,
    location: 'B栋南侧',
    floor: 2,
    facilities: ['电视屏幕', '白板', '无线投屏'],
    image: 'https://images.unsplash.com/photo-1462826303086-329426d1aef5?w=800',
    status: 'available',
  },
  {
    id: 'room-004',
    name: '多功能厅',
    capacity: 30,
    location: 'C栋一层',
    floor: 1,
    facilities: ['投影仪', 'LED大屏', '视频会议系统', '专业音响', '无线麦克风', '同声传译', '录制设备'],
    image: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800',
    status: 'occupied',
  },
  {
    id: 'room-005',
    name: '紫荆会议室',
    capacity: 12,
    location: 'B栋北侧',
    floor: 4,
    facilities: ['投影仪', '白板', '视频会议系统', '扬声器', '无线投屏'],
    image: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?w=800',
    status: 'available',
  },
  {
    id: 'room-006',
    name: '创新实验室',
    capacity: 20,
    location: 'D栋三层',
    floor: 3,
    facilities: ['投影仪', '交互式白板', '视频会议系统', '专业音响', '无线麦克风', '创客工具套装'],
    image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800',
    status: 'maintenance',
  },
];

export const rooms = mockRooms;
export const defaultRooms = mockRooms;

export const getRoomById = (id: string): MeetingRoom | undefined => {
  return mockRooms.find((r) => r.id === id);
};

export const getAvailableRooms = (): MeetingRoom[] => {
  return mockRooms.filter((r) => r.status === 'available');
};

export const getRoomsByCapacity = (minCapacity: number): MeetingRoom[] => {
  return mockRooms.filter((r) => r.capacity >= minCapacity);
};

export const getRoomsByFloor = (floor: number): MeetingRoom[] => {
  return mockRooms.filter((r) => r.floor === floor);
};
