import type { Meeting, ReportType, ReportFormat, ReportOptions } from '@/types';
import {
  Calendar,
  Users,
  Monitor,
  FileText,
  Wallet,
  Download,
  Check,
  ChevronDown,
  Search,
  X,
  RefreshCw,
  CheckCheck,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface ReportContentOptions {
  attendanceRate: boolean;
  resourceEfficiency: boolean;
  decisionRecords: boolean;
  costDetails: boolean;
}

export interface ReportGeneratorConfig {
  startDate: string;
  endDate: string;
  selectedMeetingIds: string[];
  content: ReportContentOptions;
}

interface NewReportGeneratorProps {
  meetings: Meeting[];
  onGenerate?: (config: ReportGeneratorConfig) => void;
}

interface LegacyReportGeneratorProps {
  reportType?: ReportType;
  format?: ReportFormat;
  startDate?: string;
  endDate?: string;
  options?: ReportOptions;
  onReportTypeChange?: (type: ReportType) => void;
  onFormatChange?: (format: ReportFormat) => void;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  onOptionToggle?: (key: keyof ReportOptions) => void;
  onOptionsChange?: (options: ReportOptions) => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

type ReportGeneratorProps = NewReportGeneratorProps | LegacyReportGeneratorProps;

function isLegacy(props: ReportGeneratorProps): props is LegacyReportGeneratorProps {
  return 'reportType' in props || 'isGenerating' in props;
}

interface QuickRange {
  id: string;
  label: string;
  getRange: () => { start: string; end: string };
}

const today = new Date();
const formatDate = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, days: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
};
const startOfWeek = (d: Date) => {
  const r = new Date(d);
  const day = r.getDay() || 7;
  if (day !== 1) r.setHours(-24 * (day - 1));
  r.setHours(0, 0, 0, 0);
  return r;
};
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

const quickRanges: QuickRange[] = [
  {
    id: '7d',
    label: '近 7 天',
    getRange: () => ({
      start: formatDate(addDays(today, -6)),
      end: formatDate(today),
    }),
  },
  {
    id: '30d',
    label: '近 30 天',
    getRange: () => ({
      start: formatDate(addDays(today, -29)),
      end: formatDate(today),
    }),
  },
  {
    id: 'week',
    label: '本周',
    getRange: () => ({
      start: formatDate(startOfWeek(today)),
      end: formatDate(today),
    }),
  },
  {
    id: 'month',
    label: '本月',
    getRange: () => ({
      start: formatDate(startOfMonth(today)),
      end: formatDate(today),
    }),
  },
  {
    id: 'lastMonth',
    label: '上月',
    getRange: () => {
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        start: formatDate(lastMonthStart),
        end: formatDate(lastMonthEnd),
      };
    },
  },
];

const contentOptions: Array<{
  key: keyof ReportContentOptions;
  label: string;
  desc: string;
  icon: typeof Users;
  color: string;
}> = [
  {
    key: 'attendanceRate',
    label: '出席率统计',
    desc: '参会人员出席/迟到/缺席情况',
    icon: Users,
    color: 'primary',
  },
  {
    key: 'resourceEfficiency',
    label: '资源效率',
    desc: '会议室与设备利用率分析',
    icon: Monitor,
    color: 'accent',
  },
  {
    key: 'decisionRecords',
    label: '决策记录',
    desc: '会议决议与待办事项汇总',
    icon: FileText,
    color: 'success',
  },
  {
    key: 'costDetails',
    label: '成本明细',
    desc: '餐饮与运营支出统计',
    icon: Wallet,
    color: 'warning',
  },
];

export default function ReportGenerator(props: ReportGeneratorProps) {
  if (isLegacy(props)) {
    return <LegacyReportGenerator {...props} />;
  }
  return <NewReportGenerator {...props} />;
}

