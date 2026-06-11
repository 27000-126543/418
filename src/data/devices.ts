import type { Device } from '@/types';

export const mockDevices: Device[] = [
  {
    id: 'device-001',
    name: '爱普生激光投影仪',
    type: 'projector',
    model: 'Epson CB-L200X',
    compatibleRooms: ['room-001', 'room-002', 'room-004', 'room-005', 'room-006'],
    roomId: 'room-001',
    status: 'available',
    faultRate: 0.03,
    faultCount: 2,
    useCount: 156,
    lastMaintenanceAt: new Date('2026-03-15'),
  },
  {
    id: 'device-002',
    name: '明基商务投影仪',
    type: 'projector',
    model: 'BenQ MH560',
    compatibleRooms: ['room-003', 'room-005'],
    roomId: 'room-003',
    status: 'available',
    faultRate: 0.05,
    faultCount: 4,
    useCount: 98,
    lastMaintenanceAt: new Date('2026-02-28'),
  },
  {
    id: 'device-003',
    name: '希沃交互式白板',
    type: 'whiteboard',
    model: 'Seewo MC75FEA',
    compatibleRooms: ['room-001', 'room-002', 'room-003', 'room-005', 'room-006'],
    roomId: 'room-002',
    status: 'available',
    faultRate: 0.02,
    faultCount: 1,
    useCount: 203,
    lastMaintenanceAt: new Date('2026-04-01'),
  },
  {
    id: 'device-004',
    name: '松下电子白板',
    type: 'whiteboard',
    model: 'Panasonic UB-T880',
    compatibleRooms: ['room-002', 'room-004'],
    roomId: 'room-004',
    status: 'available',
    faultRate: 0.04,
    faultCount: 3,
    useCount: 87,
    lastMaintenanceAt: new Date('2026-03-20'),
  },
  {
    id: 'device-005',
    name: '思科视频会议终端',
    type: 'video-conferencing',
    model: 'Cisco Webex Room Kit Plus',
    compatibleRooms: ['room-001', 'room-002', 'room-004', 'room-005', 'room-006'],
    roomId: 'room-005',
    status: 'available',
    faultRate: 0.06,
    faultCount: 5,
    useCount: 142,
    lastMaintenanceAt: new Date('2026-03-10'),
  },
  {
    id: 'device-006',
    name: '宝利通视频会议系统',
    type: 'video-conferencing',
    model: 'Poly Studio X50',
    compatibleRooms: ['room-002', 'room-004', 'room-005'],
    roomId: 'room-002',
    status: 'faulty',
    faultRate: 0.12,
    faultCount: 12,
    useCount: 76,
    lastMaintenanceAt: new Date('2026-01-15'),
  },
  {
    id: 'device-007',
    name: 'JBL专业扬声器',
    type: 'speaker',
    model: 'JBL Control 25AV',
    compatibleRooms: ['room-002', 'room-004', 'room-005', 'room-006'],
    roomId: 'room-006',
    status: 'available',
    faultRate: 0.02,
    faultCount: 1,
    useCount: 168,
    lastMaintenanceAt: new Date('2026-04-05'),
  },
  {
    id: 'device-008',
    name: 'BOSE会议音响系统',
    type: 'speaker',
    model: 'Bose Videobar VB1',
    compatibleRooms: ['room-001', 'room-003', 'room-005'],
    roomId: 'room-001',
    status: 'available',
    faultRate: 0.03,
    faultCount: 2,
    useCount: 124,
    lastMaintenanceAt: new Date('2026-03-28'),
  },
  {
    id: 'device-009',
    name: '舒尔无线麦克风',
    type: 'microphone',
    model: 'Shure BLX24/SM58',
    compatibleRooms: ['room-002', 'room-004', 'room-006'],
    roomId: 'room-006',
    status: 'available',
    faultRate: 0.05,
    faultCount: 4,
    useCount: 109,
    lastMaintenanceAt: new Date('2026-03-05'),
  },
  {
    id: 'device-010',
    name: '铁三角阵列麦克风',
    type: 'microphone',
    model: 'Audio-Technica ATND971',
    compatibleRooms: ['room-001', 'room-002', 'room-005', 'room-006'],
    roomId: 'room-005',
    status: 'in-use',
    faultRate: 0.04,
    faultCount: 3,
    useCount: 187,
    lastMaintenanceAt: new Date('2026-04-02'),
  },
];

export const devices = mockDevices;
export const defaultDevices = mockDevices;

export const getDeviceById = (id: string): Device | undefined => {
  return mockDevices.find((d) => d.id === id);
};

export const getDevicesByType = (type: Device['type']): Device[] => {
  return mockDevices.filter((d) => d.type === type);
};

export const getAvailableDevices = (): Device[] => {
  return mockDevices.filter((d) => d.status === 'available');
};

export const getDevicesByRoom = (roomId: string): Device[] => {
  return mockDevices.filter((d) => d.compatibleRooms.includes(roomId));
};

export const getDevicesByIds = (ids: string[]): Device[] => {
  return mockDevices.filter((d) => ids.includes(d.id));
};
