import type { Meeting, MeetingReport } from '@/types';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Users,
  Clock,
  Wallet,
  Calendar,
  TrendingUp,
  CheckSquare,
  ChevronRight,
} from 'lucide-react';
import { useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  formatDuration,
  formatCurrency,
  formatPercent,
} from '@/utils/formatters';

type DecisionStatus = 'completed' | 'in_progress' | 'pending' | 'overdue';

interface DecisionRecord {
  id: string;
  title: string;
  content: string;
  ownerName: string;
  dueDate: Date;
  status: DecisionStatus;
}

export interface MeetingReportData {
  id: string;
  title: string;
  date: Date;
  attendanceRate: number;
  duration: number;
  cost: number;
  cateringItems: string[];
  decisions?: DecisionRecord[];
}

interface NewReportPreviewProps {
  meetings: Meeting[];
  reports: MeetingReportData[];
  generateTime: Date;
  dateRange: { start: string; end: string };
  onExportPDF?: () => void;
  onExportExcel?: () => void;
}

interface LegacyReportPreviewProps {
  report: MeetingReport;
}

type ReportPreviewProps = NewReportPreviewProps | LegacyReportPreviewProps;

function isLegacy(props: ReportPreviewProps): props is LegacyReportPreviewProps {
  return 'report' in props;
}

const formatDate = (d: Date) => {
  const r = new Date(d);
  return `${r.getFullYear()}-${String(r.getMonth() + 1).padStart(2, '0')}-${String(r.getDate()).padStart(2, '0')}`;
};

export default function ReportPreview(props: ReportPreviewProps) {
  if (isLegacy(props)) {
    return <LegacyReportPreview {...props} />;
  }
  return <NewReportPreview {...props} />;
}

function LegacyReportPreview({ report }: LegacyReportPreviewProps) {
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-neutral-100">
      <div className="px-6 py-4 bg-gradient-primary flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">
            报表预览
          </h3>
          <p className="text-primary-100 text-sm mt-0.5">
            生成时间：{new Date().toLocaleString('zh-CN')}
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 text-white text-xs font-medium hover:bg-white/25 transition-all">
            <FileText className="w-3.5 h-3.5" />
            PDF
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 text-white text-xs font-medium hover:bg-white/25 transition-all">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 text-white text-xs font-medium hover:bg-white/25 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            打印
          </button>
        </div>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50 border border-primary-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-medium text-neutral-500">会议总数</p>
            </div>
            <p className="text-2xl font-bold text-primary-700">-</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-accent-50 to-accent-100/50 border border-accent-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-medium text-neutral-500">平均出席率</p>
            </div>
            <p className="text-2xl font-bold text-accent-700">-</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-success-50 to-success-100/50 border border-success-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-medium text-neutral-500">累计时长</p>
            </div>
            <p className="text-2xl font-bold text-success-700">-</p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-warning-50 to-warning-100/50 border border-warning-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-warning-500 to-warning-600 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-medium text-neutral-500">总成本</p>
            </div>
            <p className="text-2xl font-bold text-warning-700">-</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 text-center text-sm text-neutral-500">
          报表内容加载中，请等待数据生成
        </div>
      </div>
    </div>
  );
}

