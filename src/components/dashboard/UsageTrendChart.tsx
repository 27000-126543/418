import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { monthlyStatistics } from '@/data/statistics';

const data = monthlyStatistics.map(s => ({
  month: s.month.slice(5) + '月',
  meetings: s.totalMeetings,
  hours: s.totalMeetingHours,
  attendance: s.averageAttendanceRate,
}));

export default function UsageTrendChart() {
  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorMeetings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00B8D4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00B8D4" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#8892A6', fontSize: 11 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#8892A6', fontSize: 11 }}
            dx={-4}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #EEF1F6',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(30, 58, 95, 0.12)',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#1E3A5F', fontWeight: 600 }}
          />
          <Area
            type="monotone"
            dataKey="meetings"
            name="会议数"
            stroke="#00B8D4"
            strokeWidth={3}
            fill="url(#colorMeetings)"
            dot={{ r: 4, fill: '#00B8D4', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="hours"
            name="会议时长"
            stroke="#1E3A5F"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#1E3A5F', strokeWidth: 2, stroke: '#fff' }}
            strokeDasharray="4 4"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
