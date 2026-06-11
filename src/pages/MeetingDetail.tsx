import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMeetingStore } from '@/store/useMeetingStore';
import { useResourceStore } from '@/store/useResourceStore';
import { useUserStore } from '@/store/useUserStore';
import StatusBadge from '@/components/common/StatusBadge';
import AgendaPanel from '@/components/meeting/AgendaPanel';
import MaterialPanel from '@/components/meeting/MaterialPanel';
import AttendanceGrid from '@/components/meeting/AttendanceGrid';
import ResourceAdjuster from '@/components/meeting/ResourceAdjuster';
import PreMeetingChecklist from '@/components/meeting/PreMeetingChecklist';
import { AlertTriangle } from 'lucide-react';
import {
  Clock,
  MapPin,
  Users,
  Play,
  Square,
  Edit3,
  XCircle,
  ArrowLeft,
  Calendar,
  Info,
  FileText,
  ClipboardList,
  UserCheck,
  Settings2,
  Plus,
  Save,
} from 'lucide-react';
import type { MeetingStatus, AttendanceStatus } from '@/types';

type TabType = 'overview' | 'agenda' | 'attendance' | 'resources';

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getMeetingById,
    updateMeetingStatus,
    addAgendaItem,
    removeAgendaItem,
    addDecision,
    adjustResources,
    updateAttendanceStatus,
    toggleChecklistItem,
    addChecklistItem,
    removeChecklistItem,
    addMaterial,
    removeMaterial,
    setMaterialLatestVersion,
  } = useMeetingStore();
  const { rooms, devices, cateringOptions } = useResourceStore();
  const { users, currentUser } = useUserStore();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [newDecision, setNewDecision] = useState('');
  const [showDecisionInput, setShowDecisionInput] = useState(false);

  const meeting = id ? getMeetingById(id) : undefined;

  const isHost = currentUser
    ? meeting?.attendees.some(a => a.userId === currentUser.id && a.isHost) ?? false
    : false;

  const checklist = meeting?.preMeetingChecklist ?? [];
  const hasUncompletedItems = checklist.some(item => {
    if (item.autoDetect) {
      switch (item.category) {
        case 'agenda':
          return (meeting?.agenda.length ?? 0) === 0;
        case 'material':
          return (meeting?.materials.length ?? 0) === 0;
        case 'attendance': {
          const total = meeting?.attendees.length ?? 0;
          if (total === 0) return true;
          const responded = meeting?.attendees.filter(a => a.status !== 'pending').length ?? 0;
          return responded / total < 0.8;
        }
        case 'catering':
          return (meeting?.catering.length ?? 0) === 0 && (meeting?.cateringIds.length ?? 0) > 0;
        case 'device':
          return (meeting?.devices.length ?? 0) === 0 && (meeting?.deviceIds.length ?? 0) > 0;
        default:
          return false;
      }
    }
    return !item.completed;
  });

  const isWithin24Hours = meeting
    ? (() => {
        const now = new Date();
        const diff = new Date(meeting.startTime).getTime() - now.getTime();
        return diff > 0 && diff <= 24 * 60 * 60 * 1000;
      })()
    : false;

  const showTopWarning = hasUncompletedItems && isWithin24Hours && meeting?.status === 'scheduled';

  const handleToggleChecklistItem = (itemId: string, completed: boolean) => {
    if (!meeting || !currentUser) return;
    toggleChecklistItem(meeting.id, itemId, completed, currentUser.id);
  };

  const handleAddChecklistItem = (item: Omit<import('@/types').PreMeetingChecklistItem, 'id'>) => {
    if (!meeting) return;
    addChecklistItem(meeting.id, item);
  };

  const handleRemoveChecklistItem = (itemId: string) => {
    if (!meeting) return;
    removeChecklistItem(meeting.id, itemId);
  };

  if (!meeting) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-6">
          <Calendar className="w-12 h-12 text-neutral-300" />
        </div>
        <h2 className="text-xl font-bold text-neutral-800 mb-2">会议不存在</h2>
        <p className="text-sm text-neutral-500 mb-6">可能已被取消或链接有误</p>
        <Link to="/meetings" className="btn-primary inline-flex">
          <ArrowLeft className="w-4 h-4" />
          返回会议列表
        </Link>
      </div>
    );
  }

  const startTime = new Date(meeting.startTime);
  const endTime = new Date(meeting.endTime);
  const duration = meeting.duration;

  const confirmedCount = meeting.attendees.filter(
    a => a.status === 'confirmed'
  ).length;
  const attendanceRate = Math.round(
    (confirmedCount / meeting.attendees.length) * 100
  );

  const tabs: { id: TabType; label: string; icon: typeof Info }[] = [
    { id: 'overview', label: '概览', icon: Info },
    { id: 'agenda', label: '议程材料', icon: FileText },
    { id: 'attendance', label: '出席情况', icon: UserCheck },
    { id: 'resources', label: '资源配置', icon: Settings2 },
  ];

  const handleStatusChange = (status: MeetingStatus) => {
    updateMeetingStatus(meeting.id, status);
  };

  const handleAddDecision = () => {
    if (!newDecision.trim()) return;
    addDecision(meeting.id, newDecision.trim());
    setNewDecision('');
    setShowDecisionInput(false);
  };

  const handleAttendanceChange = (userId: string, status: AttendanceStatus) => {
    updateAttendanceStatus(meeting.id, userId, status);
  };

  const handleResourceSave = (
    roomId: string,
    deviceIds: string[],
    cateringIds: string[]
  ) => {
    adjustResources(meeting.id, deviceIds, cateringIds);
  };

  const cateringCost = meeting.catering.reduce(
    (sum, c) => sum + c.pricePerPerson * meeting.expectedAttendees,
    0
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="btn-ghost -ml-2"
      >
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>

      {showTopWarning && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-danger-500 to-rose-500 text-white animate-pulse-once">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">
                ⚠️ 会议将在24小时内开始，还有未完成的会前准备项
              </p>
              <p className="text-xs text-white/80 mt-0.5">
                请尽快完成会前准备工作，确保会议顺利进行
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-gradient-primary text-white relative overflow-hidden shadow-card">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 left-20 w-40 h-40 rounded-full bg-accent-500/10" />

        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <StatusBadge status={meeting.status} type="meeting" />
                <StatusBadge status={meeting.priority} type="priority" />
              </div>
              <h1 className="text-2xl font-bold mb-2">{meeting.title}</h1>
              <p className="text-white/80 text-sm max-w-2xl leading-relaxed">
                {meeting.description || '暂无会议描述'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              {meeting.status === 'scheduled' && (
                <>
                  <button
                    onClick={() => handleStatusChange('in-progress')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-500 text-white text-xs font-semibold hover:bg-accent-600 transition-colors shadow-lg shadow-accent-500/30"
                  >
                    <Play className="w-3.5 h-3.5" />
                    开始会议
                  </button>
                  <Link
                    to={`/meetings/${meeting.id}/edit`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 backdrop-blur text-white text-xs font-semibold hover:bg-white/20 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    编辑
                  </Link>
                  <button
                    onClick={() => handleStatusChange('cancelled')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 backdrop-blur text-white/90 text-xs font-semibold hover:bg-danger-500 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    取消
                  </button>
                </>
              )}
              {meeting.status === 'in-progress' && (
                <button
                  onClick={() => handleStatusChange('completed')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-success-500 text-white text-xs font-semibold hover:bg-success-600 transition-colors shadow-lg shadow-success-500/30"
                >
                  <Square className="w-3.5 h-3.5" />
                  结束会议
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-white/60 mb-0.5">时间</div>
                <div className="text-sm font-semibold">
                  {startTime.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  -{' '}
                  {endTime.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="text-[10px] text-white/50">
                  共 {duration} 分钟 ·{' '}
                  {startTime.toLocaleDateString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short',
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-white/60 mb-0.5">地点</div>
                <div className="text-sm font-semibold truncate">
                  {meeting.room.name}
                </div>
                <div className="text-[10px] text-white/50">
                  {meeting.room.location} · {meeting.room.floor}F
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-white/60 mb-0.5">出席情况</div>
                <div className="text-sm font-semibold">
                  {confirmedCount}/{meeting.attendees.length} 人
                </div>
                <div className="text-[10px] text-white/50">
                  出席率 {attendanceRate}%
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-white/60 mb-0.5">材料</div>
                <div className="text-sm font-semibold">
                  {meeting.materials.length} 份
                </div>
                <div className="text-[10px] text-white/50">
                  {meeting.agenda.length} 项议程
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-1 rounded-2xl bg-white border border-neutral-100 shadow-card">
        <div className="flex p-1 gap-1 bg-neutral-50 rounded-xl mb-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
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
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <PreMeetingChecklist
                meeting={meeting}
                onToggleItem={handleToggleChecklistItem}
                onAddItem={handleAddChecklistItem}
                onRemoveItem={handleRemoveChecklistItem}
                isHost={isHost}
              />

              <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
                <h3 className="text-sm font-bold text-neutral-800 mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary-500" />
                  基本信息
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-[10px] text-neutral-400 mb-1">会议时长</div>
                    <div className="font-medium text-neutral-700">
                      {Math.floor(duration / 60) > 0
                        ? `${Math.floor(duration / 60)}小时${duration % 60}分`
                        : `${duration}分钟`}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400 mb-1">预计人数</div>
                    <div className="font-medium text-neutral-700">
                      {meeting.expectedAttendees} 人
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400 mb-1">会议设备</div>
                    <div className="font-medium text-neutral-700">
                      {meeting.devices.length} 台
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400 mb-1">餐饮服务</div>
                    <div className="font-medium text-accent-600">
                      ¥{cateringCost}
                    </div>
                  </div>
                </div>

                {meeting.devices.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-neutral-100">
                    <div className="text-[10px] text-neutral-400 mb-2">
                      使用设备清单
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {meeting.devices.map(d => (
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

                {meeting.catering.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-neutral-100">
                    <div className="text-[10px] text-neutral-400 mb-2">
                      餐饮安排
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {meeting.catering.map(c => (
                        <span
                          key={c.id}
                          className="px-2.5 py-1 rounded-lg bg-warning-50 text-[10px] font-medium text-warning-600"
                        >
                          {c.name}（¥{c.pricePerPerson}/人）
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-accent-500" />
                    关键决策记录
                  </h3>
                  <button
                    onClick={() => setShowDecisionInput(!showDecisionInput)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent-50 text-accent-600 text-xs font-medium hover:bg-accent-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    添加记录
                  </button>
                </div>

                {showDecisionInput && (
                  <div className="mb-4 p-3 rounded-xl bg-accent-50 border border-accent-100 animate-slide-up">
                    <textarea
                      className="w-full p-3 rounded-lg bg-white border border-accent-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-400"
                      rows={2}
                      placeholder="输入决策内容..."
                      value={newDecision}
                      onChange={e => setNewDecision(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => setShowDecisionInput(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:bg-white transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleAddDecision}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent-500 text-white text-xs font-medium hover:bg-accent-600 transition-colors"
                      >
                        <Save className="w-3 h-3" />
                        保存
                      </button>
                    </div>
                  </div>
                )}

                {meeting.decisions.length === 0 ? (
                  <div className="text-center py-8 text-neutral-400">
                    <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">暂无决策记录</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {meeting.decisions.map((decision, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-neutral-50 border-l-4 border-accent-400 hover:bg-primary-50/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-lg bg-gradient-accent text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <p className="text-sm text-neutral-700 leading-relaxed">
                            {decision}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
                <h3 className="text-sm font-bold text-neutral-800 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary-500" />
                  资源使用摘要
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-primary-50/50">
                    <span className="text-xs text-neutral-600">会议室</span>
                    <span className="text-xs font-semibold text-primary-600">
                      {meeting.room.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-accent-50/50">
                    <span className="text-xs text-neutral-600">设备数</span>
                    <span className="text-xs font-semibold text-accent-600">
                      {meeting.devices.length} 台
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-warning-50/50">
                    <span className="text-xs text-neutral-600">餐饮支出</span>
                    <span className="text-xs font-semibold text-warning-600">
                      ¥{cateringCost}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-success-50/50">
                    <span className="text-xs text-neutral-600">出席率</span>
                    <span className="text-xs font-semibold text-success-600">
                      {attendanceRate}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 border border-primary-100">
                <h3 className="text-sm font-bold text-neutral-800 mb-3">参会人</h3>
                <div className="flex -space-x-2 mb-3">
                  {meeting.attendees.slice(0, 5).map(a => (
                    <img
                      key={a.userId}
                      src={a.user.avatar}
                      alt={a.user.name}
                      className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm"
                      title={`${a.user.name} - ${a.status}`}
                    />
                  ))}
                  {meeting.attendees.length > 5 && (
                    <div className="w-9 h-9 rounded-full border-2 border-white bg-primary-500 text-white text-[10px] font-semibold flex items-center justify-center shadow-sm">
                      +{meeting.attendees.length - 5}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="w-full py-2 rounded-lg bg-white/80 backdrop-blur text-xs font-semibold text-primary-600 hover:bg-white transition-colors"
                >
                  查看详情 →
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'agenda' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
              <AgendaPanel
                agenda={meeting.agenda}
                users={users}
                onAdd={item => addAgendaItem(meeting.id, item)}
                onRemove={id => removeAgendaItem(meeting.id, id)}
                readOnly={false}
              />
            </div>
            <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
              <MaterialPanel
                materials={meeting.materials}
                users={users}
                onAdd={material => addMaterial(meeting.id, material)}
                onRemove={materialId => removeMaterial(meeting.id, materialId)}
                onSetLatest={materialId => setMaterialLatestVersion(meeting.id, materialId)}
                readOnly={false}
              />
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
            <AttendanceGrid
              attendees={meeting.attendees}
              onStatusChange={handleAttendanceChange}
              readOnly={false}
            />
          </div>
        )}

        {activeTab === 'resources' && (
          <ResourceAdjuster
            room={meeting.room}
            devices={meeting.devices}
            catering={meeting.catering}
            availableRooms={rooms}
            availableDevices={devices}
            availableCatering={cateringOptions}
            expectedAttendees={meeting.expectedAttendees}
            onSave={handleResourceSave}
          />
        )}
      </div>
    </div>
  );
}
