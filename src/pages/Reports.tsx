import { useState, useMemo } from 'react';
import ReportGenerator from '@/components/reports/ReportGenerator';
import ReportPreview, { MeetingReportData as PreviewReportData } from '@/components/reports/ReportPreview';
import type {
  ReportType,
  ReportFormat,
  ReportOptions,
  DecisionRecord,
} from '@/types';
import { useMeetingStore } from '@/store/useMeetingStore';
import {
  FileText,
  History,
  Download,
  Clock,
  Calendar,
  TrendingUp,
  FileSpreadsheet,
  FileIcon,
  Sparkles,
} from 'lucide-react';

interface HistoryItem {
  id: string;
  title: string;
  format: ReportFormat;
  generatedAt: Date;
  dateRange: { start: string; end: string };
  totalMeetings: number;
  totalHours: number;
  avgAttendance: number;
  avgUtilization: number;
  topRooms: { name: string; count: number }[];
  decisions?: DecisionRecord[];
  meetings: PreviewReportData[];
  generateTime: Date;
}

const genId = () => 'rpt_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const today = new Date();
const formatDate = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, days: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
};

const createInitialHistory = (meetings: Array<{ id: string; title: string; startTime: Date; room?: { name: string }; duration: number; catering?: Array<{ name: string }> }>): HistoryItem[] => {
  const lastMonth = addDays(today, -30);
  const mockDecisions: DecisionRecord[] = [
    {
      id: 'dec_001',
      title: '2026年Q3预算方案通过',
      content: '技术部预算增加15%，用于云服务升级和AI工具采购',
      ownerName: '李明华',
      dueDate: addDays(today, 14),
      status: 'in_progress',
    },
    {
      id: 'dec_002',
      title: '新产品发布时间确定',
      content: '新品发布会定于7月15日在上海国际会议中心举办',
      ownerName: '赵晓婷',
      dueDate: addDays(today, 21),
      status: 'pending',
    },
  ];

  const topRooms = [
    { name: '星辰会议室 A', count: 48 },
    { name: '创新空间 B', count: 36 },
    { name: '湖畔会议厅 C', count: 28 },
  ];

  const reportMeetings = meetings.slice(0, 6).map((m, idx) => ({
    id: m.id,
    title: m.title,
    date: m.startTime,
    attendanceRate: 75 + (idx % 5) * 5,
    duration: m.duration || 60,
    cost: (idx + 1) * 200,
    cateringItems: m.catering?.map(c => c.name) || [],
    decisions: idx === 0 ? mockDecisions : undefined,
  }));

  return [
    {
      id: genId(),
      title: '6月会议室运营综合报告',
      format: 'pdf',
      generatedAt: addDays(today, -2),
      dateRange: { start: formatDate(addDays(today, -32)), end: formatDate(addDays(today, -2)) },
      totalMeetings: 186,
      totalHours: 245.5,
      avgAttendance: 82.6,
      avgUtilization: 73.4,
      topRooms,
      decisions: mockDecisions,
      meetings: reportMeetings,
      generateTime: addDays(today, -2),
    },
    {
      id: genId(),
      title: '第二季度设备故障率统计',
      format: 'xlsx',
      generatedAt: addDays(today, -8),
      dateRange: { start: formatDate(addDays(today, -100)), end: formatDate(addDays(today, -8)) },
      totalMeetings: 512,
      totalHours: 702,
      avgAttendance: 79.3,
      avgUtilization: 68.9,
      topRooms,
      meetings: reportMeetings.slice(0, 4),
      generateTime: addDays(today, -8),
    },
    {
      id: genId(),
      title: '月度出席率分析报告',
      format: 'pdf',
      generatedAt: addDays(today, -15),
      dateRange: { start: formatDate(addDays(today, -45)), end: formatDate(addDays(today, -15)) },
      totalMeetings: 168,
      totalHours: 218,
      avgAttendance: 85.1,
      avgUtilization: 70.2,
      topRooms,
      meetings: reportMeetings.slice(0, 3),
      generateTime: addDays(today, -15),
    },
  ];
};

