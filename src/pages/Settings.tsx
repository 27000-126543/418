import { useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useResourceStore } from '@/store/useResourceStore';
import StatusBadge from '@/components/common/StatusBadge';
import {
  User,
  Building2,
  Bell,
  Settings as SettingsIcon,
  Camera,
  Mail,
  Phone,
  Globe,
  Save,
  Plus,
  Monitor,
  Coffee,
  Trash2,
  Edit3,
  Clock,
} from 'lucide-react';

type TabType = 'personal' | 'resources' | 'notifications' | 'system';

const TABS: { id: TabType; label: string; icon: typeof User }[] = [
  { id: 'personal', label: '个人设置', icon: User },
  { id: 'resources', label: '资源管理', icon: Building2 },
  { id: 'notifications', label: '通知偏好', icon: Bell },
  { id: 'system', label: '系统配置', icon: SettingsIcon },
];

interface ResourceTab {
  active: 'rooms' | 'devices' | 'catering';
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [resourceTab, setResourceTab] = useState<ResourceTab['active']>('rooms');
  const [toast, setToast] = useState<string | null>(null);

  const { currentUser, users } = useUserStore();
  const { rooms, devices, cateringOptions } = useResourceStore();

  const [personalForm, setPersonalForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    department: currentUser?.department || '',
    position: currentUser?.position || '',
    timezone: 'Asia/Shanghai',
    language: 'zh-CN',
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    emailInvitations: true,
    emailReminders: true,
    emailChanges: true,
    pushInvitations: true,
    pushReminders: true,
    pushChanges: true,
    smsReminders: false,
    dailyDigest: true,
    weeklyReport: true,
    reminderMinutes: 15,
  });

  const [systemConfig, setSystemConfig] = useState({
    defaultMeetingDuration: 60,
    minAttendees: 1,
    maxMeetingDays: 30,
    autoCancelHours: 24,
    defaultReminderMinutes: 15,
    workingHoursStart: '08:00',
    workingHoursEnd: '20:00',
    allowWeekendBooking: false,
    enableConflictDetection: true,
    enableSmartSuggestions: true,
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl bg-success-500 text-white text-sm font-semibold shadow-xl shadow-success-500/40 animate-slide-right flex items-center gap-2">
          <Save className="w-4 h-4" />
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-neutral-800 mb-1">系统设置</h1>
        <p className="text-sm text-neutral-500">
          管理个人信息、资源、通知和系统偏好配置
        </p>
      </div>

      <div className="p-1 rounded-2xl bg-white border border-neutral-100 shadow-card">
        <div className="flex flex-wrap gap-1 p-1 bg-neutral-50 rounded-xl">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-slide-up">
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-gradient-primary text-white shadow-card relative overflow-hidden">
              <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-white/5" />
              <div className="relative">
                <div className="relative w-28 h-28 mx-auto mb-4">
                  <img
                    src={currentUser?.avatar || ''}
                    alt={currentUser?.name || ''}
                    className="w-full h-full rounded-2xl object-cover border-4 border-white/20 shadow-xl"
                  />
                  <button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-accent-500 text-white flex items-center justify-center shadow-lg shadow-accent-500/40 hover:bg-accent-600 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-1">{currentUser?.name}</h3>
                  <p className="text-sm text-white/80">{currentUser?.position}</p>
                  <div className="mt-4 inline-flex px-3 py-1 rounded-full bg-white/10 text-xs text-white/90">
                    {currentUser?.department}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-white/90 truncate">
                      {currentUser?.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="text-white/90">{currentUser?.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary-500" />
                    基本信息
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">
                      姓名
                    </label>
                    <input
                      className="input-base"
                      value={personalForm.name}
                      onChange={e =>
                        setPersonalForm({ ...personalForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">
                      邮箱
                    </label>
                    <input
                      type="email"
                      className="input-base"
                      value={personalForm.email}
                      onChange={e =>
                        setPersonalForm({ ...personalForm, email: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">
                      手机号
                    </label>
                    <input
                      className="input-base"
                      value={personalForm.phone}
                      onChange={e =>
                        setPersonalForm({ ...personalForm, phone: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">
                      部门
                    </label>
                    <input
                      className="input-base"
                      value={personalForm.department}
                      onChange={e =>
                        setPersonalForm({
                          ...personalForm,
                          department: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">
                      职位
                    </label>
                    <input
                      className="input-base"
                      value={personalForm.position}
                      onChange={e =>
                        setPersonalForm({
                          ...personalForm,
                          position: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
                <h3 className="text-sm font-bold text-neutral-800 mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-accent-500" />
                  区域和语言
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">
                      时区
                    </label>
                    <select
                      className="input-base"
                      value={personalForm.timezone}
                      onChange={e =>
                        setPersonalForm({
                          ...personalForm,
                          timezone: e.target.value,
                        })
                      }
                    >
                      <option value="Asia/Shanghai">(UTC+8) 北京、上海</option>
                      <option value="Asia/Tokyo">(UTC+9) 东京</option>
                      <option value="Asia/Singapore">(UTC+8) 新加坡</option>
                      <option value="Europe/London">(UTC+0) 伦敦</option>
                      <option value="America/New_York">(UTC-5) 纽约</option>
                      <option value="America/Los_Angeles">(UTC-8) 洛杉矶</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">
                      语言
                    </label>
                    <select
                      className="input-base"
                      value={personalForm.language}
                      onChange={e =>
                        setPersonalForm({
                          ...personalForm,
                          language: e.target.value,
                        })
                      }
                    >
                      <option value="zh-CN">简体中文</option>
                      <option value="en-US">English (US)</option>
                      <option value="ja-JP">日本語</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => showToast('个人信息已保存')}
                  className="btn-primary"
                >
                  <Save className="w-4 h-4" />
                  保存更改
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-6">
            <div className="p-1 rounded-2xl bg-white border border-neutral-100 shadow-card">
              <div className="flex gap-1 p-1 bg-neutral-50 rounded-xl">
                {[
                  { id: 'rooms', label: '会议室', icon: Building2 },
                  { id: 'devices', label: '设备', icon: Monitor },
                  { id: 'catering', label: '餐饮', icon: Coffee },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setResourceTab(tab.id as typeof resourceTab)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                      resourceTab === tab.id
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {resourceTab === 'rooms' && (
              <div className="rounded-2xl bg-white border border-neutral-100 shadow-card overflow-hidden">
                <div className="p-5 flex items-center justify-between border-b border-neutral-100">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-800">会议室列表</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      共 {rooms.length} 间会议室
                    </p>
                  </div>
                  <button className="btn-accent text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    添加会议室
                  </button>
                </div>
                <div className="divide-y divide-neutral-50">
                  {rooms.map(r => (
                    <div
                      key={r.id}
                      className="p-4 flex items-center gap-4 hover:bg-primary-50/30 transition-colors"
                    >
                      <img
                        src={r.image}
                        alt={r.name}
                        className="w-16 h-16 rounded-xl object-cover shadow-sm shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-neutral-800 truncate">
                            {r.name}
                          </h4>
                          <StatusBadge status={r.status} type="room" />
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {r.location} · {r.floor}F · 容纳 {r.capacity} 人
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg text-neutral-400 hover:text-primary-500 hover:bg-primary-50 transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg text-neutral-400 hover:text-danger-500 hover:bg-danger-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resourceTab === 'devices' && (
              <div className="rounded-2xl bg-white border border-neutral-100 shadow-card overflow-hidden">
                <div className="p-5 flex items-center justify-between border-b border-neutral-100">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-800">设备列表</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      共 {devices.length} 台设备
                    </p>
                  </div>
                  <button className="btn-accent text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    添加设备
                  </button>
                </div>
                <div className="divide-y divide-neutral-50">
                  {devices.map(d => (
                    <div
                      key={d.id}
                      className="p-4 flex items-center gap-4 hover:bg-primary-50/30 transition-colors"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          d.status === 'available'
                            ? 'bg-primary-50 text-primary-500'
                            : d.status === 'faulty'
                            ? 'bg-danger-50 text-danger-500'
                            : 'bg-warning-50 text-warning-500'
                        }`}
                      >
                        <Monitor className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-neutral-800 truncate">
                            {d.name}
                          </h4>
                          <StatusBadge status={d.status} type="device" />
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {d.model} · 故障 {d.faultCount} 次 · 使用 {d.useCount} 次
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg text-neutral-400 hover:text-primary-500 hover:bg-primary-50 transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg text-neutral-400 hover:text-danger-500 hover:bg-danger-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resourceTab === 'catering' && (
              <div className="rounded-2xl bg-white border border-neutral-100 shadow-card overflow-hidden">
                <div className="p-5 flex items-center justify-between border-b border-neutral-100">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-800">餐饮选项</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      共 {cateringOptions.length} 项服务
                    </p>
                  </div>
                  <button className="btn-accent text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    添加餐饮
                  </button>
                </div>
                <div className="divide-y divide-neutral-50">
                  {cateringOptions.map(c => (
                    <div
                      key={c.id}
                      className="p-4 flex items-center gap-4 hover:bg-primary-50/40 transition-colors"
                    >
                      <img
                        src={c.image}
                        alt={c.name}
                        className="w-16 h-16 rounded-xl object-cover shadow-sm shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-neutral-800 truncate">
                            {c.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-warning-50 text-[9px] font-bold text-warning-600">
                            ¥{c.pricePerPerson}/人
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 line-clamp-1">
                          {c.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg text-neutral-400 hover:text-primary-500 hover:bg-primary-50 transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg text-neutral-400 hover:text-danger-500 hover:bg-danger-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
              <h3 className="text-sm font-bold text-neutral-800 mb-5 flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary-500" />
                邮件通知
              </h3>
              <div className="space-y-3">
                {[
                  {
                    key: 'emailInvitations',
                    label: '会议邀请',
                    desc: '收到新的会议邀请时邮件通知',
                  },
                  {
                    key: 'emailReminders',
                    label: '会议提醒',
                    desc: '会议开始前发送邮件提醒',
                  },
                  {
                    key: 'emailChanges',
                    label: '会议变更',
                    desc: '会议时间/地点/人员变更时通知',
                  },
                ].map(item => (
                  <div
                    key={item.key}
                    className="p-4 rounded-xl bg-neutral-50/50 flex items-center justify-between gap-4 hover:bg-primary-50/30 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium text-neutral-800">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                    <Toggle
                      checked={
                        notificationPrefs[item.key as keyof typeof notificationPrefs] as boolean
                      }
                      onChange={v =>
                        setNotificationPrefs({
                          ...notificationPrefs,
                          [item.key]: v,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
              <h3 className="text-sm font-bold text-neutral-800 mb-5 flex items-center gap-2">
                <Bell className="w-4 h-4 text-accent-500" />
                推送通知
              </h3>
              <div className="space-y-3">
                {[
                  {
                    key: 'pushInvitations',
                    label: '会议邀请推送',
                    desc: 'App内实时推送邀请消息',
                  },
                  {
                    key: 'pushReminders',
                    label: '会议提醒推送',
                    desc: '会议开始前弹出提醒',
                  },
                  {
                    key: 'pushChanges',
                    label: '变更推送',
                    desc: '会议信息变更实时推送',
                  },
                ].map(item => (
                  <div
                    key={item.key}
                    className="p-4 rounded-xl bg-neutral-50/50 flex items-center justify-between gap-4 hover:bg-primary-50/30 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium text-neutral-800">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                    <Toggle
                      checked={
                        notificationPrefs[item.key as keyof typeof notificationPrefs] as boolean
                      }
                      onChange={v =>
                        setNotificationPrefs({
                          ...notificationPrefs,
                          [item.key]: v,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
              <h3 className="text-sm font-bold text-neutral-800 mb-5 flex items-center gap-2">
                <Phone className="w-4 h-4 text-warning-500" />
                短信和摘要
              </h3>
              <div className="space-y-3">
                {[
                  {
                    key: 'smsReminders',
                    label: '短信提醒',
                    desc: '重要会议前发送短信提醒',
                  },
                  {
                    key: 'dailyDigest',
                    label: '每日摘要',
                    desc: '每天早上汇总当日会议',
                  },
                  {
                    key: 'weeklyReport',
                    label: '每周报告',
                    desc: '每周一发送上周会议统计',
                  },
                ].map(item => (
                  <div
                    key={item.key}
                    className="p-4 rounded-xl bg-neutral-50/50 flex items-center justify-between gap-4 hover:bg-primary-50/30 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium text-neutral-800">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                    <Toggle
                      checked={
                        notificationPrefs[item.key as keyof typeof notificationPrefs] as boolean
                      }
                      onChange={v =>
                        setNotificationPrefs({
                          ...notificationPrefs,
                          [item.key]: v,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
              <h3 className="text-sm font-bold text-neutral-800 mb-5 flex items-center gap-2">
                <Clock className="w-4 h-4 text-success-500" />
                提醒时间
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2 block">
                    会议提醒提前时长
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 30].map(m => (
                      <button
                        key={m}
                        onClick={() =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            reminderMinutes: m,
                          })
                        }
                        className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          notificationPrefs.reminderMinutes === m
                            ? 'bg-gradient-primary text-white shadow-md shadow-primary-500/30'
                            : 'bg-neutral-50 text-neutral-600 hover:bg-primary-50 hover:text-primary-600'
                        }`}
                      >
                        {m} 分钟
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 flex justify-end">
              <button
                onClick={() => showToast('通知偏好已保存')}
                className="btn-primary"
              >
                <Save className="w-4 h-4" />
                保存设置
              </button>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
                <h3 className="text-sm font-bold text-neutral-800 mb-5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-500" />
                  会议默认设置
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">
                      默认会议时长（分钟）
                    </label>
                    <input
                      type="number"
                      className="input-base"
                      value={systemConfig.defaultMeetingDuration}
                      onChange={e =>
                        setSystemConfig({
                          ...systemConfig,
                          defaultMeetingDuration: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">
                      最少参会人数
                    </label>
                    <input
                      type="number"
                      className="input-base"
                      value={systemConfig.minAttendees}
                      onChange={e =>
                        setSystemConfig({
                          ...systemConfig,
                          minAttendees: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">
                      最长可预订天数
                    </label>
                    <input
                      type="number"
                      className="input-base"
                      value={systemConfig.maxMeetingDays}
                      onChange={e =>
                        setSystemConfig({
                          ...systemConfig,
                          maxMeetingDays: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">
                      自动取消提前（小时）
                    </label>
                    <input
                      type="number"
                      className="input-base"
                      value={systemConfig.autoCancelHours}
                      onChange={e =>
                        setSystemConfig({
                          ...systemConfig,
                          autoCancelHours: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
                <h3 className="text-sm font-bold text-neutral-800 mb-5 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-accent-500" />
                  工作时间
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">
                        上班时间
                      </label>
                      <input
                        type="time"
                        className="input-base"
                        value={systemConfig.workingHoursStart}
                        onChange={e =>
                          setSystemConfig({
                            ...systemConfig,
                            workingHoursStart: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">
                        下班时间
                      </label>
                      <input
                        type="time"
                        className="input-base"
                        value={systemConfig.workingHoursEnd}
                        onChange={e =>
                          setSystemConfig({
                            ...systemConfig,
                            workingHoursEnd: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-3 pt-2">
                    {[
                      {
                        key: 'allowWeekendBooking',
                        label: '允许周末预订',
                        desc: '周六周日也可预订会议室',
                      },
                      {
                        key: 'enableConflictDetection',
                        label: '冲突检测',
                        desc: '预订时自动检测资源冲突',
                      },
                      {
                        key: 'enableSmartSuggestions',
                        label: '智能推荐',
                        desc: '提供最佳时段和会议室建议',
                      },
                    ].map(item => (
                      <div
                        key={item.key}
                        className="p-4 rounded-xl bg-neutral-50/50 flex items-center justify-between gap-4 hover:bg-primary-50/30 transition-colors"
                      >
                        <div>
                          <div className="text-sm font-medium text-neutral-800">
                            {item.label}
                          </div>
                          <div className="text-[10px] text-neutral-500 mt-0.5">
                            {item.desc}
                          </div>
                        </div>
                        <Toggle
                          checked={
                            systemConfig[
                              item.key as keyof typeof systemConfig
                            ] as boolean
                          }
                          onChange={v =>
                            setSystemConfig({
                              ...systemConfig,
                              [item.key]: v,
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => showToast('系统配置已保存')}
                className="btn-primary"
              >
                <Save className="w-4 h-4" />
                保存系统设置
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-12 h-7 rounded-full transition-all relative shrink-0 ${
        checked
          ? 'bg-gradient-primary shadow-md shadow-primary-500/30'
          : 'bg-neutral-200'
      }`}
    >
      <span
        className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  );
}
