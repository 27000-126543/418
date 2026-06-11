import { useState, useMemo } from 'react';
import {
  Monitor,
  PenTool,
  Video,
  Speaker,
  Mic,
  AlertTriangle,
  Check,
  Zap,
  Cpu,
} from 'lucide-react';
import { useResourceStore } from '@/store/useResourceStore';
import type { Device, DeviceType, DeviceStatus } from '@/types';
import { cn } from '@/lib/utils';
import { formatPercent } from '@/utils/formatters';

const deviceTypeConfig: Record<DeviceType, { label: string; icon: typeof Monitor; color: string }> = {
  projector: {
    label: '投影仪',
    icon: Monitor,
    color: 'from-blue-500 to-blue-600',
  },
  whiteboard: {
    label: '电子白板',
    icon: PenTool,
    color: 'from-violet-500 to-violet-600',
  },
  'video-conferencing': {
    label: '视频会议',
    icon: Video,
    color: 'from-accent-500 to-accent-600',
  },
  speaker: {
    label: '音响系统',
    icon: Speaker,
    color: 'from-orange-500 to-orange-600',
  },
  microphone: {
    label: '麦克风',
    icon: Mic,
    color: 'from-pink-500 to-pink-600',
  },
};

const statusLightConfig: Record<DeviceStatus, string> = {
  available: 'bg-success-500 shadow-success-500/40',
  'in-use': 'bg-warning-500 shadow-warning-500/40',
  faulty: 'bg-danger-500 shadow-danger-500/40',
  maintenance: 'bg-violet-500 shadow-violet-500/40',
};

const statusTextConfig: Record<DeviceStatus, { label: string; className: string }> = {
  available: { label: '可用', className: 'text-success-600 bg-success-50' },
  'in-use': { label: '使用中', className: 'text-warning-600 bg-warning-50' },
  faulty: { label: '故障', className: 'text-danger-600 bg-danger-50' },
  maintenance: { label: '维护中', className: 'text-violet-600 bg-violet-50' },
};

interface DeviceSelectorProps {
  roomId?: string;
  selectedIds?: string[];
  onChange?: (ids: string[]) => void;
  className?: string;
}

export default function DeviceSelector({
  roomId,
  selectedIds = [],
  onChange,
  className,
}: DeviceSelectorProps) {
  const { devices } = useResourceStore();
  const [activeType, setActiveType] = useState<DeviceType | 'all'>('all');

  const deviceTypes: Array<DeviceType> = ['projector', 'whiteboard', 'video-conferencing', 'speaker', 'microphone'];

  const compatibleDevices = useMemo(() => {
    let result = devices;

    if (roomId) {
      result = result.filter((d) => d.compatibleRooms.includes(roomId));
    }

    if (activeType !== 'all') {
      result = result.filter((d) => d.type === activeType);
    }

    return result;
  }, [devices, roomId, activeType]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: roomId ? compatibleDevices.length : devices.length };
    deviceTypes.forEach((type) => {
      counts[type] = devices.filter((d) => {
        if (roomId && !d.compatibleRooms.includes(roomId)) return false;
        return d.type === type;
      }).length;
    });
    return counts;
  }, [devices, roomId, deviceTypes, compatibleDevices]);

  const handleToggle = (deviceId: string) => {
    if (!onChange) return;
    const device = devices.find((d) => d.id === deviceId);
    if (!device || device.status === 'faulty' || device.status === 'maintenance') return;

    if (selectedIds.includes(deviceId)) {
      onChange(selectedIds.filter((id) => id !== deviceId));
    } else {
      onChange([...selectedIds, deviceId]);
    }
  };

  return (
    <div className={cn('bg-white rounded-2xl shadow-card p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary-800">设备选择</h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              {roomId
                ? `已选 ${selectedIds.length} 项设备 / 共 ${compatibleDevices.length} 项兼容设备`
                : `已选 ${selectedIds.length} 项设备`}
            </p>
          </div>
        </div>
        {selectedIds.length > 0 && (
          <button
            onClick={() => onChange?.([])}
            className="text-xs text-neutral-500 hover:text-danger-500 underline underline-offset-2 transition-colors"
          >
            清除全部
          </button>
        )}
      </div>

      <div className="mb-6 overflow-x-auto pb-2 -mx-2 px-2">
        <div className="flex items-center gap-2 min-w-max">
          <TypeTab
            active={activeType === 'all'}
            onClick={() => setActiveType('all')}
            count={typeCounts.all}
            icon={Zap}
          >
            全部
          </TypeTab>
          {deviceTypes.map((type) => {
            const config = deviceTypeConfig[type];
            return (
              <TypeTab
                key={type}
                active={activeType === type}
                onClick={() => setActiveType(type)}
                count={typeCounts[type]}
                icon={config.icon}
              >
                {config.label}
              </TypeTab>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {compatibleDevices.map((device, index) => {
          const typeConfig = deviceTypeConfig[device.type];
          const Icon = typeConfig.icon;
          const isSelected = selectedIds.includes(device.id);
          const isDisabled = device.status === 'faulty' || device.status === 'maintenance';

          return (
            <div
              key={device.id}
              onClick={() => handleToggle(device.id)}
              className={cn(
                'relative p-4 rounded-xl border-2 transition-all duration-300',
                'animate-slide-up',
                isSelected
                  ? 'border-accent-500 bg-accent-50/50 shadow-glow cursor-pointer'
                  : isDisabled
                    ? 'border-neutral-100 bg-neutral-50 cursor-not-allowed opacity-60'
                    : 'border-neutral-100 hover:border-primary-200 hover:shadow-md cursor-pointer bg-white',
              )}
              style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-accent flex items-center justify-center shadow-md animate-pulse-once"
>
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              <div className="flex items-start gap-3 mb-3">
                <div className={cn(
                  'shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm',
                  typeConfig.color,
                )}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="font-semibold text-primary-800 text-sm truncate">{device.name}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5 truncate">{device.model}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className={cn(
                      'animate-ping absolute inline-flex h-full w-full rounded-full opacity-60',
                      statusLightConfig[device.status],
                    )} />
                    <span className={cn(
                      'relative inline-flex rounded-full h-2.5 w-2.5 shadow-lg',
                      statusLightConfig[device.status],
                    )} />
                  </span>
                  <span className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-medium',
                    statusTextConfig[device.status].className,
                  )}>
                    {statusTextConfig[device.status].label}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {device.faultRate > 0.08 ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-warning-500" />
                  ) : null}
                  <span className={cn(
                    'text-[11px]',
                    device.faultRate > 0.08 ? 'text-warning-600' : 'text-neutral-400',
                  )}>
                    故障率 {formatPercent(device.faultRate * 100, 0)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {compatibleDevices.length === 0 && (
        <div className="py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
            <Cpu className="w-8 h-8 text-neutral-300" />
          </div>
          <p className="text-neutral-400">
            {roomId ? '当前会议室暂无兼容设备' : '没有找到符合条件的设备'}
          </p>
        </div>
      )}
    </div>
  );
}

function TypeTab({
  active,
  onClick,
  count,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  icon: typeof Zap;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap',
        active
          ? 'bg-gradient-primary text-white shadow-md shadow-primary-500/20'
          : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100',
      )}
    >
      <Icon className={cn('w-4 h-4', active && 'text-white/90')} />
      <span>{children}</span>
      <span className={cn(
        'px-1.5 py-0.5 rounded-md text-[10px] font-bold',
        active ? 'bg-white/20 text-white/90' : 'bg-white text-neutral-500',
      )}>
        {count}
      </span>
    </button>
  );
}
