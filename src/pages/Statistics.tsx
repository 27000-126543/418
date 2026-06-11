import { useState } from 'react';
import OperationsPanel from '@/components/statistics/OperationsPanel';
import HeatMapChart from '@/components/statistics/HeatMapChart';
import UtilizationBar from '@/components/statistics/UtilizationBar';
import FaultRateChart from '@/components/statistics/FaultRateChart';
import { useResourceStore } from '@/store/useResourceStore';
import StatusBadge from '@/components/common/StatusBadge';
import {
  Building2,
  Monitor,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
} from 'lucide-react';

type TabType = 'rooms' | 'devices' | 'operations';

const TABS: { id: TabType; label: string; icon: typeof Building2 }[] = [
  { id: 'rooms', label: '会议室利用', icon: Building2 },
  { id: 'devices', label: '设备情况', icon: Monitor },
  { id: 'operations', label: '运营数据', icon: BarChart3 },
];

export default function Statistics() {
  const [activeTab, setActiveTab] = useState<TabType>('rooms');
  const { rooms, devices } = useResourceStore();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-1">数据统计</h1>
          <p className="text-sm text-neutral-500">
            多维度可视化分析，洞察空间资源利用效率
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-4 py-2 rounded-xl bg-white border border-neutral-100 shadow-card flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-xs font-semibold text-neutral-700">
              本月数据
            </span>
          </div>
        </div>
      </div>

      <OperationsPanel />

      <div className="p-1 rounded-2xl bg-white border border-neutral-100 shadow-card">
        <div className="flex gap-1 p-1 bg-neutral-50 rounded-xl">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-slide-up">
        {activeTab === 'rooms' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 rounded-2xl bg-white border border-neutral-100 shadow-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary-500" />
                    会议室利用率热力图
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    按星期×时段维度查看各时段使用密度
                  </p>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-neutral-500">
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded bg-accent-100" />
                    低
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded bg-primary-400" />
                    中
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded bg-gradient-danger" />
                    高
                  </div>
                </div>
              </div>
              <HeatMapChart />
            </div>

            <div className="rounded-2xl bg-white border border-neutral-100 shadow-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-accent-500" />
                    利用率排行
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    各会议室综合使用百分比对比
                  </p>
                </div>
                <div className="px-2 py-1 rounded-lg bg-danger-50 text-[9px] font-bold text-danger-500">
                  85% 预警
                </div>
              </div>
              <UtilizationBar />
            </div>
          </div>
        )}

        {activeTab === 'devices' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white border border-neutral-100 shadow-card p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-primary-500" />
                    设备故障率趋势
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    按周统计各设备的故障率变化与报修次数
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['全部', '投影仪', '白板', '视频会议', '音响', '空调'].map(
                    (f, i) => (
                      <button
                        key={f}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          i === 0
                            ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/30'
                            : 'bg-neutral-50 text-neutral-600 hover:bg-primary-50 hover:text-primary-600'
                        }`}
                      >
                        {f}
                      </button>
                    )
                  )}
                </div>
              </div>
              <FaultRateChart />
            </div>

            <div className="rounded-2xl bg-white border border-neutral-100 shadow-card overflow-hidden">
              <div className="p-6 pb-4 flex items-center justify-between border-b border-neutral-100">
                <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-accent-500" />
                  设备详细清单
                </h3>
                <span className="text-xs text-neutral-500">
                  共 {devices.length} 台设备
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-neutral-50/60">
                      <th className="px-5 py-3 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        设备名称
                      </th>
                      <th className="px-5 py-3 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        型号
                      </th>
                      <th className="px-5 py-3 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        位置
                      </th>
                      <th className="px-5 py-3 text-left text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-5 py-3 text-right text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        故障率
                      </th>
                      <th className="px-5 py-3 text-right text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        使用次数
                      </th>
                      <th className="px-5 py-3 text-right text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                        上次维护
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {devices.map((d, idx) => {
                      const faultRate =
                        d.useCount > 0
                          ? Math.round((d.faultCount / d.useCount) * 100)
                          : 0;
                      const Trend = faultRate > 10 ? TrendingUp : TrendingDown;
                      return (
                        <tr
                          key={d.id}
                          className="hover:bg-primary-50/20 transition-colors"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                  d.status === 'faulty'
                                    ? 'bg-danger-50 text-danger-500'
                                    : d.status === 'maintenance'
                                    ? 'bg-warning-50 text-warning-500'
                                    : 'bg-primary-50 text-primary-500'
                                }`}
                              >
                                <Monitor className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-neutral-800">
                                  {d.name}
                                </div>
                                <div className="text-[10px] text-neutral-400">
                                  ID: {d.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs text-neutral-600">
                            {d.model}
                          </td>
                          <td className="px-5 py-4 text-xs text-neutral-600">
                            {rooms.find(r => r.id === d.roomId)?.name ||
                              '未分配'}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={d.status} type="device" />
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <span
                                className={`text-sm font-bold ${
                                  faultRate > 15
                                    ? 'text-danger-500'
                                    : faultRate > 10
                                    ? 'text-warning-600'
                                    : 'text-success-600'
                                }`}
                              >
                                {faultRate}%
                              </span>
                              <Trend
                                className={`w-3 h-3 ${
                                  faultRate > 10
                                    ? 'text-danger-400'
                                    : 'text-success-400'
                                }`}
                              />
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right text-xs font-semibold text-neutral-700">
                            {d.useCount}
                          </td>
                          <td className="px-5 py-4 text-right text-xs text-neutral-500">
                            {new Date(d.lastMaintenanceAt).toLocaleDateString(
                              'zh-CN'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'operations' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white border border-neutral-100 shadow-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary-500" />
                    会议室利用率热力图
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    全维度查看会议室各时段使用情况
                  </p>
                </div>
              </div>
              <HeatMapChart />
            </div>

            <div className="rounded-2xl bg-white border border-neutral-100 shadow-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-accent-500" />
                    会议室利用排行
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    按利用率从高到低排列
                  </p>
                </div>
              </div>
              <UtilizationBar />
            </div>

            <div className="xl:col-span-2 rounded-2xl bg-white border border-neutral-100 shadow-card p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-primary-500" />
                    设备健康度综合分析
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    按周统计设备故障率与报修次数组合趋势
                  </p>
                </div>
              </div>
              <FaultRateChart />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
