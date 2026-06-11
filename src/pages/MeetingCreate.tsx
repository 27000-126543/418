import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StepWizard from '@/components/common/StepWizard';
import RoomGrid from '@/components/meeting/RoomGrid';
import RoomCalendar from '@/components/meeting/RoomCalendar';
import DeviceSelector from '@/components/meeting/DeviceSelector';
import CateringPicker from '@/components/meeting/CateringPicker';
import ConflictAlert from '@/components/meeting/ConflictAlert';
import SuggestionList from '@/components/meeting/SuggestionList';
import StatusBadge from '@/components/common/StatusBadge';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useResourceStore } from '@/store/useResourceStore';
import { useUserStore } from '@/store/useUserStore';
import {
  CheckCircle2,
  CalendarDays,
  Clock,
  Users,
  FileText,
  MapPin,
  Monitor,
  Coffee,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Building2,
  Sparkles,
  Calendar,
  LayoutGrid,
} from 'lucide-react';
import type {
  CreateMeetingData,
  MeetingPriority,
  ResourceConflict,
  AlternativeSuggestion,
  User,
  AttendanceStatus,
  DeviceType,
} from '@/types';
import { detectAllConflicts } from '@/services/conflictDetection';
import { generateAlternatives } from '@/services/recommendationEngine';

const STEPS = [
  { title: '基础信息', description: '会议主题、时间、人员' },
  { title: '资源配置', description: '会议室、设备、餐饮' },
  { title: '冲突检测', description: '智能检测与推荐' },
  { title: '确认预订', description: '信息确认并提交' },
];

interface FormData {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  expectedAttendees: number;
  priority: MeetingPriority;
  attendeeIds: string[];
  roomId: string;
  deviceIds: string[];
  cateringQuantities: Record<string, number>;
}