export default function Reports() {
  const { meetings } = useMeetingStore();

  const initialHistory = useMemo(() => createInitialHistory(meetings), [meetings]);

  const [reportType, setReportType] = useState<ReportType>('utilization');
  const [format, setFormat] = useState<ReportFormat>('pdf');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [options, setOptions] = useState<ReportOptions>({
    includeSummary: true,
    includeDetail: true,
    includeCharts: true,
    includeRoomStats: true,
    includeDeviceStats: true,
  });
  const [history, setHistory] = useState<HistoryItem[]>(initialHistory);
  const [selectedId, setSelectedId] = useState<string | null>(initialHistory[0]?.id ?? null);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedHistory = history.find(h => h.id === selectedId) ?? null;

  const handleOptionToggle = (key: keyof ReportOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1200));

    const reportMeetings: PreviewReportData[] = meetings
      .filter(m => {
        const d = new Date(m.startTime);
        const ds = formatDate(d);
        return ds >= startDate && ds <= endDate;
      })
      .slice(0, 10)
      .map((m, idx) => ({
        id: m.id,
        title: m.title,
        date: m.startTime,
        attendanceRate: 70 + ((idx * 7) % 25),
        duration: m.duration || 60,
        cost: 100 + idx * 150,
        cateringItems: m.catering?.map(c => c.name) || [],
      }));

    const reportTitles: Record<ReportType, string> = {
      utilization: '会议室利用率分析报告',
      attendance: '会议出席率统计报告',
      devices: '设备运行状况报告',
      operations: '运营数据综合报告',
      cost: '会议成本分析报告',
      comprehensive: '会议运营综合报告',
    };

    const newItem: HistoryItem = {
      id: genId(),
      title: reportTitles[reportType],
      format,
      generatedAt: new Date(),
      dateRange: { start: startDate, end: endDate },
      totalMeetings: reportMeetings.length || 128,
      totalHours: reportMeetings.reduce((s, r) => s + r.duration, 0) / 60 || 168,
      avgAttendance: reportMeetings.length ? reportMeetings.reduce((s, r) => s + r.attendanceRate, 0) / reportMeetings.length : 78.5,
      avgUtilization: 72.3,
      topRooms: [
        { name: '星辰会议室 A', count: 32 },
        { name: '创新空间 B', count: 24 },
      ],
      meetings: reportMeetings,
      generateTime: new Date(),
    };

    setHistory(prev => [newItem, ...prev]);
    setSelectedId(newItem.id);
    setIsGenerating(false);
  };

  const handleDownload = () => {
    if (!selectedHistory) return;
    alert(`报表 "${selectedHistory.title}" 下载成功！（模拟导出 ${selectedHistory.format.toUpperCase()}）`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-1">报表中心</h1>
          <p className="text-sm text-neutral-500">
            生成会议室和设备使用情况的可视化报表
          </p>
        </div>
        {selectedHistory && (
          <button
            onClick={handleDownload}
            className="btn-accent self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            导出报表
          </button>
        )}
      </div>

      <div className="p-5 rounded-2xl bg-white border border-neutral-100 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-primary-500" />
          <h3 className="text-sm font-bold text-neutral-800">历史报表</h3>
          <span className="ml-auto text-xs text-neutral-400">
            最近 5 条记录
          </span>
        </div>
        {history.length === 0 ? (
          <div className="py-8 text-center text-sm text-neutral-400">
            暂无历史报表
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {history.slice(0, 5).map(r => {
              const Icon =
                (r.format === 'xlsx' || r.format === 'excel') ? FileSpreadsheet : FileIcon;
              const isActive = selectedId === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left group ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-50 to-accent-50 border-primary-300 shadow-md'
                      : 'bg-neutral-50/50 border-neutral-100 hover:bg-primary-50/30 hover:border-primary-200'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 transition-colors ${
                      isActive
                        ? 'bg-gradient-primary text-white'
                        : 'bg-primary-100 text-primary-500 group-hover:bg-gradient-primary group-hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-semibold text-neutral-800 truncate mb-1 group-hover:text-primary-600">
                    {r.title}
                  </div>
                  <div className="text-[10px] text-neutral-400 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(r.generatedAt).toLocaleDateString('zh-CN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ReportGenerator
            reportType={reportType}
            format={format}
            startDate={startDate}
            endDate={endDate}
            options={options}
            onReportTypeChange={setReportType}
            onFormatChange={setFormat}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onOptionToggle={handleOptionToggle}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>

        <div className="lg:col-span-2">
          {selectedHistory ? (
            <ReportPreview
              meetings={meetings}
              reports={selectedHistory.meetings}
              generateTime={selectedHistory.generateTime}
              dateRange={selectedHistory.dateRange}
            />
          ) : (
            <div className="p-16 rounded-2xl bg-white border border-neutral-100 shadow-card flex flex-col items-center justify-center text-center min-h-[600px]">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-12 h-12 text-primary-400" />
              </div>
              <h3 className="text-lg font-bold text-neutral-800 mb-2">
                配置报表参数
              </h3>
              <p className="text-sm text-neutral-500 max-w-sm leading-relaxed">
                请在左侧配置报表类型、格式、日期范围等选项，点击"生成报表"后，这里将显示预览内容
              </p>
              <div className="flex items-center gap-6 mt-8 pt-6 border-t border-neutral-100">
                <div className="flex flex-col items-center gap-1">
                  <Calendar className="w-5 h-5 text-neutral-300" />
                  <span className="text-[10px] text-neutral-400">日期范围</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <TrendingUp className="w-5 h-5 text-neutral-300" />
                  <span className="text-[10px] text-neutral-400">数据图表</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <FileText className="w-5 h-5 text-neutral-300" />
                  <span className="text-[10px] text-neutral-400">报告摘要</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
