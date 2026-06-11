import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Building2,
  Clock,
  Info,
  MapPin,
  User,
} from 'lucide-react';
import { useResourceStore } from '@/store/useResourceStore';
import { useMeetingStore } from '@/store/useMeetingStore';
import type { Meeting, MeetingRoom } from '@/types';
import { cn } from '@/lib/utils';
import { formatTime, isSameDay, isTimeOverlap, addMinutes } from '@/utils/dateUtils';

const START_HOUR = 8;
const END_HOUR = 20;
const TIME_SLOT_MINUTES = 30;
const TOTAL_SLOTS = ((END_HOUR - START_HOUR) * 60) / TIME_SLOT_MINUTES;

interface TimeSlot {
  index: number;
  time: string;
  minutes: number;
}

interface RoomCalendarProps {
  expectedAttendees?: number;
  selectedRoomId?: string;
  selectedStartTime?: Date;
  selectedEndTime?: Date;
  onTimeSelect?: (data: { roomId: string; startTime: Date; endTime: Date }) => void;
  onRoomSelect?: (roomId: string) => void;
  className?: string;
}

interface HoveredMeeting {
  meeting: Meeting;
  position: { x: number; y: number };
}

export default function RoomCalendar({
  expectedAttendees,
  selectedRoomId,
  selectedStartTime,
  selectedEndTime,
  onTimeSelect,
  onRoomSelect,
  className,
}: RoomCalendarProps) {
  const { rooms } = useResourceStore();
  const { meetings } = useMeetingStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredMeeting, setHoveredMeeting] = useState<HoveredMeeting | null>(null);

  const timeSlots = useMemo<TimeSlot[]>(() => {
    const slots: TimeSlot[] = [];
    for (let i = 0; i < TOTAL_SLOTS; i++) {
      const totalMinutes = START_HOUR * 60 + i * TIME_SLOT_MINUTES;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      slots.push({
        index: i,
        time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
        minutes: totalMinutes,
      });
    }
    return slots;
  }, []);

  const dayStart = useMemo(() => {
    const d = new Date(currentDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  const dayEnd = useMemo(() => {
    const d = new Date(currentDate);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [currentDate]);

  const dayMeetings = useMemo(() => {
    return meetings.filter(
      (m) =>
        m.status !== 'cancelled' &&
        isTimeOverlap(m.startTime, m.endTime, dayStart, dayEnd)
    );
  }, [meetings, dayStart, dayEnd]);

  const navigateDate = (days: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      return next;
    });
  };

  const getSlotDate = (slotIndex: number): Date => {
    const d = new Date(currentDate);
    const totalMinutes = START_HOUR * 60 + slotIndex * TIME_SLOT_MINUTES;
    d.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
    return d;
  };

  const getMeetingPosition = (meeting: Meeting): { left: number; width: number } => {
    const startMinutes = meeting.startTime.getHours() * 60 + meeting.startTime.getMinutes();
    const endMinutes = meeting.endTime.getHours() * 60 + meeting.endTime.getMinutes();
    const dayStartMinutes = START_HOUR * 60;
    const dayEndMinutes = END_HOUR * 60;

    const clampedStart = Math.max(startMinutes, dayStartMinutes);
    const clampedEnd = Math.min(endMinutes, dayEndMinutes);

    const left = ((clampedStart - dayStartMinutes) / (dayEndMinutes - dayStartMinutes)) * 100;
    const width = ((clampedEnd - clampedStart) / (dayEndMinutes - dayStartMinutes)) * 100;

    return { left: Math.max(0, left), width: Math.max(0, width) };
  };

  const getRoomMeetings = (roomId: string): Meeting[] => {
    return dayMeetings.filter((m) => m.roomId === roomId);
  };

  const isSlotInSelectedRange = (roomId: string, slotIndex: number): boolean => {
    if (!selectedStartTime || !selectedEndTime || selectedRoomId !== roomId) return false;
    const slotStart = getSlotDate(slotIndex);
    const slotEnd = addMinutes(slotStart, TIME_SLOT_MINUTES);
    return isTimeOverlap(slotStart, slotEnd, selectedStartTime, selectedEndTime);
  };

  const isRoomCapacityInsufficient = (room: MeetingRoom): boolean => {
    return expectedAttendees !== undefined && room.capacity < expectedAttendees;
  };

  const handleSlotClick = (room: MeetingRoom, slotIndex: number) => {
    if (room.status === 'maintenance') return;
    if (isRoomCapacityInsufficient(room)) return;

    const slotStart = getSlotDate(slotIndex);
    const slotEnd = addMinutes(slotStart, TIME_SLOT_MINUTES);

    const roomMeetings = getRoomMeetings(room.id);
    const hasConflict = roomMeetings.some((m) =>
      isTimeOverlap(m.startTime, m.endTime, slotStart, slotEnd)
    );
    if (hasConflict) return;

    onTimeSelect?.({
      roomId: room.id,
      startTime: slotStart,
      endTime: slotEnd,
    });

    onRoomSelect?.(room.id);
  };

  const handleMeetingHover = (
    e: React.MouseEvent,
    meeting: Meeting | null
  ) => {
    if (meeting) {
      setHoveredMeeting({
        meeting,
        position: { x: e.clientX, y: e.clientY },
      });
    } else {
      setHoveredMeeting(null);
    }
  };

  const formatDateHeader = (): string => {
    return currentDate.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const isToday = isSameDay(currentDate, new Date());

  return (
    <div className={cn('rounded-2xl bg-white border border-neutral-100 shadow-card overflow-hidden', className)}>
      <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-gradient-to-r from-primary-50/50 to-accent-50/50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateDate(-1)}
            className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center hover:border-primary-300 hover:text-primary-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateDate(1)}
            className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center hover:border-primary-300 hover:text-primary-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-bold text-neutral-800">
            {formatDateHeader()}
          </h3>
          {isToday && (
            <span className="px-2 py-0.5 rounded-full bg-gradient-accent text-white text-[10px] font-bold">
              今天
            </span>
          )}
        </div>
        {expectedAttendees !== undefined && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Users className="w-3.5 h-3.5 text-primary-400" />
            <span>预计人数：</span>
            <span className="font-semibold text-neutral-700">{expectedAttendees} 人</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="flex border-b border-neutral-100">
            <div className="w-56 shrink-0 p-3 border-r border-neutral-100 bg-neutral-50/80">
              <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                会议室
              </div>
            </div>
            <div className="flex-1 flex">
              {timeSlots
                .filter((_, i) => i % 2 === 0)
                .map((slot) => (
                  <div
                    key={slot.index}
                    className="flex-1 p-3 text-center border-r border-neutral-100 last:border-r-0 bg-neutral-50/50"
                  >
                    <div className="text-[10px] font-semibold text-neutral-500">
                      {slot.time}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="divide-y divide-neutral-100">
            {rooms.map((room) => {
              const isSelected = selectedRoomId === room.id;
              const isMaintenance = room.status === 'maintenance';
              const insufficientCapacity = isRoomCapacityInsufficient(room);
              const roomMeetings = getRoomMeetings(room.id);

              return (
                <div
                  key={room.id}
                  className={cn(
                    'flex group',
                    isSelected && 'bg-primary-50/30',
                    !isSelected && !isMaintenance && !insufficientCapacity && 'hover:bg-neutral-50/50',
                    insufficientCapacity && 'opacity-50'
                  )}
                >
                  <div
                    className={cn(
                      'w-56 shrink-0 p-3 border-r border-neutral-100 cursor-pointer transition-colors',
                      isSelected && 'bg-primary-50/60',
                      insufficientCapacity && 'cursor-not-allowed',
                      isMaintenance && 'bg-neutral-100/50 cursor-not-allowed'
                    )}
                    onClick={() => {
                      if (!isMaintenance && !insufficientCapacity) {
                        onRoomSelect?.(room.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                          isSelected
                            ? 'bg-gradient-primary'
                            : insufficientCapacity
                            ? 'bg-danger-100'
                            : 'bg-primary-100'
                        )}
                      >
                        <Building2
                          className={cn(
                            'w-4 h-4',
                            isSelected ? 'text-white' : insufficientCapacity ? 'text-danger-500' : 'text-primary-600'
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            'text-sm font-semibold truncate',
                            insufficientCapacity
                              ? 'text-danger-500'
                              : isSelected
                              ? 'text-primary-700'
                              : 'text-neutral-800'
                          )}
                        >
                          {room.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-500">
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {room.floor}F
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Users className="w-3 h-3" />
                            <span className={cn(insufficientCapacity && 'text-danger-500 font-semibold')}>
                              {room.capacity}人
                            </span>
                          </span>
                        </div>
                        {insufficientCapacity && (
                          <div className="text-[10px] text-danger-500 mt-1 flex items-center gap-0.5">
                            <Info className="w-3 h-3" />
                            容量不足
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 relative">
                    <div className="absolute inset-0 flex">
                      {timeSlots.map((slot) => (
                        <div
                          key={slot.index}
                          className={cn(
                            'flex-1 border-r border-neutral-100 last:border-r-0 transition-colors cursor-pointer',
                            isMaintenance && 'bg-neutral-100 cursor-not-allowed',
                            !isMaintenance &&
                              !insufficientCapacity &&
                              'hover:bg-accent-50/50',
                            isSlotInSelectedRange(room.id, slot.index) &&
                              'bg-accent-100/60 border-accent-200'
                          )}
                          onClick={() => handleSlotClick(room, slot.index)}
                        />
                      ))}
                    </div>

                    {isMaintenance && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(0,0,0,0.05) 6px, rgba(0,0,0,0.05) 12px)',
                        }}
                      />
                    )}

                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      {roomMeetings.map((meeting) => {
                        const pos = getMeetingPosition(meeting);
                        if (pos.width <= 0) return null;

                        return (
                          <div
                            key={meeting.id}
                            className="absolute top-1 bottom-1 rounded-lg bg-gradient-accent shadow-md overflow-hidden cursor-pointer pointer-events-auto group/meeting"
                            style={{
                              left: `${pos.left}%`,
                              width: `${pos.width}%`,
                            }}
                            onMouseEnter={(e) => handleMeetingHover(e, meeting)}
                            onMouseLeave={(e) => handleMeetingHover(e, null)}
                            onMouseMove={(e) => {
                              if (hoveredMeeting?.meeting.id === meeting.id) {
                                setHoveredMeeting({
                                  meeting,
                                  position: { x: e.clientX, y: e.clientY },
                                });
                              }
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover/meeting:opacity-100 transition-opacity" />
                            <div className="relative h-full px-2 py-1 flex items-center">
                              <span className="text-[10px] font-semibold text-white truncate">
                                {meeting.title}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-white border border-neutral-200" />
            <span className="text-[10px] text-neutral-500">空闲</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gradient-accent" />
            <span className="text-[10px] text-neutral-500">已占用</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm"
              style={{
                background:
                  'repeating-linear-gradient(45deg, #f5f5f5, #f5f5f5 2px, #e0e0e0 2px, #e0e0e0 4px)',
              }}
            />
            <span className="text-[10px] text-neutral-500">维护中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-accent-100 border border-accent-200" />
            <span className="text-[10px] text-neutral-500">已选择</span>
          </div>
        </div>
        <div className="text-[10px] text-neutral-400">
          点击空闲时段快速选择时间
        </div>
      </div>

      {hoveredMeeting && (
        <div
          className="fixed z-50 pointer-events-none animate-fade-in"
          style={{
            left: hoveredMeeting.position.x + 12,
            top: hoveredMeeting.position.y + 12,
          }}
        >
          <div className="w-64 rounded-xl bg-white shadow-card-hover border border-neutral-100 overflow-hidden">
            <div className="p-3 bg-gradient-accent text-white">
              <h4 className="text-sm font-bold truncate">{hoveredMeeting.meeting.title}</h4>
              <div className="text-[10px] text-white/80 mt-0.5">
                {hoveredMeeting.meeting.room?.name || '未知会议室'}
              </div>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-neutral-600">
                <Clock className="w-3.5 h-3.5 text-primary-400" />
                <span>
                  {formatTime(hoveredMeeting.meeting.startTime)} -{' '}
                  {formatTime(hoveredMeeting.meeting.endTime)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-600">
                <Users className="w-3.5 h-3.5 text-primary-400" />
                <span>{hoveredMeeting.meeting.attendees.length} 人参会</span>
              </div>
              {hoveredMeeting.meeting.attendees[0]?.user && (
                <div className="flex items-center gap-2 text-xs text-neutral-600">
                  <User className="w-3.5 h-3.5 text-primary-400" />
                  <span>
                    组织者：
                    {hoveredMeeting.meeting.attendees.find((a) => a.isHost)?.user.name ||
                      hoveredMeeting.meeting.attendees[0].user.name}
                  </span>
                </div>
              )}
              {hoveredMeeting.meeting.description && (
                <div className="pt-2 border-t border-neutral-100">
                  <p className="text-[10px] text-neutral-500 line-clamp-2">
                    {hoveredMeeting.meeting.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
