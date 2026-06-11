import KPICard from '@/components/common/KPICard';
import { getSummaryStatistics, monthlyStatistics } from '@/data/statistics';
import {
  Calendar,
  Clock,
  Users,
  Zap,
  Award,
  PieChart as PieChartIcon,
  TrendingUp,
  Building2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const PIE_COLORS = ['#1E3A5F', '#00B8D4', '#FF9100', '#00C853', '#FF5252', '#9C27B0'];

const departmentData = [
  { name: '技术部', value: 168 },
  { name: '市场部', value: 124 },
  { name: '产品部', value: 96 },
  { name: '财务部', value: 58 },
  { name: '人力资源部', value: 42 },
  { name: '行政部', value: 32 },
];

const cateringTrend = monthlyStatistics.map(s => ({
  month: s.month.slice(5) + '月',
  expense: s.cateringExpense,
}));

const colorMap: Record<string, 'blue' | 'cyan' | 'green' | 'orange'> = {
  primary: 'blue',
  accent: 'cyan',
  success: 'green',
  warning: 'orange',
};

export default function OperationsPanel() {
  const summary = getSummaryStatistics();
  const latest = summary.latest;

  const topRooms = [...latest.topUsedRooms]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const maxCount = Math.max(...topRooms.map(r => r.count));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        <KPICard
          title="总会议数"
          value={summary.totalMeetings}
          icon={<Calendar className="w-6 h-6" />}
          trend={summary.meetingGrowth}
          trendLabel="较上月"
          variant="blue"
        />
        <KPICard
          title="累计会议时长"
          value={summary.totalHours}
          suffix="小时"
          icon={<Clock className="w-6 h-6" />}
          trend={12.5}
          trendLabel="较上月"
          variant="cyan"
        />
        <KPICard
          title="平均出席率"
          value={summary.averageAttendance}
          suffix="%"
          icon={<Users className="w-6 h-6" />}
          trend={3.2}
          trendLabel="较上月"
          variant="green"
        />
        <KPICard
          title="会议效率指数"
          value={86.7}
          suffix="分"
          icon={<Zap className="w-6 h-6" />}
          trend={5.8}
          trendLabel="较上月"
          variant="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Award className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-800">会议室Top5</h3>
                <p className="text-[10px] text-neutral-500">月度使用频次排名</p>
              </div>
            </div>
            <TrendingUp className="w-4 h-4 text-success-500" />
          </div>

          <div className="space-y-3">
            {topRooms.map((room, idx) => {
              const percentage = Math.round((room.count / maxCount) * 100);
              const medalColors = [
                'from-warning-500 to-warning-600',
                'from-neutral-400 to-neutral-500',
                'from-orange-400 to-orange-500',
              ];
              return (
                <div key={room.roomId} className="group">
                  <div className="flex items-center gap-3 mb-1.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                        idx < 3
                          ? `bg-gradient-to-br ${medalColors[idx]}`
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <Building2 className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                      <span className="text-xs font-medium text-neutral-700 truncate">
                        {room.roomName}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-accent-600 shrink-0 tabular-nums">
                      {room.count}次
                    </span>
                  </div>
                  <div className="pl-10">
                    <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent-400 to-accent-600 rounded-full transition-all duration-700 group-hover:from-primary-500 group-hover:to-accent-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
                <PieChartIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-800">部门会议分布</h3>
                <p className="text-[10px] text-neutral-500">各部门会议数量占比</p>
              </div>
            </div>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {departmentData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    fontSize: '11px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number, name: string) => [`${value} 场`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2">
            {departmentData.slice(0, 6).map((d, idx) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span className="text-[10px] text-neutral-500 truncate">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-warning-500 to-warning-600 flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-800">餐饮支出趋势</h3>
                <p className="text-[10px] text-neutral-500">月度餐饮费用变化</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-warning-600">
                ¥{(summary.totalExpense / 10000).toFixed(1)}万
              </div>
              <div className="text-[9px] text-neutral-400">累计支出</div>
            </div>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cateringTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="cateringGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF9100" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#FF9100" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: '#8892A6' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: '#8892A6' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    fontSize: '11px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number) => [`¥${(value / 1000).toFixed(1)}K`, '餐饮支出']}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#FF9100"
                  strokeWidth={2.5}
                  fill="url(#cateringGradient)"
                  dot={{ r: 3, fill: '#fff', stroke: '#FF9100', strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between mt-2 pt-3 border-t border-neutral-100">
            <div>
              <div className="text-[10px] text-neutral-400">较上月</div>
              <div className="text-xs font-semibold text-success-600 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                +{summary.expenseGrowth}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-neutral-400">月均</div>
              <div className="text-xs font-bold text-neutral-700">
                ¥{Math.round(summary.totalExpense / monthlyStatistics.length)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
