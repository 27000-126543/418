import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { getLatestStatistics, monthlyStatistics } from '@/data/statistics';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

const WARNING_THRESHOLD = 85;

interface RoomData {
  name: string;
  rate: number;
  trend: number;
}

export default function UtilizationBar() {
  const [data, setData] = useState<RoomData[]>([]);
  const [animate, setAnimate] = useState(false);
  const latest = getLatestStatistics();
  const previous = monthlyStatistics[monthlyStatistics.length - 2];

  useEffect(() => {
    const timer = setTimeout(() => {
      const chartData: RoomData[] = latest.roomUtilizationRates.map(r => {
        const prevRate = previous?.roomUtilizationRates.find(p => p.roomId === r.roomId)?.rate ?? r.rate;
        return {
          name: r.roomName,
          rate: Math.round(r.rate * 10) / 10,
          trend: Math.round(((r.rate - prevRate) / prevRate) * 100),
        };
      }).sort((a, b) => b.rate - a.rate);
      setData(chartData);
      setAnimate(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [latest, previous]);

  const averageRate = data.length > 0
    ? Math.round((data.reduce((s, d) => s + d.rate, 0) / data.length) * 10) / 10
    : 0;

  const warningCount = data.filter(d => d.rate >= WARNING_THRESHOLD).length;

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const item = data.find(d => d.name === label);
      const rate = payload[0].value;
      const isWarning = rate >= WARNING_THRESHOLD;
      return (
        <div className="bg-white rounded-xl shadow-card-hover border border-neutral-100 p-3 text-xs">
          <div className="font-semibold text-neutral-800 mb-2">{label}</div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-neutral-500">利用率</span>
            <span className={`font-bold ${isWarning ? 'text-danger-500' : 'text-accent-600'}`}>
              {rate}%
            </span>
          </div>
          {item && (
            <div className="flex items-center gap-1.5">
              {item.trend >= 0 ? (
                <TrendingUp className="w-3 h-3 text-success-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-danger-500" />
              )}
              <span className={item.trend >= 0 ? 'text-success-600 font-medium' : 'text-danger-500 font-medium'}>
                {item.trend >= 0 ? '+' : ''}{item.trend}%
              </span>
              <span className="text-neutral-400">环比上月</span>
            </div>
          )}
          {isWarning && (
            <div className="mt-2 p-2 rounded-lg bg-danger-50 text-danger-500 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" />
              超过警戒线
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-neutral-800">会议室利用率对比</h3>
          <p className="text-xs text-neutral-500 mt-0.5">各会议室月度使用效率排名</p>
        </div>
        <div className="flex items-center gap-3">
          {warningCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger-50 text-danger-500">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{warningCount} 个超限</span>
            </div>
          )}
          <div className="text-right">
            <div className="text-xl font-bold text-primary-600">{averageRate}%</div>
            <div className="text-[10px] text-neutral-400">平均值</div>
          </div>
        </div>
      </div>

      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 40, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#8892A6' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tick={{ fontSize: 12, fill: '#4A4A6A', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F5F7FA' }} />
            <ReferenceLine
              x={averageRate}
              stroke="#00B8D4"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: `平均 ${averageRate}%`,
                position: 'right',
                fill: '#00B8D4',
                fontSize: 10,
                fontWeight: 600,
              }}
            />
            <ReferenceLine
              x={WARNING_THRESHOLD}
              stroke="#FF5252"
              strokeDasharray="2 2"
              strokeWidth={1}
              label={{
                value: '警戒线',
                position: 'top',
                fill: '#FF5252',
                fontSize: 9,
              }}
            />
            <Bar
              dataKey="rate"
              radius={[0, 8, 8, 0]}
              barSize={22}
              animationBegin={0}
              animationDuration={1200}
              animationEasing="ease-out"
            >
              {data.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.rate >= WARNING_THRESHOLD
                    ? 'url(#dangerGradient)'
                    : entry.rate >= averageRate
                    ? 'url(#primaryGradient)'
                    : 'url(#accentGradient)'}
                />
              ))}
              <defs>
                <linearGradient id="primaryGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1E3A5F" />
                  <stop offset="100%" stopColor="#3D91C9" />
                </linearGradient>
                <linearGradient id="accentGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#80DEEA" />
                  <stop offset="100%" stopColor="#00B8D4" />
                </linearGradient>
                <linearGradient id="dangerGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FF8A80" />
                  <stop offset="100%" stopColor="#FF5252" />
                </linearGradient>
              </defs>
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-neutral-100">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(90deg, #FF8A80, #FF5252)' }} />
          <span className="text-xs text-neutral-600">超限 ({'>'}{WARNING_THRESHOLD}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(90deg, #1E3A5F, #3D91C9)' }} />
          <span className="text-xs text-neutral-600">高于平均</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(90deg, #80DEEA, #00B8D4)' }} />
          <span className="text-xs text-neutral-600">低于平均</span>
        </div>
      </div>
    </div>
  );
}
