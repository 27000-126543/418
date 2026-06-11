import React, { Fragment, useState } from 'react';
import { monthlyStatistics } from '@/data/statistics';
import { rooms as roomList } from '@/data/rooms';

interface HeatMapData {
  day: string;
  hour: number;
  value: number;
  roomName: string;
}

const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const hours = Array.from({ length: 13 }, (_, i) => i + 8);

const generateHeatMapData = (): HeatMapData[] => {
  const data: HeatMapData[] = [];
  const roomNames = roomList.map(r => r.name);
  const peakWeights = [0.2, 0.5, 0.9, 1.0, 0.85, 0.6, 0.3, 0.95, 1.0, 0.8, 0.5, 0.2, 0.1];

  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    for (let h = 0; h < hours.length; h++) {
      const weekendFactor = dayIdx >= 5 ? 0.3 : 1;
      const roomIdx = (dayIdx + h) % roomNames.length;
      const baseValue = 30 + Math.random() * 20;
      const value = Math.min(
        100,
        Math.round(baseValue * peakWeights[h] * weekendFactor * 1.2)
      );
      data.push({
        day: weekdays[dayIdx],
        hour: hours[h],
        value,
        roomName: roomNames[roomIdx],
      });
    }
  }
  return data;
};

const heatMapData = generateHeatMapData();

const getColorClass = (value: number): string => {
  if (value < 20) return 'bg-accent-100 hover:bg-accent-200';
  if (value < 40) return 'bg-primary-100 hover:bg-primary-200';
  if (value < 60) return 'bg-primary-200 hover:bg-primary-300';
  if (value < 80) return 'bg-primary-400 hover:bg-primary-500';
  return 'bg-gradient-danger hover:opacity-90';
};

const getTextColor = (value: number): string => {
  return value >= 60 ? 'text-white' : 'text-neutral-700';
};

export default function HeatMapChart() {
  const [hoveredCell, setHoveredCell] = useState<HeatMapData | null>(null);

  const stats = {
    avg: Math.round(heatMapData.reduce((s, d) => s + d.value, 0) / heatMapData.length),
    peak: Math.max(...heatMapData.map(d => d.value)),
    peakHour:
      hours[
        hours.reduce(
          (bestIdx, _, idx) => {
            const avgCurr =
              heatMapData.filter(d => d.hour === hours[idx]).reduce((s, d) => s + d.value, 0) / 7;
            const avgBest =
              heatMapData.filter(d => d.hour === hours[bestIdx]).reduce((s, d) => s + d.value, 0) / 7;
            return avgCurr > avgBest ? idx : bestIdx;
          },
          0
        )
      ],
    low: Math.min(...heatMapData.filter(d => d.value > 0).map(d => d.value)),
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '平均利用率', value: `${stats.avg}%`, color: 'text-primary-600' },
          { label: '峰值利用率', value: `${stats.peak}%`, color: 'text-danger-500' },
          { label: '高峰时段', value: `${stats.peakHour}:00`, color: 'text-accent-600' },
          { label: '最低利用率', value: `${stats.low}%`, color: 'text-success-600' },
        ].map(s => (
          <div
            key={s.label}
            className="p-3 rounded-xl bg-neutral-50 border border-neutral-100"
          >
            <div className="text-[10px] text-neutral-400 mb-1">{s.label}</div>
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="relative overflow-x-auto pb-2 -mx-2 px-2">
        <div className="min-w-[600px]">
          <div className="grid" style={{ gridTemplateColumns: `70px repeat(${hours.length}, minmax(42px, 1fr))` }}>
            <div className="py-2" />
            {hours.map(h => (
              <div
                key={h}
                className="py-2 text-center text-[10px] font-medium text-neutral-500"
              >
                {h}:00
              </div>
            ))}

            {weekdays.map(day => (
              <Fragment key={day}>
                <div
                  className="py-2 flex items-center pr-2 text-[11px] font-medium text-neutral-600"
                >
                  {day}
                </div>
                {hours.map(h => {
                  const cell = heatMapData.find(d => d.day === day && d.hour === h);
                  const value = cell?.value ?? 0;
                  return (
                    <div
                      key={`${day}-${h}`}
                      className="p-0.5"
                      onMouseEnter={() => cell && setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div
                        className={`h-9 rounded-md transition-all cursor-pointer ${getColorClass(
                          value
                        )} relative group`}
                      >
                        <div
                          className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold ${getTextColor(
                            value
                          )} opacity-0 group-hover:opacity-100 transition-opacity`}
                        >
                          {value}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-neutral-500">低</span>
          <div className="flex gap-1">
            <div className="w-6 h-4 rounded bg-accent-100" />
            <div className="w-6 h-4 rounded bg-primary-100" />
            <div className="w-6 h-4 rounded bg-primary-200" />
            <div className="w-6 h-4 rounded bg-primary-400" />
            <div className="w-6 h-4 rounded bg-gradient-danger" />
          </div>
          <span className="text-[10px] text-neutral-500">高</span>
        </div>

        {hoveredCell ? (
          <div className="px-4 py-2 rounded-xl bg-neutral-800 text-white text-xs shadow-xl animate-fade-in">
            <span className="font-semibold text-accent-300">{hoveredCell.day}</span>
            <span className="mx-2 text-neutral-400">·</span>
            <span>{hoveredCell.hour}:00-{hoveredCell.hour + 1}:00</span>
            <span className="mx-2 text-neutral-400">·</span>
            <span>{hoveredCell.roomName}</span>
            <span className="mx-2 text-neutral-400">·</span>
            <span className="font-bold text-accent-300">{hoveredCell.value}%</span>
          </div>
        ) : (
          <div className="text-[10px] text-neutral-400">悬停色块查看详情</div>
        )}
      </div>
    </div>
  );
}
