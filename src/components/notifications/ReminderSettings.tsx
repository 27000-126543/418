import {
  Bell,
  Mail,
  MessageCircle,
  Clock,
  Save,
  Check,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ReminderSettingsProps {
  initialConfig?: ReminderConfig;
  onSave?: (config: ReminderConfig) => void;
}

export interface ReminderConfig {
  presets: Array<{
    id: string;
    minutes: number;
    label: string;
    enabled: boolean;
  }>;
  customTime?: {
    minutes: number;
    enabled: boolean;
  };
  channels: {
    inApp: boolean;
    email: boolean;
    wechat: boolean;
  };
}

const defaultPresets: ReminderConfig['presets'] = [
  { id: '5m', minutes: 5, label: '5 分钟前', enabled: true },
  { id: '15m', minutes: 15, label: '15 分钟前', enabled: true },
  { id: '30m', minutes: 30, label: '30 分钟前', enabled: false },
  { id: '1h', minutes: 60, label: '1 小时前', enabled: false },
  { id: '24h', minutes: 1440, label: '24 小时前', enabled: false },
];

const defaultConfig: ReminderConfig = {
  presets: defaultPresets,
  customTime: undefined,
  channels: {
    inApp: true,
    email: true,
    wechat: false,
  },
};

export default function ReminderSettings({
  initialConfig,
  onSave,
}: ReminderSettingsProps) {
  const [config, setConfig] = useState<ReminderConfig>(
    initialConfig || defaultConfig
  );
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customMinutes, setCustomMinutes] = useState<number>(10);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const togglePreset = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      presets: prev.presets.map((p) =>
        p.id === id ? { ...p, enabled: !p.enabled } : p
      ),
    }));
  };

  const toggleChannel = (
    channel: keyof ReminderConfig['channels']
  ) => {
    setConfig((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: !prev.channels[channel],
      },
    }));
  };

  const handleAddCustom = () => {
    if (customMinutes < 1) return;
    setConfig((prev) => ({
      ...prev,
      customTime: { minutes: customMinutes, enabled: true },
    }));
    setShowCustomInput(false);
  };

  const handleRemoveCustom = () => {
    setConfig((prev) => ({ ...prev, customTime: undefined }));
  };

  const toggleCustom = () => {
    if (!config.customTime) return;
    setConfig((prev) => ({
      ...prev,
      customTime: {
        ...prev.customTime!,
        enabled: !prev.customTime!.enabled,
      },
    }));
  };

  const anyChannelSelected =
    config.channels.inApp || config.channels.email || config.channels.wechat;

  const handleSave = async () => {
    if (!anyChannelSelected) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    onSave?.(config);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const activeReminders = [
    ...config.presets.filter((p) => p.enabled),
    ...(config.customTime && config.customTime.enabled
      ? [
          {
            id: 'custom',
            minutes: config.customTime.minutes,
            label: `${config.customTime.minutes} 分钟前`,
            enabled: true,
          },
        ]
      : []),
  ];

  const formatChannelLabel = (
    channel: keyof ReminderConfig['channels']
  ) => {
    switch (channel) {
      case 'inApp':
        return '站内通知';
      case 'email':
        return '邮件';
      case 'wechat':
        return '微信';
    }
  };

  const activeChannels = (
    Object.keys(config.channels) as Array<keyof ReminderConfig['channels']>
  )
    .filter((k) => config.channels[k])
    .map(formatChannelLabel)
    .join('、');

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-neutral-100">
      <div className="px-6 py-4 bg-gradient-primary flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            提醒设置
          </h3>
          <p className="text-primary-100 text-sm mt-0.5">
            自定义会议开始前的提醒方式
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent-500" />
            提醒时间
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-3">
            {config.presets.map((preset) => {
              const isActive = preset.enabled;
              return (
                <button
                  key={preset.id}
                  onClick={() => togglePreset(preset.id)}
                  className={cn(
                    'relative p-3 rounded-xl text-xs font-medium transition-all border-2 flex flex-col items-center gap-1',
                    isActive
                      ? 'border-accent-400 bg-accent-50/60 text-accent-700 shadow-sm'
                      : 'border-neutral-100 bg-neutral-50/50 text-neutral-500 hover:border-neutral-200 hover:bg-neutral-50'
                  )}
                >
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-gradient-accent flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  <span className="text-lg font-bold">{preset.label.split(' ')[0]}</span>
                  <span className="text-[10px] opacity-80">
                    {preset.label.includes('分钟') ? '分钟前' : preset.label.includes('小时') ? '小时前' : '天前'}
                  </span>
                </button>
              );
            })}
          </div>

          {config.customTime ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-warning-50/60 border-2 border-warning-200">
              <button
                onClick={toggleCustom}
                className="flex-1 flex items-center gap-3"
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all',
                    config.customTime.enabled
                      ? 'bg-gradient-accent text-white shadow-md'
                      : 'bg-neutral-200 text-neutral-500'
                  )}
                >
                  {config.customTime.minutes < 60
                    ? `${config.customTime.minutes}分`
                    : `${(config.customTime.minutes / 60).toFixed(1)}时`}
                </div>
                <div className="text-left">
                  <p
                    className={cn(
                      'text-xs font-semibold',
                      config.customTime.enabled
                        ? 'text-accent-700'
                        : 'text-neutral-500'
                    )}
                  >
                    {config.customTime.minutes} 分钟前
                  </p>
                  <p className="text-[10px] text-neutral-400">自定义提醒</p>
                </div>
              </button>
              <button
                onClick={handleRemoveCustom}
                className="p-1.5 rounded-lg text-neutral-400 hover:bg-danger-50 hover:text-danger-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : showCustomInput ? (
            <div className="p-3 rounded-xl bg-accent-50/60 border border-accent-200">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={customMinutes}
                    onChange={(e) =>
                      setCustomMinutes(parseInt(e.target.value) || 0)
                    }
                    className="w-24 px-3 py-2 rounded-lg border border-neutral-200 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 outline-none text-sm"
                    placeholder="分钟数"
                  />
                  <span className="text-xs text-neutral-500">分钟前</span>
                </div>
                <button
                  onClick={handleAddCustom}
                  disabled={customMinutes < 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gradient-accent text-white text-xs font-medium hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-3.5 h-3.5" />
                  添加
                </button>
                <button
                  onClick={() => setShowCustomInput(false)}
                  className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomInput(true)}
              className="w-full flex items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-dashed border-neutral-200 text-xs font-medium text-neutral-500 hover:border-accent-300 hover:bg-accent-50/40 hover:text-accent-600 transition-all"
            >
              <Plus className="w-4 h-4" />
              添加自定义提醒时间
            </button>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary-500" />
            通知方式
          </h4>

          <div className="grid grid-cols-3 gap-3">
            {(
              [
                {
                  key: 'inApp' as const,
                  label: '站内',
                  desc: '应用内推送',
                  icon: Bell,
                  color: 'primary',
                },
                {
                  key: 'email' as const,
                  label: '邮件',
                  desc: '邮箱通知',
                  icon: Mail,
                  color: 'accent',
                },
                {
                  key: 'wechat' as const,
                  label: '微信',
                  desc: '公众号推送',
                  icon: MessageCircle,
                  color: 'success',
                },
              ]
            ).map((opt) => {
              const isActive = config.channels[opt.key];
              const Icon = opt.icon;
              const colorClass = {
                primary: {
                  active: 'border-primary-400 bg-primary-50/60',
                  icon: 'bg-gradient-primary',
                  text: 'text-primary-700',
                },
                accent: {
                  active: 'border-accent-400 bg-accent-50/60',
                  icon: 'bg-gradient-accent',
                  text: 'text-accent-700',
                },
                success: {
                  active: 'border-success-400 bg-success-50/60',
                  icon: 'bg-gradient-to-br from-success-500 to-success-600',
                  text: 'text-success-700',
                },
              }[opt.color];

              return (
                <button
                  key={opt.key}
                  onClick={() => toggleChannel(opt.key)}
                  className={cn(
                    'relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                    isActive
                      ? `${colorClass.active} shadow-sm`
                      : 'border-neutral-100 bg-neutral-50/50 hover:border-neutral-200'
                  )}
                >
                  {isActive && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm',
                      isActive
                        ? `${colorClass.icon} text-white`
                        : 'bg-neutral-200 text-neutral-400'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      isActive ? colorClass.text : 'text-neutral-500'
                    )}
                  >
                    {opt.label}
                  </p>
                  <p className="text-[10px] text-neutral-400">{opt.desc}</p>
                </button>
              );
            })}
          </div>

          {!anyChannelSelected && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-danger-50 border border-danger-100">
              <AlertCircle className="w-4 h-4 text-danger-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-danger-600">
                请至少选择一种通知方式，确保提醒能够送达
              </p>
            </div>
          )}
        </div>

        {activeReminders.length > 0 && anyChannelSelected && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-50/80 to-accent-50/60 border border-primary-100">
            <p className="text-[10px] font-semibold text-neutral-500 mb-2 uppercase tracking-wider">
              提醒预览
            </p>
            <p className="text-sm text-neutral-700 leading-relaxed">
              会议开始前
              <span className="font-bold text-primary-700 mx-1">
                {activeReminders.map((r, i) => (
                  <span key={r.id}>
                    {i > 0 && '、'}
                    <span className="underline decoration-wavy decoration-accent-400/60">
                      {r.label}
                    </span>
                  </span>
                ))}
              </span>
              将通过
              <span className="font-bold text-accent-700 mx-1">
                {activeChannels}
              </span>
              发送提醒
            </p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!anyChannelSelected || saving}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium text-sm transition-all shadow-md',
            saved
              ? 'bg-gradient-to-br from-success-500 to-success-600 text-white shadow-success-500/30'
              : 'bg-gradient-accent text-white hover:shadow-glow hover:shadow-accent-500/30 disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              正在保存...
            </>
          ) : saved ? (
            <>
              <Check className="w-4 h-4" />
              保存成功
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              保存设置
            </>
          )}
        </button>
      </div>
    </div>
  );
}