function LegacyReportGenerator({
  reportType = 'utilization',
  format = 'pdf',
  startDate,
  endDate,
  options = { includeSummary: true, includeDetail: true, includeCharts: true, includeRoomStats: true, includeDeviceStats: true },
  onReportTypeChange,
  onFormatChange,
  onStartDateChange,
  onEndDateChange,
  onOptionToggle,
  onOptionsChange,
  onGenerate,
  isGenerating = false,
}: LegacyReportGeneratorProps) {
  const types: { value: ReportType; label: string; icon: typeof FileText }[] = [
    { value: 'utilization', label: '利用率报告', icon: Monitor },
    { value: 'attendance', label: '出席统计报告', icon: Users },
    { value: 'devices', label: '设备分析报告', icon: Monitor },
    { value: 'operations', label: '运营报告', icon: FileText },
  ];
  const formats: { value: ReportFormat; label: string }[] = [
    { value: 'pdf', label: 'PDF' },
    { value: 'xlsx', label: 'Excel' },
  ];
  const optionKeys = Object.keys(options) as Array<keyof ReportOptions>;
  const optionLabels: Record<keyof ReportOptions, string> = {
    includeSummary: '包含汇总',
    includeDetail: '包含明细',
    includeCharts: '包含图表',
    includeRoomStats: '会议室统计',
    includeDeviceStats: '设备统计',
  };

  const handleOptionClick = (key: keyof ReportOptions) => {
    const newOptions = { ...options, [key]: !options[key] };
    onOptionsChange?.(newOptions);
    onOptionToggle?.(key);
  };

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-neutral-100">
      <div className="px-6 py-4 bg-gradient-primary">
        <h3 className="text-white font-semibold text-lg">报表生成器</h3>
        <p className="text-primary-100 text-sm mt-0.5">自定义参数生成会议报表</p>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-2">报表类型</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {types.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => onReportTypeChange?.(value)}
                className={cn(
                  'p-3 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1.5 text-center',
                  reportType === value
                    ? 'bg-gradient-accent text-white shadow-md'
                    : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1.5">开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange?.(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 outline-none transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1.5">结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange?.(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 outline-none transition-all text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-2">导出格式</label>
          <div className="flex gap-2">
            {formats.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onFormatChange?.(value)}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-medium transition-all',
                  format === value
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-2">报表内容</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {optionKeys.map((key) => (
              <button
                key={key}
                onClick={() => handleOptionClick(key)}
                className={cn(
                  'p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between',
                  options[key]
                    ? 'bg-success-50 text-success-700 border border-success-200'
                    : 'bg-neutral-50 text-neutral-500 border border-transparent'
                )}
              >
                <span>{optionLabels[key]}</span>
                {options[key] && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-accent text-white font-medium text-sm hover:shadow-glow transition-all disabled:opacity-50 shadow-md"
        >
          {isGenerating ? (
            <><RefreshCw className="w-4 h-4 animate-spin" />正在生成报表...</>
          ) : (
            <><Download className="w-4 h-4" />生成报表</>
          )}
        </button>
      </div>
    </div>
  );
}

function NewReportGenerator({
  meetings,
  onGenerate,
}: NewReportGeneratorProps) {
  const [activeQuickRange, setActiveQuickRange] = useState<string>('30d');
  const [startDate, setStartDate] = useState<string>(
    quickRanges[1].getRange().start
  );
  const [endDate, setEndDate] = useState<string>(
    quickRanges[1].getRange().end
  );
  const [selectedMeetingIds, setSelectedMeetingIds] = useState<string[]>([]);
  const [content, setContent] = useState<ReportContentOptions>({
    attendanceRate: true,
    resourceEfficiency: true,
    decisionRecords: false,
    costDetails: true,
  });
  const [showMeetingDropdown, setShowMeetingDropdown] = useState(false);
  const [meetingSearch, setMeetingSearch] = useState('');
  const [generating, setGenerating] = useState(false);

  const filteredMeetings = meetings.filter((m) => {
    const d = new Date(m.startTime);
    const ds = formatDate(d);
    const inRange = ds >= startDate && ds <= endDate;
    const matchSearch = m.title
      .toLowerCase()
      .includes(meetingSearch.toLowerCase());
    return inRange && matchSearch;
  });

  const handleQuickRange = (range: QuickRange) => {
    const { start, end } = range.getRange();
    setActiveQuickRange(range.id);
    setStartDate(start);
    setEndDate(end);
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    setActiveQuickRange('');
    if (type === 'start') setStartDate(value);
    else setEndDate(value);
  };

  const toggleMeeting = (id: string) => {
    setSelectedMeetingIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const toggleAllMeetings = () => {
    if (selectedMeetingIds.length === filteredMeetings.length) {
      setSelectedMeetingIds([]);
    } else {
      setSelectedMeetingIds(filteredMeetings.map((m) => m.id));
    }
  };

  const toggleContent = (key: keyof ReportContentOptions) => {
    setContent((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const anyContentSelected = Object.values(content).some(Boolean);

  const handleGenerate = async () => {
    if (
      !anyContentSelected ||
      selectedMeetingIds.length === 0 ||
      !startDate ||
      !endDate
    )
      return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));
    onGenerate?.({
      startDate,
      endDate,
      selectedMeetingIds,
      content,
    });
    setGenerating(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-neutral-100">
      <div className="px-6 py-4 bg-gradient-primary flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            报表生成器
          </h3>
          <p className="text-primary-100 text-sm mt-0.5">
            配置选项，生成自定义会议分析报告
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent-500" />
            时间范围
          </h4>

          <div className="grid grid-cols-5 gap-2 mb-3">
            {quickRanges.map((range) => {
              const isActive = activeQuickRange === range.id;
              return (
                <button
                  key={range.id}
                  onClick={() => handleQuickRange(range)}
                  className={cn(
                    'py-2 rounded-xl text-xs font-medium transition-all border-2',
                    isActive
                      ? 'border-accent-400 bg-accent-50/60 text-accent-700 shadow-sm'
                      : 'border-neutral-100 bg-neutral-50/50 text-neutral-500 hover:border-neutral-200 hover:bg-neutral-50'
                  )}
                >
                  {range.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleDateChange('start', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 outline-none transition-all text-sm"
              />
            </div>
            <span className="text-neutral-400 text-sm font-medium">至</span>
            <div className="flex-1">
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleDateChange('end', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 outline-none transition-all text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-500" />
            会议筛选
            <span className="text-xs text-neutral-400 font-normal ml-1">
              ({filteredMeetings.length} 场会议可选择)
            </span>
          </h4>

          <div className="relative">
            <button
              onClick={() => setShowMeetingDropdown(!showMeetingDropdown)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all',
                showMeetingDropdown
                  ? 'border-accent-400 ring-2 ring-accent-100'
                  : 'border-neutral-200 hover:border-neutral-300'
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {selectedMeetingIds.length === 0 ? (
                  <span className="text-sm text-neutral-400">
                    请选择需要统计的会议
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedMeetingIds.length === filteredMeetings.length &&
                    filteredMeetings.length > 0 ? (
                      <span className="px-2.5 py-1 rounded-lg bg-gradient-accent text-white text-xs font-semibold shadow-sm">
                        全选 ({filteredMeetings.length})
                      </span>
                    ) : (
                      <>
                        {selectedMeetingIds.slice(0, 3).map((id) => {
                          const m = meetings.find((x) => x.id === id);
                          return m ? (
                            <span
                              key={id}
                              className="px-2 py-0.5 rounded bg-primary-50 text-primary-700 text-xs font-medium"
                            >
                              {m.title.length > 10
                                ? m.title.slice(0, 10) + '...'
                                : m.title}
                            </span>
                          ) : null;
                        })}
                        {selectedMeetingIds.length > 3 && (
                          <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 text-xs font-medium">
                            +{selectedMeetingIds.length - 3}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-neutral-400 flex-shrink-0 ml-2 transition-transform',
                  showMeetingDropdown && 'rotate-180'
                )}
              />
            </button>

            {showMeetingDropdown && (
              <div className="absolute z-30 left-0 right-0 mt-2 bg-white rounded-xl border-2 border-neutral-100 shadow-xl overflow-hidden animate-slide-down">
                <div className="p-3 border-b border-neutral-100 bg-neutral-50/60">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={meetingSearch}
                      onChange={(e) => setMeetingSearch(e.target.value)}
                      placeholder="搜索会议标题..."
                      className="w-full pl-9 pr-8 py-2 rounded-lg border border-neutral-200 focus:border-accent-400 focus:ring-2 focus:ring-accent-100 outline-none text-xs"
                    />
                    {meetingSearch && (
                      <button
                        onClick={() => setMeetingSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="px-3 py-2 border-b border-neutral-100 bg-white">
                  <button
                    onClick={toggleAllMeetings}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <span className="text-xs font-medium text-neutral-700">
                      {selectedMeetingIds.length === filteredMeetings.length &&
                      filteredMeetings.length > 0
                        ? '取消全选'
                        : '全选全部会议'}
                    </span>
                    {selectedMeetingIds.length === filteredMeetings.length &&
                      filteredMeetings.length > 0 && (
                        <CheckCheck className="w-4 h-4 text-accent-600" />
                      )}
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {filteredMeetings.length === 0 ? (
                    <div className="py-8 text-center">
                      <Calendar className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                      <p className="text-xs text-neutral-400">
                        当前时间范围内没有匹配的会议
                      </p>
                    </div>
                  ) : (
                    filteredMeetings.map((m) => {
                      const isSelected = selectedMeetingIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          onClick={() => toggleMeeting(m.id)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all text-left',
                            isSelected
                              ? 'bg-accent-50/60 border border-accent-200'
                              : 'hover:bg-neutral-50 border border-transparent'
                          )}
                        >
                          <div
                            className={cn(
                              'flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                              isSelected
                                ? 'bg-gradient-accent border-transparent'
                                : 'border-neutral-300'
                            )}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-neutral-800 truncate">
                              {m.title}
                            </p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">
                              {formatDate(new Date(m.startTime))} · {m.room?.name || '待定'}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedMeetingIds.length === 0 && (
            <p className="text-[10px] text-warning-500 mt-2 flex items-center gap-1">
              请至少选择 1 场会议
            </p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-warning-500" />
            报表内容
          </h4>

          <div className="grid grid-cols-2 gap-3">
            {contentOptions.map((opt) => {
              const isActive = content[opt.key];
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
                warning: {
                  active: 'border-warning-400 bg-warning-50/60',
                  icon: 'bg-gradient-to-br from-warning-500 to-warning-600',
                  text: 'text-warning-700',
                },
              }[opt.color];

              return (
                <button
                  key={opt.key}
                  onClick={() => toggleContent(opt.key)}
                  className={cn(
                    'relative p-4 rounded-xl border-2 transition-all text-left',
                    isActive
                      ? `${colorClass.active} shadow-sm`
                      : 'border-neutral-100 bg-neutral-50/50 hover:border-neutral-200'
                  )}
                >
                  {isActive && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all',
                        isActive
                          ? `${colorClass.icon} text-white`
                          : 'bg-neutral-200 text-neutral-400'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p
                        className={cn(
                          'text-sm font-semibold mb-0.5',
                          isActive ? colorClass.text : 'text-neutral-600'
                        )}
                      >
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-neutral-400 leading-snug">
                        {opt.desc}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {!anyContentSelected && (
            <p className="text-[10px] text-warning-500 mt-2 flex items-center gap-1">
              请至少选择 1 项报表内容
            </p>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={
            generating ||
            !anyContentSelected ||
            selectedMeetingIds.length === 0 ||
            !startDate ||
            !endDate
          }
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-accent text-white font-medium text-sm hover:shadow-glow hover:shadow-accent-500/30 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              正在生成报表，请稍候...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              生成报表
            </>
          )}
        </button>
      </div>
    </div>
  );
}
