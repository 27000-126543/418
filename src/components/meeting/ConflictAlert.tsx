import { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Cpu,
  User,
  XCircle,
} from 'lucide-react';
import type { ResourceConflict } from '@/types';
import { cn } from '@/lib/utils';

interface ConflictAlertProps {
  conflicts: ResourceConflict[];
  className?: string;
}

function formatTimeRange(start: Date, end: Date): string {
  const s = new Date(start);
  const e = new Date(end);
  const sTime = s.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const eTime = e.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const sDate = `${s.getMonth() + 1}/${s.getDate()}`;
  const eDate = `${e.getMonth() + 1}/${e.getDate()}`;
  return sDate === eDate ? `${sDate} ${sTime} - ${eTime}` : `${sDate} ${sTime} - ${eDate} ${eTime}`;
}

const conflictIconMap = {
  room: MapPin,
  device: Cpu,
  time: User,
};

const conflictLabelMap: Record<'room' | 'device' | 'time', string> = {
  room: '会议室冲突',
  device: '设备冲突',
  time: '参会人时间冲突',
};

const conflictColorMap: Record<'room' | 'device' | 'time', string> = {
  room: 'from-red-500 to-rose-600',
  device: 'from-orange-500 to-amber-600',
  time: 'from-pink-500 to-rose-500',
};

export default function ConflictAlert({
  conflicts,
  className,
}: ConflictAlertProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (conflicts.length === 0) return null;

  const roomConflicts = conflicts.filter((c) => c.type === 'room');
  const deviceConflicts = conflicts.filter((c) => c.type === 'device');
  const timeConflicts = conflicts.filter((c) => c.type === 'time');

  const hasCriticalConflict = roomConflicts.length > 0;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl shadow-card animate-fade-in',
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 opacity-95" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA4Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />

      <div className="relative p-5 text-white">
        <div
          className="flex items-start justify-between gap-4 cursor-pointer select-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold">
                  检测到 {conflicts.length} 个资源冲突
                </h3>
                {hasCriticalConflict && (
                  <span className="px-2 py-0.5 rounded-full bg-white text-danger-500 text-[10px] font-bold">
                    严重
                  </span>
                )}
              </div>
              <p className="text-sm text-white/80 leading-relaxed">
                {roomConflicts.length > 0 && `会议室冲突 ${roomConflicts.length} 项`}
                {roomConflicts.length > 0 && (deviceConflicts.length > 0 || timeConflicts.length > 0) && ' · '}
                {deviceConflicts.length > 0 && `设备冲突 ${deviceConflicts.length} 项`}
                {deviceConflicts.length > 0 && timeConflicts.length > 0 && ' · '}
                {timeConflicts.length > 0 && `人员时间冲突 ${timeConflicts.length} 项`}
              </p>
            </div>
          </div>

          <button
            className="shrink-0 w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className={cn(
          'overflow-hidden transition-all duration-500 ease-in-out',
          isExpanded ? 'max-h-[1000px] opacity-100 mt-5' : 'max-h-0 opacity-0',
        )}>
          <div className="space-y-3">
            {roomConflicts.length > 0 && (
              <ConflictSection
                type="room"
                conflicts={roomConflicts}
              />
            )}
            {deviceConflicts.length > 0 && (
              <ConflictSection
                type="device"
                conflicts={deviceConflicts}
              />
            )}
            {timeConflicts.length > 0 && (
              <ConflictSection
                type="time"
                conflicts={timeConflicts}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConflictSection({
  type,
  conflicts,
}: {
  type: 'room' | 'device' | 'time';
  conflicts: ResourceConflict[];
}) {
  const Icon = conflictIconMap[type];
  const label = conflictLabelMap[type];
  const colorClass = conflictColorMap[type];

  return (
    <div className="rounded-xl bg-white/10 backdrop-blur-sm overflow-hidden border border-white/15 animate-slide-up">
      <div className={cn(
        'px-4 py-2.5 flex items-center gap-2 bg-gradient-to-r',
        colorClass,
      )}>
        <Icon className="w-4 h-4 text-white/90" />
        <span className="text-sm font-semibold text-white">{label}</span>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-white/25 text-xs font-bold text-white">
          {conflicts.length}
        </span>
      </div>

      <div className="divide-y divide-white/10">
        {conflicts.map((conflict, index) => (
          <ConflictItem
            key={`${conflict.resourceId}-${index}`}
            conflict={conflict}
            type={type}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

function ConflictItem({
  conflict,
  type,
  index,
}: {
  conflict: ResourceConflict;
  type: 'room' | 'device' | 'time';
  index: number;
}) {
  const DetailIcon = type === 'time' ? User : type === 'device' ? Cpu : MapPin;

  return (
    <div
      className="px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
        <XCircle className="w-4 h-4 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <DetailIcon className="w-4 h-4 text-white/70 shrink-0" />
            <span className="font-medium text-white text-sm truncate">
              {conflict.resourceName}
            </span>
            {conflict.conflictingMeetingTitle && (
              <span className="text-white/60 text-xs truncate">
                → {conflict.conflictingMeetingTitle}
              </span>
            )}
          </div>
        </div>

        {conflict.description ? (
          <div className="text-xs text-white/80">
            {conflict.description}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-white/70">
            <Clock className="w-3 h-3" />
            <span>{formatTimeRange(conflict.startTime, conflict.endTime)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