function NewReportPreview({
  meetings,
  reports,
  generateTime,
  dateRange,
  onExportPDF,
  onExportExcel,
}: NewReportPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const totalMeetings = reports.length;
  const avgAttendanceRate =
    totalMeetings > 0
      ? reports.reduce((sum, r) => sum + r.attendanceRate, 0) / totalMeetings
      : 0;
  const totalDuration = reports.reduce((sum, r) => sum + r.duration, 0);
  const totalCost = reports.reduce((sum, r) => sum + r.cost, 0);
  const allDecisions = reports.flatMap(
    (r) => r.decisions?.map((d) => ({ ...d, meetingTitle: r.title })) || []
  );

  const metrics = [
    {
      label: '会议总数',
      value: totalMeetings.toString(),
      unit: '场',
      icon: Calendar,
      gradient: 'from-primary-500 to-primary-700',
      bg: 'bg-gradient-to-br from-primary-500/10 to-primary-700/5',
      iconBg: 'bg-gradient-primary',
      valueColor: 'text-primary-700',
    },
    {
      label: '平均出席率',
      value: formatPercent(avgAttendanceRate),
      unit: '',
      icon: Users,
      gradient: 'from-accent-500 to-accent-700',
      bg: 'bg-gradient-to-br from-accent-500/10 to-accent-700/5',
      iconBg: 'bg-gradient-accent',
      valueColor: 'text-accent-700',
    },
    {
      label: '累计时长',
      value: formatDuration(totalDuration).replace(' ', ''),
      unit: '',
      icon: Clock,
      gradient: 'from-success-500 to-success-700',
      bg: 'bg-gradient-to-br from-success-500/10 to-success-700/5',
      iconBg: 'bg-gradient-to-br from-success-500 to-success-600',
      valueColor: 'text-success-700',
    },
    {
      label: '总支出',
      value: formatCurrency(totalCost).replace('¥', '¥ '),
      unit: '',
      icon: Wallet,
      gradient: 'from-warning-500 to-warning-700',
      bg: 'bg-gradient-to-br from-warning-500/10 to-warning-700/5',
      iconBg: 'bg-gradient-to-br from-warning-500 to-warning-600',
      valueColor: 'text-warning-700',
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  const getRateColor = (rate: number) => {
    if (rate >= 90) return 'bg-success-500';
    if (rate >= 70) return 'bg-accent-500';
    if (rate >= 50) return 'bg-warning-500';
    return 'bg-danger-500';
  };

  const getRateTextColor = (rate: number) => {
    if (rate >= 90) return 'text-success-700';
    if (rate >= 70) return 'text-accent-700';
    if (rate >= 50) return 'text-warning-700';
    return 'text-danger-700';
  };

  return (
    <div className="relative min-h-screen">
      <div className="sticky top-4 z-30 mx-4 mb-6 animate-slide-down print:hidden">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-primary-500/10 border border-primary-100/50 p-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md shadow-primary-500/30">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-800">
                  会议分析报告
                </h2>
                <p className="text-[10px] text-neutral-500">
                  {dateRange.start} ~ {dateRange.end}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onExportPDF}
                className="group flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-br from-danger-500 to-danger-600 text-white text-xs font-semibold hover:shadow-lg hover:shadow-danger-500/30 active:scale-[0.98] transition-all shadow-md"
              >
                <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                导出 PDF
              </button>
              <button
                onClick={onExportExcel}
                className="group flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-br from-success-500 to-success-600 text-white text-xs font-semibold hover:shadow-lg hover:shadow-success-500/30 active:scale-[0.98] transition-all shadow-md"
              >
                <FileSpreadsheet className="w-4 h-4 group-hover:scale-110 transition-transform" />
                导出 Excel
              </button>
              <button
                onClick={handlePrint}
                className="group flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-primary text-white text-xs font-semibold hover:shadow-lg hover:shadow-primary-500/30 active:scale-[0.98] transition-all shadow-md"
              >
                <Printer className="w-4 h-4 group-hover:scale-110 transition-transform" />
                打印
              </button>
            </div>
          </div>
        </div>
      </div>

      <div ref={printRef} className="px-4 pb-12">
        <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-neutral-100">
          <div className="px-8 pt-10 pb-8 bg-gradient-to-br from-primary via-primary-600 to-accent-700 text-white relative overflow-hidden print:rounded-t-none">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-accent-300 blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                      <TrendingUp className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">
                        智能会议管理平台
                      </h1>
                      <p className="text-lg text-white/80 font-medium mt-1">
                        会议运营分析报告
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-white/70">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      统计周期：{dateRange.start} 至 {dateRange.end}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      生成时间：
                      {formatDate(generateTime)}{' '}
                      {String(generateTime.getHours()).padStart(2, '0')}:
                      {String(generateTime.getMinutes()).padStart(2, '0')}
                    </span>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="px-5 py-2.5 rounded-2xl bg-white/15 backdrop-blur text-xs text-white/80 border border-white/20">
                    报告编号：RPT
                    {generateTime.getFullYear()}
                    {String(generateTime.getMonth() + 1).padStart(2, '0')}
                    {String(generateTime.getDate()).padStart(2, '0')}
                    {String(generateTime.getHours()).padStart(2, '0')}
                    {String(generateTime.getMinutes()).padStart(2, '0')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-10">
            <section>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-6 rounded-full bg-gradient-primary" />
                <h3 className="text-lg font-bold text-neutral-800">
                  概览指标
                </h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((m, idx) => {
                  const Icon = m.icon;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'relative rounded-2xl p-5 overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1',
                        m.bg,
                        'border border-neutral-100'
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={cn(
                            'w-11 h-11 rounded-xl flex items-center justify-center shadow-md',
                            m.iconBg
                          )}
                        >
                          <Icon className="w-5.5 h-5.5 text-white" />
                        </div>
                      </div>
                      <div className="mb-1">
                        <span
                          className={cn(
                            'text-3xl font-extrabold tracking-tight',
                            m.valueColor
                          )}
                        >
                          {m.value}
                        </span>
                        <span
                          className={cn(
                            'text-sm font-semibold ml-1',
                            m.valueColor,
                            'opacity-70'
                          )}
                        >
                          {m.unit}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 font-medium">
                        {m.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 rounded-full bg-gradient-accent" />
                  <h3 className="text-lg font-bold text-neutral-800">
                    会议明细
                  </h3>
                </div>
                <span className="text-xs text-neutral-400">
                  共 {reports.length} 条记录
                </span>
              </div>
              <div className="rounded-2xl border border-neutral-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-neutral-50 to-neutral-100/60">
                        <th className="text-left px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                          会议名称
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                          日期
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                          出席率
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                          时长
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                          餐饮项目
                        </th>
                        <th className="text-right px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                          成本
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {reports.map((r, idx) => (
                        <tr
                          key={r.id}
                          className="hover:bg-accent-50/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-primary text-white text-[10px] font-bold flex items-center justify-center shadow-sm flex-shrink-0">
                                {idx + 1}
                              </div>
                              <span className="text-sm font-semibold text-neutral-800 truncate max-w-[280px]">
                                {r.title}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-neutral-600 font-medium">
                            {formatDate(r.date)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3 min-w-[160px]">
                              <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all',
                                    getRateColor(r.attendanceRate)
                                  )}
                                  style={{
                                    width: `${Math.min(r.attendanceRate, 100)}%`,
                                  }}
                                />
                              </div>
                              <span
                                className={cn(
                                  'text-xs font-bold min-w-[44px] text-right',
                                  getRateTextColor(r.attendanceRate)
                                )}
                              >
                                {r.attendanceRate.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 text-xs font-semibold">
                              <Clock className="w-3 h-3 text-accent-500" />
                              {formatDuration(r.duration)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-neutral-600">
                              {r.cateringItems && r.cateringItems.length > 0
                                ? r.cateringItems.join('、')
                                : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-bold text-warning-700">
                              {formatCurrency(r.cost)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gradient-to-r from-primary-50/80 to-accent-50/60 border-t-2 border-primary-100">
                        <td className="px-6 py-4 text-sm font-bold text-primary-800">
                          汇总统计
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-neutral-600">
                          {reports.length} 场
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 min-w-[160px]">
                            <div className="flex-1 h-2.5 bg-white rounded-full overflow-hidden shadow-inner">
                              <div
                                className={cn(
                                  'h-full rounded-full',
                                  getRateColor(avgAttendanceRate)
                                )}
                                style={{
                                  width: `${Math.min(avgAttendanceRate, 100)}%`,
                                }}
                              />
                            </div>
                            <span
                              className={cn(
                                'text-xs font-extrabold min-w-[44px] text-right',
                                getRateTextColor(avgAttendanceRate)
                              )}
                            >
                              {avgAttendanceRate.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-accent text-white text-xs font-bold shadow-sm">
                            <Clock className="w-3 h-3" />
                            {formatDuration(totalDuration)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-neutral-500">
                          -
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-base font-extrabold text-warning-700">
                            {formatCurrency(totalCost)}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </section>

            {allDecisions.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 rounded-full bg-gradient-to-br from-success-500 to-success-700" />
                    <h3 className="text-lg font-bold text-neutral-800">
                      关键决策记录
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-50 text-success-700 text-xs font-bold">
                    <CheckSquare className="w-3.5 h-3.5" />
                    {allDecisions.length} 项决议
                  </span>
                </div>
                <div className="space-y-3">
                  {allDecisions.map((d, idx) => (
                    <div
                      key={d.id}
                      className="group p-5 rounded-2xl bg-gradient-to-br from-neutral-50 to-white border border-neutral-100 hover:border-success-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-success-500 to-success-600 text-white text-xs font-bold flex items-center justify-center shadow-md shadow-success-500/20">
                          #{idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h4 className="text-sm font-bold text-neutral-800">
                              {d.title}
                            </h4>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 text-[10px] font-semibold">
                              来自：{d.meetingTitle}
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600 leading-relaxed mb-3 bg-white p-3 rounded-xl border border-neutral-100">
                            {d.content}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-[10px] text-neutral-500">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                责任人：{d.ownerName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                截止：{formatDate(d.dueDate)}
                              </span>
                            </div>
                            <span
                              className={cn(
                                'px-2.5 py-1 rounded-full text-[10px] font-bold',
                                d.status === 'completed'
                                  ? 'bg-success-100 text-success-700'
                                  : d.status === 'in_progress'
                                  ? 'bg-accent-100 text-accent-700'
                                  : d.status === 'pending'
                                  ? 'bg-warning-100 text-warning-700'
                                  : 'bg-danger-100 text-danger-700'
                              )}
                            >
                              {d.status === 'completed'
                                ? '已完成'
                                : d.status === 'in_progress'
                                ? '进行中'
                                : d.status === 'pending'
                                ? '待开始'
                                : '已逾期'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="pt-6 border-t border-dashed border-neutral-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-accent animate-pulse" />
                  <span>
                    本报告由智能会议管理平台自动生成 · 数据仅供内部参考
                  </span>
                </div>
                <span>
                  第 1 页 / 共 1 页
                </span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
