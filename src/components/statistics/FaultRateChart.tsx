import { useState } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { monthlyStatistics } from '@/data/statistics';
import { AlertTriangle, Wrench, CheckCircle, ChevronRight, TrendingUp } from 'lucide-react';
import type { Device } from '@/types';
import { devices as allDevices } from '@/data/devices';

const HIGH_FAULT_THRESHOLD = 5;

interface FaultDetail {
  id: string;
  name: string;
  type: string;
  rate: number;
  count: number;
  status: Device['status'];
}

export default function FaultRateChart() {
  const latest = monthlyStatistics[monthlyStatistics.length - 1];
  const [selectedDevice, setSelectedDevice] = useState<FaultDetail | null>(null);

  const trendData = monthlyStatistics.map(s => ({
    month: s.month.slice(5) + '月',
    avgRate: Math.round(
      s.deviceFaultRates.reduce((sum, d) => sum + d.rate, 0) / s.deviceFaultRates.length * 100
    ) / 100,
    totalFaults: s.deviceFaultRates.reduce((sum, d) => sum + d.faultCount, 0),
  }));

  const deviceData: FaultDetail[] = latest.deviceFaultRates
    .map(d => {
      const dev = allDevices.find(ad => ad.id === d.deviceId);
      return {
        id: d.deviceId,
        name: d.deviceName,
        type: dev?.type ?? 'projector',
        rate: d.rate,
        count: d.faultCount,
        status: dev?.status ?? 'available',
      };
    })
    .sort((a, b) => b.rate - a.rate);

  const highFaultDevices = deviceData.filter(d => d.rate >= HIGH_FAULT_THRESHOLD);
  const totalFaults = deviceData.reduce((s, d) => s + d.count, 0);
  const avgRate = Math.round((deviceData.reduce((s, d) => s + d.rate, 0) / deviceData.length) * 100) / 100;

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ dataKey: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-xl shadow-card-hover border border-neutral-100 p-3 text-xs">
          <div className="font-semibold text-neutral-800 mb-2">{label}</div>
          {payload.map((p, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 mb-1">
              <span className="flex items-center gap-1.5 text-neutral-500">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.dataKey === 'avgRate' ? '平均故障率' : '故障总数'}
              </span>
              <span className="font-semibold" style={{ color: p.color }}>
                {p.value}{p.dataKey === 'avgRate' ? '%' : ' 次'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const typeColor = (type: string) => {
    const colors: Record<string, string> = {
      projector: 'bg-purple-50 text-purple-600',
      whiteboard: 'bg-blue-50 text-blue-600',
      'video-conferencing': 'bg-accent-50 text-accent-600',
      speaker: 'bg-orange-50 text-orange-600',
      microphone: 'bg-green-50 text-green-600',
    };
    return colors[type] ?? 'bg-neutral-50 text-neutral-600';
  };

  const typeLabel = (type: string) => {
    const labels: Record<string, string> = {
      projector: '投影仪',
      whiteboard: '白板',
      'video-conferencing': '视频会议',
      speaker: '扬声器',
      microphone: '麦克风',
    };
    return labels[type] ?? type;
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-card">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-neutral-800">设备故障率分析</h3>
          <p className="text-xs text-neutral-500 mt-0.5">近6个月设备故障趋势与详情</p>
        </div>
        <div className="flex items-center gap-3">
          {highFaultDevices.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger-50 text-danger-500">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{highFaultDevices.length} 台高风险</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-sm font-bold text-danger-500">{totalFaults}</div>
              <div className="text-[10px] text-neutral-400">故障总数</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-accent-600">{avgRate}%</div>
              <div className="text-[10px] text-neutral-400">平均故障率</div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-52 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#8892A6' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: '#8892A6' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: '#8892A6' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
              formatter={(value) => (
                <span className="text-neutral-500">
                  {value === 'avgRate' ? '平均故障率' : '故障总数'}
                </span>
              )}
            />
            <Bar
              yAxisId="right"
              dataKey="totalFaults"
              name="故障总数"
              fill="#EEF1F6"
              radius={[6, 6, 0, 0]}
              barSize={24}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="avgRate"
              name="avgRate"
              stroke="#FF5252"
              strokeWidth={3}
              dot={{ r: 4, fill: '#fff', stroke: '#FF5252', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="border-t border-neutral-100 pt-4">
        <h4 className="text-xs font-semibold text-neutral-600 mb-3 flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5" />
          设备故障率排名
        </h4>
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {deviceData.map(device => {
            const isHigh = device.rate >= HIGH_FAULT_THRESHOLD;
            const isSelected = selectedDevice?.id === device.id;
            return (
              <div
                key={device.id}
                onClick={() => setSelectedDevice(isSelected ? null : device)}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-accent-50 border border-accent-200'
                    : 'bg-neutral-50 hover:bg-neutral-100 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${typeColor(device.type)} flex items-center justify-center shrink-0`}>
                    {isHigh ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : device.status === 'faulty' ? (
                      <Wrench className="w-4 h-4" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-neutral-800 truncate">{device.name}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold ${typeColor(device.type)}`}>
                        {typeLabel(device.type)}
                      </span>
                      {isHigh && (
                        <span className="px-1.5 py-0.5 rounded-md bg-danger-50 text-danger-500 text-[9px] font-bold">
                          高风险
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isHigh ? 'bg-gradient-danger' : 'bg-gradient-accent'
                          }`}
                          style={{ width: `${Math.min(device.rate * 10, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold tabular-nums ${isHigh ? 'text-danger-500' : 'text-neutral-600'}`}>
                        {device.rate}%
                      </span>
                      <span className="text-[10px] text-neutral-400">{device.count}次</span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-neutral-300 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                </div>

                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-neutral-200 grid grid-cols-3 gap-3 animate-slide-down">
                    <div className="text-center p-2 rounded-lg bg-white">
                      <div className="text-xs font-bold text-primary-600">{device.count}</div>
                      <div className="text-[9px] text-neutral-400">故障次数</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-white">
                      <div className={`text-xs font-bold ${isHigh ? 'text-danger-500' : 'text-success-600'}`}>
                        {device.status === 'available' ? '正常' : device.status === 'faulty' ? '维修中' : '使用中'}
                      </div>
                      <div className="text-[9px] text-neutral-400">当前状态</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-white">
                      <div className="text-xs font-bold text-accent-600 flex items-center justify-center gap-0.5">
                        <TrendingUp className="w-3 h-3" />
                        +{Math.round(device.rate * 0.8)}%
                      </div>
                      <div className="text-[9px] text-neutral-400">较上月</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
