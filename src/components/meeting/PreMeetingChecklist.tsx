import { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  AlertTriangle,
  FileText,
  Paperclip,
  Users,
  Coffee,
  Monitor,
  Clock,
  X,
  Save,
} from 'lucide-react';
import type { Meeting, PreMeetingChecklistItem } from '@/types';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/utils/dateUtils';

interface PreMeetingChecklistProps {
  meeting: Meeting;
  onToggleItem?: (itemId: string, completed: boolean) => void;
  onAddItem?: (item: Omit<PreMeetingChecklistItem, 'id'>) => void;
  onRemoveItem?: (itemId: string) => void;
  isHost?: boolean;
}

const categoryConfig: Record<
  PreMeetingChecklistItem['category'],
  { icon: typeof FileText; label: string; color: string; bgColor: string; textColor: string }
> = {
  agenda: {
    icon: FileText,
    label: '议程准备',
    color: 'from-primary-500 to-primary-600',
    bgColor: 'bg-primary-50',
    textColor: 'text-primary-600',
  },
  material: {
    icon: Paperclip,
    label: '材料准备',
    color: 'from-accent-500 to-accent-600',
    bgColor: 'bg-accent-50',
    textColor: 'text-accent-600',
  },
  attendance: {
    icon: Users,
    label: '参会响应',
    color: 'from-success-500 to-success-600',
    bgColor: 'bg-success-50',
    textColor: 'text-success-600',
  },
  catering: {
    icon: Coffee,
    label: '餐饮准备',
    color: 'from-warning-500 to-warning-600',
    bgColor: 'bg-warning-50',
    textColor: 'text-warning-600',
  },
  device: {
    icon: Monitor,
    label: '设备准备',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
};

function getAutoDetectStatus(
  meeting: Meeting,
  category: PreMeetingChecklistItem['category']
): boolean {
  switch (category) {
    case 'agenda':
      return meeting.agenda.length > 0;
    case 'material':
      return meeting.materials.length > 0;
    case 'attendance': {
      if (meeting.attendees.length === 0) return false;
      const respondedCount = meeting.attendees.filter(a => a.status !== 'pending').length;
      return respondedCount / meeting.attendees.length >= 0.8;
    }
    case 'catering':
      return meeting.catering.length > 0 || meeting.cateringIds.length === 0;
    case 'device':
      return meeting.devices.length > 0 || meeting.deviceIds.length === 0;
    default:
      return false;
  }
}

function isWithin24Hours(startTime: Date): boolean {
  const now = new Date();
  const diff = new Date(startTime).getTime() - now.getTime();
  return diff > 0 && diff <= 24 * 60 * 60 * 1000;
}

export default function PreMeetingChecklist({
  meeting,
  onToggleItem,
  onAddItem,
  onRemoveItem,
  isHost = false,
}: PreMeetingChecklistProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<PreMeetingChecklistItem['category']>('agenda');

  const checklist = meeting.preMeetingChecklist ?? [];

  const itemsWithAutoStatus = checklist.map(item => ({
    ...item,
    completed: item.autoDetect ? getAutoDetectStatus(meeting, item.category) : item.completed,
  }));

  const completedCount = itemsWithAutoStatus.filter(item => item.completed).length;
  const totalCount = itemsWithAutoStatus.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const hasUncompletedItems = completedCount < totalCount;
  const showWarning = hasUncompletedItems && isWithin24Hours(meeting.startTime) && meeting.status === 'scheduled';

  const groupedItems = itemsWithAutoStatus.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PreMeetingChecklistItem[]>);

  const handleToggle = (item: PreMeetingChecklistItem) => {
    if (item.autoDetect || !isHost) return;
    onToggleItem?.(item.id, !item.completed);
  };

  const handleAddItem = () => {
    if (!newItemTitle.trim() || !isHost) return;

    onAddItem?.({
      category: newItemCategory,
      title: newItemTitle.trim(),
      description: newItemDescription.trim(),
      completed: false,
      autoDetect: false,
    });

    setNewItemTitle('');
    setNewItemDescription('');
    setShowAddForm(false);
  };

  const handleRemoveItem = (itemId: string) => {
    if (!isHost) return;
    onRemoveItem?.(itemId);
  };

  if (checklist.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
        <h3 className="text-sm font-bold text-neutral-800 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary-500" />
          会前准备清单
        </h3>
        <div className="text-center py-8 text-neutral-400">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">暂无待办项</p>
          {isHost && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary-50 text-primary-600 text-xs font-medium hover:bg-primary-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              添加待办
            </button>
          )}
        </div>

        {showAddForm && (
          <AddItemForm
            title={newItemTitle}
            description={newItemDescription}
            category={newItemCategory}
            onTitleChange={setNewItemTitle}
            onDescriptionChange={setNewItemDescription}
            onCategoryChange={setNewItemCategory}
            onSubmit={handleAddItem}
            onCancel={() => setShowAddForm(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card animate-fade-in">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-neutral-800 mb-1 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-500" />
            会前准备清单
          </h3>
          <p className="text-xs text-neutral-400">
            完成 {completedCount} / {totalCount} 项
          </p>
        </div>
        {isHost && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={cn(
              'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              showAddForm
                ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
            )}
          >
            {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showAddForm ? '取消' : '添加待办'}
          </button>
        )}
      </div>

      {showWarning && (
        <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-danger-500 to-rose-500 text-white animate-pulse-once">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">⚠️ 会议将在24小时内开始，还有 {totalCount - completedCount} 项待办未完成</p>
              <p className="text-xs text-white/80 mt-0.5">请尽快完成会前准备工作</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-neutral-500">完成进度</span>
          <span className="text-xs font-bold text-neutral-700">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-accent rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {showAddForm && (
        <div className="mb-5">
          <AddItemForm
            title={newItemTitle}
            description={newItemDescription}
            category={newItemCategory}
            onTitleChange={setNewItemTitle}
            onDescriptionChange={setNewItemDescription}
            onCategoryChange={setNewItemCategory}
            onSubmit={handleAddItem}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      <div className="space-y-4">
        {(Object.keys(categoryConfig) as PreMeetingChecklistItem['category'][]).map(category => {
          const items = groupedItems[category] ?? [];
          if (items.length === 0) return null;

          const config = categoryConfig[category];
          const Icon = config.icon;
          const categoryCompleted = items.filter(i => i.completed).length;
          const categoryTotal = items.length;

          return (
            <div key={category} className="animate-slide-up">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('w-6 h-6 rounded-lg bg-gradient-to-r flex items-center justify-center', config.color)}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className={cn('text-xs font-bold', config.textColor)}>
                  {config.label}
                </span>
                <span className="text-xs text-neutral-400">
                  ({categoryCompleted}/{categoryTotal})
                </span>
              </div>

              <div className="space-y-2 ml-8">
                {items.map(item => (
                  <ChecklistItem
                    key={item.id}
                    item={item}
                    onToggle={() => handleToggle(item)}
                    onRemove={() => handleRemoveItem(item.id)}
                    isHost={isHost}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChecklistItem({
  item,
  onToggle,
  onRemove,
  isHost,
}: {
  item: PreMeetingChecklistItem;
  onToggle: () => void;
  onRemove: () => void;
  isHost: boolean;
}) {
  return (
    <div
      className={cn(
        'group flex items-start gap-3 p-3 rounded-xl border transition-all',
        item.completed
          ? 'bg-neutral-50 border-neutral-100'
          : 'bg-white border-neutral-200 hover:border-primary-200 hover:bg-primary-50/30'
      )}
    >
      <button
        onClick={onToggle}
        disabled={item.autoDetect || !isHost}
        className={cn(
          'mt-0.5 shrink-0 transition-colors',
          item.autoDetect || !isHost ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'
        )}
      >
        {item.completed ? (
          <CheckCircle2 className="w-5 h-5 text-success-500" />
        ) : (
          <Circle className="w-5 h-5 text-neutral-300" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm font-medium',
            item.completed ? 'text-neutral-400 line-through' : 'text-neutral-700'
          )}>
            {item.title}
          </p>
          {item.autoDetect && (
            <span className="shrink-0 px-2 py-0.5 rounded-md bg-accent-50 text-accent-600 text-[10px] font-medium">
              自动检测
            </span>
          )}
        </div>
        {item.description && (
          <p className={cn(
            'text-xs mt-1',
            item.completed ? 'text-neutral-300' : 'text-neutral-400'
          )}>
            {item.description}
          </p>
        )}
        {item.completed && item.completedAt && (
          <div className="flex items-center gap-1 mt-2 text-[10px] text-neutral-400">
            <Clock className="w-3 h-3" />
            <span>{formatDateTime(new Date(item.completedAt))}</span>
          </div>
        )}
      </div>

      {isHost && !item.autoDetect && (
        <button
          onClick={onRemove}
          className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg hover:bg-danger-50 flex items-center justify-center text-neutral-400 hover:text-danger-500 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function AddItemForm({
  title,
  description,
  category,
  onTitleChange,
  onDescriptionChange,
  onCategoryChange,
  onSubmit,
  onCancel,
}: {
  title: string;
  description: string;
  category: PreMeetingChecklistItem['category'];
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: PreMeetingChecklistItem['category']) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="p-4 rounded-xl bg-primary-50/50 border border-primary-100 animate-slide-up">
      <h4 className="text-xs font-bold text-primary-700 mb-3">添加待办项</h4>

      <div className="space-y-3">
        <div>
          <label className="block text-[10px] font-medium text-neutral-500 mb-1">分类</label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(categoryConfig) as PreMeetingChecklistItem['category'][]).map(cat => {
              const config = categoryConfig[cat];
              const Icon = config.icon;
              return (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all',
                    category === cat
                      ? cn('bg-gradient-to-r', config.color, 'text-white shadow-sm')
                      : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-medium text-neutral-500 mb-1">标题 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="输入待办标题..."
            className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
          />
        </div>

        <div>
          <label className="block text-[10px] font-medium text-neutral-500 mb-1">描述（可选）</label>
          <input
            type="text"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="输入详细描述..."
            className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:bg-white transition-colors"
          >
            取消
          </button>
          <button
            onClick={onSubmit}
            disabled={!title.trim()}
            className={cn(
              'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              title.trim()
                ? 'bg-gradient-accent text-white hover:opacity-90'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            )}
          >
            <Save className="w-3 h-3" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
