import { useState } from 'react';
import { Plus, ChevronUp, ChevronDown, Pencil, Trash2, Clock, User as UserIcon, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgendaItem, User } from '@/types';
import { formatDuration } from '@/utils/formatters';

interface AgendaPanelProps {
  meetingId?: string;
  agenda: AgendaItem[];
  users?: User[];
  onAdd?: (item: Omit<AgendaItem, 'id'>) => void;
  onUpdate?: (agendaId: string, updates: Partial<Omit<AgendaItem, 'id'>>) => void;
  onRemove?: (agendaId: string) => void;
  onReorder?: (agendaId: string, direction: 'up' | 'down') => void;
  readOnly?: boolean;
}

interface FormState {
  title: string;
  duration: number;
  presenterId: string;
  editingId: string | null;
}

export default function AgendaPanel({
  agenda,
  users = [],
  onAdd,
  onUpdate,
  onRemove,
  onReorder,
  readOnly = false,
}: AgendaPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    title: '',
    duration: 15,
    presenterId: '',
    editingId: null,
  });

  const totalDuration = agenda.reduce((sum, item) => sum + item.duration, 0);

  const handleSubmit = () => {
    if (!formState.title.trim()) return;

    if (formState.editingId) {
      onUpdate(formState.editingId, {
        title: formState.title,
        duration: formState.duration,
        presenterId: formState.presenterId || undefined,
      });
    } else {
      onAdd({
        title: formState.title,
        duration: formState.duration,
        presenterId: formState.presenterId || undefined,
        order: agenda.length + 1,
      });
    }

    setFormState({ title: '', duration: 15, presenterId: '', editingId: null });
    setShowForm(false);
  };

  const handleEdit = (item: AgendaItem) => {
    setFormState({
      title: item.title,
      duration: item.duration,
      presenterId: item.presenterId || '',
      editingId: item.id,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormState({ title: '', duration: 15, presenterId: '', editingId: null });
    setShowForm(false);
  };

  const getPresenter = (presenterId?: string) =>
    users.find((u) => u.id === presenterId);

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-neutral-100">
      <div className="px-6 py-4 bg-gradient-primary flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">会议议程</h3>
          <p className="text-primary-100 text-sm mt-0.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            总时长：{formatDuration(totalDuration)}
          </p>
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              showForm
                ? 'bg-white/20 text-white'
                : 'bg-white text-primary-600 hover:bg-primary-50'
            )}
          >
            <Plus className="w-4 h-4" />
            {showForm ? '取消' : '添加议程'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="px-6 py-4 bg-accent-50/50 border-b border-accent-100 animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <label className="block text-sm font-medium text-neutral-600 mb-1.5">
                议程标题
              </label>
              <input
                type="text"
                value={formState.title}
                onChange={(e) =>
                  setFormState({ ...formState, title: e.target.value })
                }
                placeholder="请输入议程标题"
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 outline-none transition-all text-sm"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-neutral-600 mb-1.5">
                时长（分钟）
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={formState.duration}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    duration: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 outline-none transition-all text-sm"
              />
            </div>
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-neutral-600 mb-1.5">
                主讲人
              </label>
              <select
                value={formState.presenterId}
                onChange={(e) =>
                  setFormState({ ...formState, presenterId: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-200 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 outline-none transition-all text-sm bg-white"
              >
                <option value="">请选择主讲人</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.department}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-all text-sm font-medium"
            >
              <X className="w-4 h-4" />
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formState.title.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-accent text-white hover:shadow-glow transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              {formState.editingId ? '保存修改' : '添加'}
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-neutral-100">
        {agenda.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Clock className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
            <p className="text-neutral-400 text-sm">暂无议程，点击上方按钮添加</p>
          </div>
        ) : (
          agenda.map((item, index) => {
            const presenter = getPresenter(item.presenterId);
            return (
              <div
                key={item.id}
                className="px-6 py-4 hover:bg-neutral-50/50 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-neutral-800 font-medium mb-2">
                      {item.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-neutral-500">
                        <Clock className="w-3.5 h-3.5 text-accent-500" />
                        {formatDuration(item.duration)}
                      </span>
                      {presenter && (
                        <span className="flex items-center gap-1.5 text-neutral-500">
                          <UserIcon className="w-3.5 h-3.5 text-primary-500" />
                          <span className="flex items-center gap-1.5">
                            <img
                              src={presenter.avatar}
                              alt={presenter.name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            {presenter.name}
                            <span className="text-neutral-400">
                              ({presenter.department})
                            </span>
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={cn(
                    'flex-shrink-0 flex items-center gap-1 transition-opacity',
                    readOnly ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'
                  )}>
                    <button
                      onClick={() => onReorder(item.id, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg text-neutral-400 hover:bg-primary-50 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="上移"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onReorder(item.id, 'down')}
                      disabled={index === agenda.length - 1}
                      className="p-1.5 rounded-lg text-neutral-400 hover:bg-primary-50 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="下移"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:bg-accent-50 hover:text-accent-600 transition-all"
                      title="编辑"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRemove(item.id)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:bg-danger-50 hover:text-danger-500 transition-all"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