export default function MeetingCreate() {
  const navigate = useNavigate();
  const { createMeeting, meetings } = useMeetingStore();
  const { rooms, devices, cateringOptions, getAvailableRooms, getAvailableDevices } =
    useResourceStore();
  const { currentUser, users } = useUserStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '10:00',
    expectedAttendees: 4,
    priority: 'medium',
    attendeeIds: currentUser ? [currentUser.id] : [],
    roomId: '',
    deviceIds: [],
    cateringQuantities: {},
  });
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [conflicts, setConflicts] = useState<ResourceConflict[]>([]);
  const [suggestions, setSuggestions] = useState<AlternativeSuggestion[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');

  const selectedDate = new Date(formData.date);
  const startDateTime = new Date(
    `${formData.date}T${formData.startTime}:00`
  );
  const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`);

  const availableRooms = getAvailableRooms(
    startDateTime,
    endDateTime,
    formData.expectedAttendees
  );
  const _availableDevices = formData.roomId
    ? getAvailableDevices(formData.roomId, startDateTime, endDateTime)
    : devices.filter(d => d.status !== 'faulty' && d.status !== 'maintenance' && d.status !== 'in-use');

  const filteredUsers = users.filter(
    u =>
      (u.name.includes(attendeeSearch) ||
        u.department.includes(attendeeSearch) ||
        u.email.includes(attendeeSearch)) &&
      !formData.attendeeIds.includes(u.id)
  );

  const selectedAttendees = formData.attendeeIds
    .map(id => users.find(u => u.id === id))
    .filter(Boolean) as User[];

  const totalCateringCost = Object.entries(formData.cateringQuantities).reduce((sum, [id, qty]) => {
    const c = cateringOptions.find(c => c.id === id);
    return sum + (c ? c.pricePerPerson * qty * formData.expectedAttendees : 0);
  }, 0);

  const selectedRoom = rooms.find(r => r.id === formData.roomId);
  const attendeeUserIds = formData.attendeeIds;

  useEffect(() => {
    if (currentStep === 2 && formData.roomId) {
      const detectedConflicts = detectAllConflicts(
        {
          id: undefined,
          startTime: startDateTime,
          endTime: endDateTime,
          roomId: formData.roomId,
          deviceIds: formData.deviceIds,
          attendeeIds: attendeeUserIds,
        },
        meetings,
        devices
      );
      setConflicts(detectedConflicts);

      if (detectedConflicts.length > 0) {
        const suggested = generateAlternatives(
          detectedConflicts,
          {
            id: undefined,
            title: formData.title || '未命名会议',
            startTime: startDateTime,
            endTime: endDateTime,
            roomId: formData.roomId,
            room: selectedRoom,
            deviceIds: formData.deviceIds,
            attendees: formData.attendeeIds.map(uid => {
              const u = users.find(x => x.id === uid);
              return {
                userId: uid,
                user: u!,
                status: 'pending' as AttendanceStatus,
                isHost: uid === currentUser?.id,
              };
            }),
            priority: formData.priority,
          },
          meetings,
          rooms,
          devices
        );
        setSuggestions(suggested);
      } else {
        setSuggestions([]);
      }
    }
  }, [currentStep, formData.roomId, formData.deviceIds, formData.date, formData.startTime, formData.endTime, startDateTime, endDateTime, meetings, rooms, formData.expectedAttendees, formData.title, formData.attendeeIds, attendeeUserIds, users, currentUser?.id, devices]);

  const toggleAttendee = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      attendeeIds: prev.attendeeIds.includes(userId)
        ? prev.attendeeIds.filter(id => id !== userId)
        : [...prev.attendeeIds, userId],
    }));
  };

  const handleCateringChange = (quantities: Record<string, number>) => {
    setFormData(prev => ({
      ...prev,
      cateringQuantities: quantities,
    }));
  };

  const handleDeviceChange = (ids: string[]) => {
    setFormData(prev => ({
      ...prev,
      deviceIds: ids,
    }));
  };

  const facilityToDeviceTypeMap: Record<string, DeviceType> = {
    '投影仪': 'projector',
    '白板': 'whiteboard',
    '交互式白板': 'whiteboard',
    '电子白板': 'whiteboard',
    '视频会议系统': 'video-conferencing',
    '视频会议': 'video-conferencing',
    '扬声器': 'speaker',
    '专业音响': 'speaker',
    '音响系统': 'speaker',
    '麦克风': 'microphone',
    '无线麦克风': 'microphone',
    '麦克风阵列': 'microphone',
  };

  const getAutoSelectedDevices = (roomId: string): string[] => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return [];
    const availableRoomDevices = _availableDevices.filter(d =>
      d.compatibleRooms.includes(roomId)
    );
    const matchedTypeDeviceIds: string[] = [];
    const matchedTypes = new Set<DeviceType>();
    for (const facility of room.facilities) {
      const deviceType = facilityToDeviceTypeMap[facility];
      if (deviceType && !matchedTypes.has(deviceType)) {
        const matchingDevice = availableRoomDevices.find(d => d.type === deviceType);
        if (matchingDevice) {
          matchedTypeDeviceIds.push(matchingDevice.id);
          matchedTypes.add(deviceType);
        }
      }
    }
    return matchedTypeDeviceIds;
  };

  const handleSelectRoom = (roomId: string) => {
    const autoSelectedIds = getAutoSelectedDevices(roomId);
    setFormData(prev => ({
      ...prev,
      roomId,
      deviceIds: autoSelectedIds,
    }));
  };

  const handleTimeSelect = (data: { roomId: string; startTime: Date; endTime: Date }) => {
    const autoSelectedIds = getAutoSelectedDevices(data.roomId);
    setFormData(prev => ({
      ...prev,
      roomId: data.roomId,
      date: data.startTime.toISOString().slice(0, 10),
      startTime: data.startTime.toTimeString().slice(0, 5),
      endTime: data.endTime.toTimeString().slice(0, 5),
      deviceIds: autoSelectedIds,
    }));
  };

  const handleSuggestion = (s: AlternativeSuggestion) => {
    setFormData(prev => {
      const newRoomId = s.suggestedRoomId ?? prev.roomId;
      const newStart = new Date(s.suggestedStartTime);
      const newEnd = new Date(s.suggestedEndTime);
      let newDeviceIds: string[];

      if (s.suggestedDeviceIds !== undefined) {
        newDeviceIds = s.suggestedDeviceIds;
      } else {
        const availableDevices = getAvailableDevices(newRoomId, newStart, newEnd);
        const availableDeviceIds = new Set(availableDevices.map(d => d.id));
        newDeviceIds = prev.deviceIds.filter(id => availableDeviceIds.has(id));
      }

      return {
        ...prev,
        date: newStart.toISOString().slice(0, 10),
        startTime: newStart.toTimeString().slice(0, 5),
        endTime: newEnd.toTimeString().slice(0, 5),
        roomId: newRoomId,
        deviceIds: newDeviceIds,
      };
    });
  };

  const canProceed = (step: number) => {
    switch (step) {
      case 0:
        return (
          formData.title.trim() &&
          formData.date &&
          formData.startTime &&
          formData.endTime &&
          formData.attendeeIds.length > 0
        );
      case 1:
        return formData.roomId;
      case 2:
        return conflicts.length === 0;
      default:
        return true;
    }
  };

  const handleSubmit = () => {
    if (!currentUser) return;
    const cateringIds: string[] = [];
    Object.entries(formData.cateringQuantities).forEach(([id, qty]) => {
      for (let i = 0; i < qty; i++) cateringIds.push(id);
    });
    const createData: CreateMeetingData = {
      title: formData.title,
      description: formData.description,
      startTime: startDateTime,
      endTime: endDateTime,
      expectedAttendees: formData.expectedAttendees,
      priority: formData.priority,
      roomId: formData.roomId,
      deviceIds: formData.deviceIds,
      cateringIds,
      attendeeUserIds: formData.attendeeIds,
    };
    const meeting = createMeeting(createData, currentUser.id);
    setShowSuccess(true);
    setTimeout(() => {
      navigate(`/meetings/${meeting.id}`);
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {showSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-success-500 to-accent-500 text-white shadow-xl shadow-success-500/30">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold">会议创建成功</div>
              <div className="text-xs text-white/80">正在跳转到会议详情页...</div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-neutral-800 mb-1">发起新会议</h1>
        <p className="text-sm text-neutral-500">
          按照向导步骤填写信息，系统将自动检测冲突并提供智能推荐
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
        <StepWizard
          steps={STEPS}
          currentStep={currentStep}
        />
      </div>

      <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card min-h-[500px]">
        {currentStep === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-neutral-700 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary-500" />
                  会议主题 *
                </label>
                <input
                  className="input-base"
                  placeholder="输入会议主题，如：2026年Q3战略规划会议"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 mb-2 flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-primary-500" />
                    会议日期 *
                  </label>
                  <input
                    type="date"
                    className="input-base"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700 mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary-500" />
                    预计人数
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input-base"
                    value={formData.expectedAttendees}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        expectedAttendees: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary-500" />
                    开始时间 *
                  </label>
                  <input
                    type="time"
                    className="input-base"
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700 mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-accent-500" />
                    结束时间 *
                  </label>
                  <input
                    type="time"
                    className="input-base"
                    value={formData.endTime}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 mb-2 block">
                  优先级
                </label>
                <div className="flex gap-2">
                  {(['high', 'medium', 'low'] as MeetingPriority[]).map(p => {
                    const labels = { high: '高', medium: '中', low: '低' };
                    const colors = {
                      high: 'bg-danger-50 text-danger-500 border-danger-200',
                      medium: 'bg-warning-50 text-warning-600 border-warning-200',
                      low: 'bg-success-50 text-success-600 border-success-200',
                    };
                    const activeColors = {
                      high: 'bg-gradient-danger text-white border-transparent shadow-md shadow-danger-500/30',
                      medium: 'bg-gradient-to-br from-warning-500 to-warning-600 text-white border-transparent shadow-md shadow-warning-500/30',
                      low: 'bg-gradient-to-br from-success-500 to-success-600 text-white border-transparent shadow-md shadow-success-500/30',
                    };
                    return (
                      <button
                        key={p}
                        onClick={() => setFormData({ ...formData, priority: p })}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                          formData.priority === p ? activeColors[p] : colors[p]
                        }`}
                      >
                        {labels[p]}优先级
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary-500" />
                  会议描述
                </label>
                <textarea
                  className="input-base min-h-[100px] resize-none"
                  placeholder="描述会议目标、背景信息等..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-neutral-700 mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary-500" />
                  参会人员 * （已选 {formData.attendeeIds.length} 人）
                </label>

                {selectedAttendees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 p-3 rounded-xl bg-primary-50/50 border border-primary-100">
                    {selectedAttendees.map(u => (
                      <div
                        key={u.id}
                        className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white border border-primary-100 shadow-sm"
                      >
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="text-xs font-medium text-neutral-700">{u.name}</span>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => toggleAttendee(u.id)}
                            className="text-neutral-400 hover:text-danger-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative mb-3">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    className="input-base pl-9"
                    placeholder="搜索姓名、部门、邮箱..."
                    value={attendeeSearch}
                    onChange={e => setAttendeeSearch(e.target.value)}
                  />
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1.5 border border-neutral-100 rounded-xl p-2 bg-neutral-50/50">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-xs text-neutral-400">
                      未找到匹配的人员
                    </div>
                  ) : (
                    filteredUsers.map(u => (
                      <button
                        key={u.id}
                        onClick={() => toggleAttendee(u.id)}
                        className="w-full p-2.5 rounded-lg flex items-center gap-3 hover:bg-white transition-colors text-left group"
                      >
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-9 h-9 rounded-xl object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-neutral-800 group-hover:text-primary-600 truncate">
                            {u.name}
                          </div>
                          <div className="text-[10px] text-neutral-400 truncate">
                            {u.department} · {u.email}
                          </div>
                        </div>
                        <div className="w-5 h-5 rounded-md border-2 border-neutral-200 group-hover:border-primary-400 flex items-center justify-center transition-colors">
                          <span className="w-2.5 h-2.5 rounded-sm bg-primary-500 scale-0 group-hover:scale-100 transition-transform" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6 animate-slide-up">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary-500" />
                  选择会议室 *
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-500">
                    可用 {availableRooms.length} / 共 {rooms.length} 间
                  </span>
                  <div className="flex p-0.5 bg-neutral-100 rounded-lg">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        viewMode === 'grid'
                          ? 'bg-white text-primary-600 shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      网格视图
                    </button>
                    <button
                      onClick={() => setViewMode('calendar')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        viewMode === 'calendar'
                          ? 'bg-white text-primary-600 shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      日历视图
                    </button>
                  </div>
                </div>
              </div>
              {viewMode === 'grid' ? (
                <RoomGrid
                  rooms={rooms}
                  selectedRoomId={formData.roomId}
                  onSelectRoom={handleSelectRoom}
                />
              ) : (
                <RoomCalendar
                  expectedAttendees={formData.expectedAttendees}
                  selectedRoomId={formData.roomId}
                  selectedStartTime={startDateTime}
                  selectedEndTime={endDateTime}
                  onTimeSelect={handleTimeSelect}
                  onRoomSelect={handleSelectRoom}
                />
              )}
            </div>

            {formData.roomId && (
              <div className="space-y-6 pt-4 border-t border-neutral-100">
                <div className="flex tab">
                  <div className="flex gap-2 p-1 bg-neutral-100 rounded-xl">
                    <div className="px-4 py-2 rounded-lg bg-white text-xs font-semibold text-primary-600 shadow-sm flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5" />
                      设备配置
                    </div>
                    <div className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-500 flex items-center gap-1.5 hover:text-neutral-700 transition-colors">
                      <Coffee className="w-3.5 h-3.5" />
                      餐饮服务
                    </div>
                  </div>
                </div>

                <DeviceSelector
                  roomId={formData.roomId}
                  selectedIds={formData.deviceIds}
                  onChange={handleDeviceChange}
                  startTime={startDateTime}
                  endTime={endDateTime}
                />

                <div className="pt-4 border-t border-neutral-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-warning-500" />
                      餐饮服务
                    </h3>
                    <span className="text-xs font-semibold text-warning-600">
                      预计费用 ¥{totalCateringCost.toFixed(0)}
                    </span>
                  </div>
                  <CateringPicker
                    selectedQuantities={formData.cateringQuantities}
                    onChange={handleCateringChange}
                    expectedAttendees={formData.expectedAttendees}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-slide-up">
            <ConflictAlert conflicts={conflicts} />

            {conflicts.length === 0 ? (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-success-50 to-accent-50 border-2 border-success-200 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-success-500 to-accent-500 flex items-center justify-center shadow-xl shadow-success-500/30 mb-4 animate-pulse-once">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-success-700 mb-1">
                  太棒了！所有资源检测通过
                </h3>
                <p className="text-sm text-success-600/80 mb-3">
                  您选择的会议室、设备在指定时间段内均可用
                </p>
                <div className="flex items-center gap-4 text-xs text-success-600/70">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {selectedRoom?.name ?? '未选择'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Monitor className="w-3 h-3" /> {formData.deviceIds.length} 台设备
                  </span>
                  <span className="flex items-center gap-1">
                    <Coffee className="w-3 h-3" /> {Object.keys(formData.cateringQuantities).length} 项餐饮
                  </span>
                </div>
              </div>
            ) : (
              <SuggestionList
                suggestions={suggestions}
                originalStartTime={startDateTime}
                originalEndTime={endDateTime}
                originalRoomName={selectedRoom?.name}
                originalDeviceCount={formData.deviceIds.length}
                onApply={handleSuggestion}
              />
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="max-w-3xl mx-auto animate-slide-up">
            <div className="rounded-2xl border border-neutral-100 overflow-hidden shadow-card">
              <div className="p-6 bg-gradient-primary text-white">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="badge bg-white/20 text-white/90">会议信息确认</span>
                </div>
                <h2 className="text-xl font-bold mb-1">{formData.title}</h2>
                <p className="text-white/80 text-sm">
                  {selectedDate.toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long',
                  })}{' '}
                  {formData.startTime} - {formData.endTime}
                </p>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-neutral-50">
                    <div className="text-[10px] text-neutral-500 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> 会议室
                    </div>
                    <div className="text-sm font-semibold text-neutral-800">
                      {selectedRoom?.name ?? '未选择'}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {selectedRoom?.location} · {selectedRoom?.capacity}人
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-neutral-50">
                    <div className="text-[10px] text-neutral-500 mb-1">优先级</div>
                    <StatusBadge status={formData.priority} type="priority" />
                    <div className="text-[10px] text-neutral-400 mt-1">
                      预计 {formData.expectedAttendees} 人参会
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50">
                  <div className="text-[10px] text-neutral-500 mb-2 flex items-center gap-1">
                    <Users className="w-3 h-3" /> 参会人员（{formData.attendeeIds.length} 人）
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedAttendees.slice(0, 8).map(u => (
                      <div
                        key={u.id}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-neutral-100"
                      >
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="text-[10px] font-medium text-neutral-700">
                          {u.name}
                        </span>
                      </div>
                    ))}
                    {selectedAttendees.length > 8 && (
                      <div className="px-2 py-1 rounded-lg bg-primary-50 text-[10px] font-semibold text-primary-600">
                        +{selectedAttendees.length - 8}
                      </div>
                    )}
                  </div>
                </div>

                {formData.deviceIds.length > 0 && (
                  <div className="p-4 rounded-xl bg-neutral-50">
                    <div className="text-[10px] text-neutral-500 mb-2 flex items-center gap-1">
                      <Monitor className="w-3 h-3" /> 设备配置（
                      {formData.deviceIds.length} 台）
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {devices
                        .filter(d => formData.deviceIds.includes(d.id))
                        .map(d => (
                          <span
                            key={d.id}
                            className="px-2.5 py-1 rounded-lg bg-primary-50 text-[10px] font-medium text-primary-600"
                          >
                            {d.name}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-gradient-to-r from-warning-50 to-warning-50/50 border border-warning-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-warning-600 mb-1">预计总费用</div>
                    <div className="text-2xl font-bold text-warning-700">
                      ¥{totalCateringCost.toFixed(0)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-warning-600/80 mb-1">餐饮服务</div>
                    <div className="text-xs text-warning-700 font-medium">
                      {Object.keys(formData.cateringQuantities).length} 项 · {formData.expectedAttendees} 人
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-neutral-100 shadow-card sticky bottom-0 z-10">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          上一步
        </button>

        <div className="flex items-center gap-1">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentStep
                  ? 'w-6 bg-gradient-primary'
                  : idx < currentStep
                  ? 'bg-accent-500'
                  : 'bg-neutral-200'
              }`}
            />
          ))}
        </div>

        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={() => setCurrentStep(Math.min(STEPS.length - 1, currentStep + 1))}
            disabled={!canProceed(currentStep)}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            下一步
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} className="btn-accent">
            <CheckCircle2 className="w-4 h-4" />
            确认预订
          </button>
        )}
      </div>
    </div>
  );
}
