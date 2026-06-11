import { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMeetingStore } from '@/store/useMeetingStore';
import StatusBadge from '@/components/common/StatusBadge';
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  List,
  LayoutGrid,
  ChevronDown,
} from 'lucide-react';
import type { Meeting, MeetingStatus } from '@/types';

type ViewType = 'list' | 'calendar';

const STATUS_OPTIONS: { value: 'all' | MeetingStatus; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'scheduled', label: '待开始' },
  { value: 'in-progress', label: '进行中' },
  { value: 'completed', label: '已结束' },
  { value: 'cancelled', label: '已取消' },
];

const PAGE_SIZE = 8;

export default function MeetingList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { meetings } = useMeetingStore();

  const initialStatus = (searchParams.get('status') as MeetingStatus | 'all') || 'all';

  const [status, setStatus] = useState<'all' | MeetingStatus>(initialStatus);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('to') || '');
  const [view, setView] = useState<ViewType>('list');
  const [page, setPage] = useState(1);

  const filteredMeetings = useMemo(() => {
    let result = [...meetings];

    if (status !== 'all') {
      result = result.filter(m => m.status === status);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        m =>
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.room.name.toLowerCase().includes(q)
      );
    }

    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      result = result.filter(m => new Date(m.startTime).getTime() >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59').getTime();
      result = result.filter(m => new Date(m.startTime).getTime() <= to);
    }

    result.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    return result;
  }, [meetings, status, search, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filteredMeetings.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedMeetings = filteredMeetings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const applyFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
    setPage(1);
  };

  const handleStatusChange = (v: typeof status) => {
    setStatus(v);
    applyFilter('status', v === 'all' ? '' : v);
  };

  const handleSearchChange = (v: string) => {
    setSearch(v);
    applyFilter('q', v);
  };

  const handleFromChange = (v: string) => {
    setDateFrom(v);
    applyFilter('from', v);
  };

  const handleToChange = (v: string) => {
    setDateTo(v);
    applyFilter('to', v);
  };

  const stats = {
    total: meetings.length,
    scheduled: meetings.filter(m => m.status === 'scheduled').length,
    completed: meetings.filter(m => m.status === 'completed').length,
    cancelled: meetings.filter(m => m.status === 'cancelled').length,
  };

  const formatTimeRange = (start: Date | string, end: Date | string) => {
    const s = typeof start === 'string' ? new Date(start) : start;
    const e = typeof end === 'string' ? new Date(end) : end;
    return `${s.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })} - ${e.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatDate = (d: Date | string) => {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-1">会议列表</h1>
          <p className="text-sm text-neutral-500">
            管理您的所有会议，支持多维度筛选和搜索
          </p>
        </div>
        <button
          onClick={() => navigate('/meetings/create')}
          className="btn-primary self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          发起新会议
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '全部会议', value: stats.total, color: 'from-primary-500 to-primary-600' },
          { label: '待开始', value: stats.scheduled, color: 'from-accent-500 to-accent-600' },
          { label: '已完成', value: stats.completed, color: 'from-success-500 to-success-600' },
          { label: '已取消', value: stats.cancelled, color: 'from-neutral-400 to-neutral-500' },
        ].map(s => (
          <div
            key={s.label}
            className="p-4 rounded-2xl bg-white border border-neutral-100 shadow-card hover:shadow-lg transition-shadow"
          >
            <div className="text-xs text-neutral-500 mb-2">{s.label}</div>
            <div
              className={`text-2xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-2xl bg-white border border-neutral-100 shadow-card space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="input-base pl-9"
              placeholder="搜索会议主题、描述、会议室..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              className="input-base sm:w-40"
              value={status}
              onChange={e => handleStatusChange(e.target.value as typeof status)}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <input
                type="date"
                className="input-base flex-1 sm:w-auto"
                value={dateFrom}
                onChange={e => handleFromChange(e.target.value)}
                placeholder="开始日期"
              />
              <input
                type="date"
                className="input-base flex-1 sm:w-auto"
                value={dateTo}
                onChange={e => handleToChange(e.target.value)}
                placeholder="结束日期"
              />
            </div>

            <div className="flex p-1 bg-neutral-100 rounded-xl shrink-0">
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition-all ${
                  view === 'list'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
                title="列表视图"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`p-2 rounded-lg transition-all ${
                  view === 'calendar'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
                title="日历视图"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {view === 'list' ? (
        <div className="rounded-2xl bg-white border border-neutral-100 shadow-card overflow-hidden">
          {pagedMeetings.length === 0 ? (
            <div className="p-16 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-neutral-200" />
              <h3 className="text-lg font-semibold text-neutral-700 mb-1">
                暂无匹配的会议
              </h3>
              <p className="text-sm text-neutral-400 mb-4">
                尝试调整筛选条件或发起新会议
              </p>
              <button
                onClick={() => navigate('/meetings/create')}
                className="btn-primary"
              >
                <Plus className="w-4 h-4" />
                发起会议
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-neutral-50/80 border-b border-neutral-100">
                      <th className="px-5 py-4 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        会议信息
                      </th>
                      <th className="px-5 py-4 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        时间
                      </th>
                      <th className="px-5 py-4 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        地点
                      </th>
                      <th className="px-5 py-4 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        参会
                      </th>
                      <th className="px-5 py-4 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-5 py-4 text-right text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {pagedMeetings.map(m => (
                      <tr
                        key={m.id}
                        className="group hover:bg-primary-50/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/meetings/${m.id}`)}
                      >
                        <td className="px-5 py-4">
                          <div className="max-w-xs">
                            <div className="text-sm font-semibold text-neutral-800 group-hover:text-primary-600 truncate mb-1">
                              {m.title}
                            </div>
                            <div className="text-[11px] text-neutral-500 line-clamp-1">
                              {m.description || '暂无描述'}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-xs text-neutral-600">
                            <Calendar className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                            <div>
                              <div className="font-medium text-neutral-700">
                                {formatDate(m.startTime)}
                              </div>
                              <div className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {formatTimeRange(m.startTime, m.endTime)} ·{' '}
                                {m.duration}min
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-xs">
                            <MapPin className="w-3.5 h-3.5 text-accent-400 shrink-0" />
                            <div>
                              <div className="font-medium text-neutral-700">
                                {m.room.name}
                              </div>
                              <div className="text-[10px] text-neutral-400">
                                {m.room.location}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1.5">
                              {m.attendees.slice(0, 3).map(a => (
                                <img
                                  key={a.userId}
                                  src={a.user.avatar}
                                  alt={a.user.name}
                                  className="w-6 h-6 rounded-full border-2 border-white object-cover shadow-sm"
                                />
                              ))}
                            </div>
                            <span className="text-[11px] text-neutral-600">
                              {m.attendees.filter(a => a.status === 'confirmed')
                                .length}
                              /{m.attendees.length}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={m.status} type="meeting" />
                          {m.priority === 'high' && (
                            <div className="mt-1">
                              <StatusBadge status="high" type="priority" />
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <Link
                            to={`/meetings/${m.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 text-[11px] font-semibold hover:bg-primary-100 transition-colors group-hover:shadow-sm"
                          >
                            查看详情
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="px-5 py-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs text-neutral-500">
                    共 <span className="font-semibold text-neutral-700">{filteredMeetings.length}</span> 条，
                    第 <span className="font-semibold text-primary-600">{currentPage}</span> / {totalPages} 页
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                            pageNum === currentPage
                              ? 'bg-gradient-primary text-white shadow-md shadow-primary-500/30'
                              : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <CalendarView meetings={filteredMeetings} onSelect={id => navigate(`/meetings/${id}`)} />
      )}
    </div>
  );
}

function CalendarView({
  meetings,
  onSelect,
}: {
  meetings: Meeting[];
  onSelect: (id: string) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const meetingsByDay = new Map<string, Meeting[]>();
  meetings.forEach(m => {
    const d = new Date(m.startTime);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!meetingsByDay.has(key)) meetingsByDay.set(key, []);
    meetingsByDay.get(key)!.push(m);
  });

  const isToday = (d: number) => {
    const today = new Date();
    return (
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  return (
    <div className="rounded-2xl bg-white border border-neutral-100 shadow-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-neutral-800">
          {year}年 {month + 1}月
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setCurrentMonth(new Date(year, month - 1, 1))
            }
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 h-8 rounded-lg flex items-center justify-center text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors"
          >
            今天
          </button>
          <button
            onClick={() =>
              setCurrentMonth(new Date(year, month + 1, 1))
            }
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div
            key={day}
            className="py-2 text-center text-[10px] font-semibold text-neutral-400"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, idx) => {
          if (!d) return <div key={idx} />;
          const key = `${year}-${month}-${d}`;
          const dayMeetings = meetingsByDay.get(key) || [];
          const today = isToday(d);

          return (
            <div
              key={idx}
              className={`min-h-[100px] p-2 rounded-xl border transition-all ${
                today
                  ? 'bg-gradient-primary/5 border-primary-200'
                  : 'bg-neutral-50/30 border-transparent hover:bg-primary-50/40 hover:border-primary-100'
              }`}
            >
              <div
                className={`text-xs font-semibold mb-2 ${
                  today ? 'text-primary-600' : 'text-neutral-600'
                }`}
              >
                <span
                  className={`inline-flex w-6 h-6 items-center justify-center rounded-lg ${
                    today ? 'bg-gradient-primary text-white' : ''
                  }`}
                >
                  {d}
                </span>
              </div>
              <div className="space-y-1">
                {dayMeetings.slice(0, 3).map(m => (
                  <button
                    key={m.id}
                    onClick={() => onSelect(m.id)}
                    className="w-full text-left px-1.5 py-1 rounded-md text-[10px] truncate transition-all hover:shadow-sm"
                    style={{
                      backgroundColor:
                        m.status === 'cancelled'
                          ? '#f1f5f9'
                          : m.status === 'completed'
                          ? '#f0fdf4'
                          : m.status === 'in-progress'
                          ? '#ecfeff'
                          : '#eff6ff',
                      color:
                        m.status === 'cancelled'
                          ? '#94a3b8'
                          : m.status === 'completed'
                          ? '#16a34a'
                          : m.status === 'in-progress'
                          ? '#06b6d4'
                          : '#2563eb',
                      fontWeight: 600,
                    }}
                  >
                    {m.title}
                  </button>
                ))}
                {dayMeetings.length > 3 && (
                  <div className="text-[10px] text-neutral-400 px-1.5">
                    +{dayMeetings.length - 3} 更多
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
