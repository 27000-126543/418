import type { Device, CateringOption, User, MeetingRoom, ResourceChange } from '@/types';
import { useState } from 'react';
import {
  Monitor,
  Coffee,
  Plus,
  X,
  Check,
  ArrowRight,
  Send,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  RefreshCw,
  MapPin,
  History,
  Save,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatters';
import StatusBadge from '@/components/common/StatusBadge';

interface NewResourceAdjusterProps {
  mode?: 'new';
  currentDevices: Device[];
  currentCatering: CateringOption[];
  availableDevices: Device[];
  availableCatering: CateringOption[];
  attendees: User[];
  onAdjust: (params: {
    newDeviceIds: string[];
    newCateringIds: string[];
    reason: string;
  }) => void;
}

interface LegacyResourceAdjusterProps {
  mode?: 'legacy';
  room: MeetingRoom;
  devices: Device[];
  catering: CateringOption[];
  availableRooms: MeetingRoom[];
  availableDevices: Device[];
  availableCatering: CateringOption[];
  expectedAttendees: number;
  changes?: ResourceChange[];
  onSave?: (roomId: string, deviceIds: string[], cateringIds: string[]) => void;
}

type ResourceAdjusterProps = NewResourceAdjusterProps | LegacyResourceAdjusterProps;

function isLegacy(props: ResourceAdjusterProps): props is LegacyResourceAdjusterProps {
  return 'room' in props;
}

export default function ResourceAdjuster(props: ResourceAdjusterProps) {
  if (isLegacy(props)) {
    return <LegacyResourceAdjuster {...props} />;
  }
  return <NewResourceAdjuster {...props} />;
}

function LegacyResourceAdjuster({
  room,
  devices,
  catering,
  availableRooms,
  availableDevices,
  availableCatering,
  expectedAttendees,
  changes = [],
  onSave,
}: LegacyResourceAdjusterProps) {
  const [selectedRoomId, setSelectedRoomId] = useState(room.id);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>(devices.map(d => d.id));
  const [selectedCateringIds, setSelectedCateringIds] = useState<string[]>(catering.map(c => c.id));
  const [changed, setChanged] = useState(false);

  const toggleDevice = (id: string) => {
    setChanged(true);
    setSelectedDeviceIds(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const toggleCatering = (id: string) => {
    setChanged(true);
    setSelectedCateringIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const totalCateringCost = catering
    .filter(c => selectedCateringIds.includes(c.id))
    .reduce((sum, c) => sum + c.pricePerPerson * expectedAttendees, 0);

  const handleSave = () => {
    setChanged(false);
    onSave?.(selectedRoomId, selectedDeviceIds, selectedCateringIds);
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-white border border-neutral-100 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary-500" />
            </div>
            <h3 className="text-sm font-bold text-neutral-800">会议室配置</h3>
          </div>
          {changed && (
            <span className="px-2.5 py-1 rounded-full bg-warning-50 text-warning-600 text-xs font-bold">
              有未保存的修改
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableRooms.map(r => (
            <div
              key={r.id}
              onClick={() => { setChanged(r.id !== room.id); setSelectedRoomId(r.id); }}
              className={cn(
                'p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3',
                selectedRoomId === r.id
                  ? 'border-accent-400 bg-accent-50/50'
                  : 'border-neutral-100 hover:border-primary-200',
                r.status === 'maintenance' ? 'opacity-50 cursor-not-allowed' : ''
              )}
            >
              <img src={r.image} alt={r.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-neutral-800 truncate">{r.name}</div>
                <div className="text-[10px] text-neutral-400">{r.floor}F · {r.location} · {r.capacity}人</div>
                <StatusBadge status={r.status} type="room" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-neutral-100 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-50 flex items-center justify-center">
              <Monitor className="w-4 h-4 text-accent-500" />
            </div>
            <h3 className="text-sm font-bold text-neutral-800">设备配置</h3>
          </div>
          <span className="text-xs text-neutral-500">已选 {selectedDeviceIds.length} 台</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableDevices.map(d => {
            const isSelected = selectedDeviceIds.includes(d.id);
            const isDisabled = d.status === 'faulty';
            return (
              <button
                key={d.id}
                onClick={() => !isDisabled && toggleDevice(d.id)}
                disabled={isDisabled}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2',
                  isDisabled
                    ? 'bg-neutral-50 text-neutral-300 cursor-not-allowed'
                    : isSelected
                    ? 'bg-gradient-accent text-white shadow-md'
                    : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                )}
              >
                {isSelected && <Plus className="w-3 h-3" />}
                {d.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-neutral-100 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-warning-50 flex items-center justify-center">
              <Coffee className="w-4 h-4 text-warning-600" />
            </div>
            <h3 className="text-sm font-bold text-neutral-800">餐饮服务</h3>
          </div>
          <span className="text-xs font-semibold text-accent-600">
            预计费用 ¥{totalCateringCost.toFixed(0)}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableCatering.map(c => {
            const isSelected = selectedCateringIds.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggleCatering(c.id)}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2',
                  isSelected
                    ? 'bg-warning-500 text-white shadow-md'
                    : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                )}
              >
                {isSelected ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {c.name}
                <span className={cn('opacity-70', isSelected && 'text-white/80')}>¥{c.pricePerPerson}</span>
              </button>
            );
          })}
        </div>
      </div>

      {changes.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-neutral-100 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
              <History className="w-4 h-4 text-neutral-500" />
            </div>
            <h3 className="text-sm font-bold text-neutral-800">变更历史</h3>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {changes.slice().reverse().map(change => (
              <div key={change.id} className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50">
                <Clock className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-neutral-700">{change.description}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    {new Date(change.changedAt).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {changed && (
        <div className="sticky bottom-0 p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-neutral-100 shadow-lg flex items-center justify-between">
          <span className="text-sm text-neutral-600">您有未保存的资源变更</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedRoomId(room.id);
                setSelectedDeviceIds(devices.map(d => d.id));
                setSelectedCateringIds(catering.map(c => c.id));
                setChanged(false);
              }}
              className="px-4 py-2 rounded-xl text-sm text-neutral-600 hover:bg-neutral-100 font-medium transition-colors"
            >
              撤销更改
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-primary text-white text-sm font-medium hover:shadow-md transition-all shadow-sm"
            >
              <Save className="w-4 h-4" />
              保存配置
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewResourceAdjuster({
  currentDevices,
  currentCatering,
  availableDevices,
  availableCatering,
  attendees,
  onAdjust,
}: NewResourceAdjusterProps) {
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>(
    currentDevices.map((d) => d.id)
  );
  const [selectedCateringIds, setSelectedCateringIds] = useState<string[]>(
    currentCatering.map((c) => c.id)
  );
  const [showDevicePanel, setShowDevicePanel] = useState(false);
  const [showCateringPanel, setShowCateringPanel] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleDevice = (id: string) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const toggleCatering = (id: string) => {
    setSelectedCateringIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const addedDevices = availableDevices.filter(
    (d) =>
      selectedDeviceIds.includes(d.id) &&
      !currentDevices.some((cd) => cd.id === d.id)
  );
  const removedDevices = currentDevices.filter(
    (d) => !selectedDeviceIds.includes(d.id)
  );
  const addedCatering = availableCatering.filter(
    (c) =>
      selectedCateringIds.includes(c.id) &&
      !currentCatering.some((cc) => cc.id === c.id)
  );
  const removedCatering = currentCatering.filter(
    (c) => !selectedCateringIds.includes(c.id)
  );

  const hasChanges =
    addedDevices.length > 0 ||
    removedDevices.length > 0 ||
    addedCatering.length > 0 ||
    removedCatering.length > 0;

  const attendeeCount = attendees.length;

  const originalCost = currentCatering.reduce(
    (sum, c) => sum + c.pricePerPerson * attendeeCount,
    0
  );
  const newCost =
    currentCatering
      .filter((c) => selectedCateringIds.includes(c.id))
      .reduce((sum, c) => sum + c.pricePerPerson * attendeeCount, 0) +
    addedCatering.reduce(
      (sum, c) => sum + c.pricePerPerson * attendeeCount,
      0
    );
  const costDiff = newCost - originalCost;

  const handleSubmit = async () => {
    if (!hasChanges || !reason.trim()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    onAdjust({
      newDeviceIds: selectedDeviceIds,
      newCateringIds: selectedCateringIds,
      reason: reason.trim(),
    });
    setSubmitting(false);
  };

  const handleReset = () => {
    setSelectedDeviceIds(currentDevices.map((d) => d.id));
    setSelectedCateringIds(currentCatering.map((c) => c.id));
    setReason('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-neutral-100">
      <div className="px-6 py-4 bg-gradient-primary flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">动态资源调整</h3>
          <p className="text-primary-100 text-sm mt-0.5">
            参会人数：{attendeeCount} 人
          </p>
        </div>
        {hasChanges && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 text-white text-xs font-medium hover:bg-white/25 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            重置
          </button>
        )}
      </div>

      <div className="p-6 space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-primary-500" />
              当前设备配置
            </h4>
            <button
              onClick={() => setShowDevicePanel(!showDevicePanel)}
              className="flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {showDevicePanel ? '收起面板' : '添加/更换设备'}
              {showDevicePanel ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50/60 border border-neutral-100">
            {selectedDeviceIds.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-3">
                暂未选择设备
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableDevices
                  .filter((d) => selectedDeviceIds.includes(d.id))
                  .map((d) => {
                    const isAdded = addedDevices.some((ad) => ad.id === d.id);
                    return (
                      <div
                        key={d.id}
                        className={cn(
                          'group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all',
                          isAdded
                            ? 'bg-success-50 text-success-700 border border-success-200'
                            : 'bg-primary-50 text-primary-700 border border-primary-100'
                        )}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>{d.name}</span>
                        {isAdded && (
                          <span className="px-1.5 py-0.5 rounded bg-success-500/15 text-[10px] font-bold">
                            +新增
                          </span>
                        )}
                        {removedDevices.length === 0 && (
                          <button
                            onClick={() => toggleDevice(d.id)}
                            className="ml-1 p-0.5 rounded hover:bg-white/60 text-neutral-400 hover:text-danger-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                {removedDevices.map((d) => (
                  <div
                    key={`removed-${d.id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-danger-50 text-danger-600 border border-danger-200 line-through opacity-60"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>{d.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-danger-500/15 text-[10px] font-bold">
                      -移除
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showDevicePanel && (
            <div className="p-4 rounded-xl bg-accent-50/40 border border-accent-100 animate-slide-down">
              <p className="text-xs text-neutral-500 mb-3">
                点击选择或取消选择设备
              </p>
              <div className="flex flex-wrap gap-2">
                {availableDevices.map((d) => {
                  const isSelected = selectedDeviceIds.includes(d.id);
                  const isDisabled = d.status === 'faulty';
                  return (
                    <button
                      key={d.id}
                      onClick={() => !isDisabled && toggleDevice(d.id)}
                      disabled={isDisabled}
                      className={cn(
                        'px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5',
                        isDisabled
                          ? 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                          : isSelected
                          ? 'bg-gradient-accent text-white shadow-md'
                          : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {d.name}
                      {isDisabled && (
                        <span className="text-[10px] ml-1">(故障)</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
              <Coffee className="w-4 h-4 text-warning-600" />
              当前餐饮服务
            </h4>
            <button
              onClick={() => setShowCateringPanel(!showCateringPanel)}
              className="flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {showCateringPanel ? '收起面板' : '添加餐饮服务'}
              {showCateringPanel ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50/60 border border-neutral-100">
            {selectedCateringIds.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-3">
                暂未选择餐饮服务
              </p>
            ) : (
              <div className="space-y-2">
                {[
                  ...currentCatering.filter((c) =>
                    selectedCateringIds.includes(c.id)
                  ),
                  ...addedCatering,
                ].map((c) => {
                  const isAdded = addedCatering.some((ac) => ac.id === c.id);
                  return (
                    <div
                      key={c.id}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-xl text-xs',
                        isAdded
                          ? 'bg-success-50 border border-success-200'
                          : 'bg-warning-50 border border-warning-100'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Coffee
                          className={cn(
                            'w-3.5 h-3.5',
                            isAdded ? 'text-success-600' : 'text-warning-600'
                          )}
                        />
                        <span className="font-medium text-neutral-800">
                          {c.name}
                        </span>
                        {isAdded && (
                          <span className="px-1.5 py-0.5 rounded bg-success-500/15 text-success-700 text-[10px] font-bold">
                            +新增
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-neutral-500">
                          ¥{c.pricePerPerson} × {attendeeCount}人
                        </span>
                        <span className="font-semibold text-neutral-800">
                          {formatCurrency(c.pricePerPerson * attendeeCount)}
                        </span>
                        <button
                          onClick={() => toggleCatering(c.id)}
                          className="p-1 rounded hover:bg-white/60 text-neutral-400 hover:text-danger-500 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {removedCatering.map((c) => (
                  <div
                    key={`removed-${c.id}`}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-danger-50 border border-danger-200 opacity-60"
                  >
                    <div className="flex items-center gap-2">
                      <Coffee className="w-3.5 h-3.5 text-danger-500" />
                      <span className="font-medium text-neutral-800 line-through">
                        {c.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-danger-500/15 text-danger-700 text-[10px] font-bold">
                        -移除
                      </span>
                    </div>
                    <span className="font-semibold text-danger-600 line-through">
                      -{formatCurrency(c.pricePerPerson * attendeeCount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showCateringPanel && (
            <div className="p-4 rounded-xl bg-warning-50/40 border border-warning-100 animate-slide-down">
              <p className="text-xs text-neutral-500 mb-3">
                点击选择或取消选择餐饮服务
              </p>
              <div className="flex flex-wrap gap-2">
                {availableCatering.map((c) => {
                  const isSelected = selectedCateringIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleCatering(c.id)}
                      className={cn(
                        'px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5',
                        isSelected
                          ? 'bg-warning-500 text-white shadow-md'
                          : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {c.name}
                      <span
                        className={cn(
                          'opacity-80',
                          isSelected ? 'text-white/80' : 'text-neutral-400'
                        )}
                      >
                        ¥{c.pricePerPerson}/人
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {hasChanges && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-primary-50/80 to-accent-50/60 border border-primary-100">
            <h4 className="text-sm font-bold text-neutral-800 mb-4 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary-500" />
              变更对比
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/70 border border-neutral-100">
                <p className="text-xs font-medium text-neutral-500 mb-3">
                  原配置
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Monitor className="w-3.5 h-3.5 text-primary-500" />
                    <span className="text-neutral-600">设备：</span>
                    <span className="font-medium text-neutral-800">
                      {currentDevices.length} 台
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Coffee className="w-3.5 h-3.5 text-warning-600" />
                    <span className="text-neutral-600">餐饮：</span>
                    <span className="font-medium text-neutral-800">
                      {currentCatering.length} 项
                    </span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-neutral-100 text-xs">
                    <span className="text-neutral-500">餐饮成本：</span>
                    <span className="font-semibold text-neutral-800">
                      {formatCurrency(originalCost)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-accent-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 px-2 py-0.5 bg-gradient-accent text-white text-[10px] font-bold rounded-bl-lg">
                  新配置
                </div>
                <p className="text-xs font-medium text-neutral-500 mb-3">
                  调整后
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Monitor className="w-3.5 h-3.5 text-primary-500" />
                    <span className="text-neutral-600">设备：</span>
                    <span className="font-medium text-neutral-800">
                      {selectedDeviceIds.length} 台
                    </span>
                    {addedDevices.length - removedDevices.length !== 0 && (
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-bold',
                          addedDevices.length > removedDevices.length
                            ? 'bg-success-50 text-success-700'
                            : 'bg-danger-50 text-danger-600'
                        )}
                      >
                        {addedDevices.length > removedDevices.length
                          ? `+${addedDevices.length - removedDevices.length}`
                          : `${addedDevices.length - removedDevices.length}`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Coffee className="w-3.5 h-3.5 text-warning-600" />
                    <span className="text-neutral-600">餐饮：</span>
                    <span className="font-medium text-neutral-800">
                      {selectedCateringIds.length} 项
                    </span>
                    {addedCatering.length - removedCatering.length !== 0 && (
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-bold',
                          addedCatering.length > removedCatering.length
                            ? 'bg-success-50 text-success-700'
                            : 'bg-danger-50 text-danger-600'
                        )}
                      >
                        {addedCatering.length > removedCatering.length
                          ? `+${addedCatering.length - removedCatering.length}`
                          : `${addedCatering.length - removedCatering.length}`}
                      </span>
                    )}
                  </div>
                  <div className="pt-2 mt-2 border-t border-neutral-100 text-xs">
                    <span className="text-neutral-500">餐饮成本：</span>
                    <span className="font-semibold text-neutral-800">
                      {formatCurrency(newCost)}
                    </span>
                    {costDiff !== 0 && (
                      <span
                        className={cn(
                          'ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold',
                          costDiff > 0
                            ? 'bg-danger-50 text-danger-600'
                            : 'bg-success-50 text-success-700'
                        )}
                      >
                        {costDiff > 0 ? '+' : ''}
                        {formatCurrency(costDiff)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {hasChanges && (
          <div className="space-y-3">
            <label className="block">
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-warning-500" />
                <span className="text-sm font-medium text-neutral-700">
                  变更原因
                  <span className="text-danger-500 ml-1">*</span>
                </span>
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="请说明调整资源的原因，该原因将随通知发送给参会人..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 outline-none transition-all text-sm resize-none"
              />
            </label>

            <button
              onClick={handleSubmit}
              disabled={!reason.trim() || submitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-accent text-white font-medium text-sm hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  正在提交调整...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  确认调整并通知参会人
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
