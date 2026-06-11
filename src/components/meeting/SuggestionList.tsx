import {
  Lightbulb,
  Clock,
  MapPin,
  ArrowRight,
  Sparkles,
  Check,
  TrendingUp,
  Calendar,
  Building2,
  Shuffle,
} from 'lucide-react';
import type { AlternativeSuggestion } from '@/types';
import { cn } from '@/lib/utils';

interface SuggestionListProps {
  suggestions: AlternativeSuggestion[];
  originalStartTime?: Date;
  originalEndTime?: Date;
  originalRoomName?: string;
  onApply?: (suggestion: AlternativeSuggestion) => void;
  className?: string;
}

function formatDateTime(date: Date): string {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = d.getHours().toString().padStart(2, '0');
  const minute = d.getMinutes().toString().padStart(2, '0');
  return `${month}月${day}日 ${hour}:${minute}`;
}

function formatTimeOnly(date: Date): string {
  const d = new Date(date);
  const hour = d.getHours().toString().padStart(2, '0');
  const minute = d.getMinutes().toString().padStart(2, '0');
  return `${hour}:${minute}`;
}

const adjustmentConfig: Record<'time' | 'room' | 'both', {
  label: string;
  icon: typeof Clock;
  color: string;
  badgeClass: string;
}> = {
  time: {
    label: '仅调整时间',
    icon: Clock,
    color: 'from-blue-500 to-indigo-500',
    badgeClass: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  room: {
    label: '仅调整地点',
    icon: Building2,
    color: 'from-emerald-500 to-teal-500',
    badgeClass: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
  both: {
    label: '综合调整',
    icon: Shuffle,
    color: 'from-violet-500 to-purple-500',
    badgeClass: 'bg-violet-50 text-violet-600 border-violet-200',
  },
};

export default function SuggestionList({
  suggestions,
  originalStartTime,
  originalEndTime,
  originalRoomName,
  onApply,
  className,
}: SuggestionListProps) {
  if (suggestions.length === 0) return null;

  const sortedSuggestions = [...suggestions].sort((a, b) => b.confidence - a.confidence);

  return (
    <div className={cn('bg-white rounded-2xl shadow-card overflow-hidden', className)}>
      <div className="relative bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 p-6 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDE1IEwgNjAgMTUgTSAxNSAwIEwgMTUgNjAgTSAwIDMwIEwgNjAgMzAgTSAzMCAwIEwgMzAgNjAgTSAwIDQ1IEwgNjAgNDUgTSA0NSAwIEwgNDUgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA4Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]" />
        <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-20 top-0 w-32 h-32 rounded-full bg-accent-400/20 blur-3xl" />

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="shrink-0 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Lightbulb className="w-7 h-7 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">为您推荐以下替代方案</h2>
                <span className="px-2 py-0.5 rounded-full bg-yellow-300/90 text-yellow-900 text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  智能推荐
                </span>
              </div>
              <p className="text-sm text-white/80">
                共找到 {sortedSuggestions.length} 个可行方案，按推荐度排序
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm">
            <TrendingUp className="w-4 h-4 text-accent-300" />
            <span className="text-xs text-white/90">
              推荐度 {sortedSuggestions[0]?.confidence || 0}%
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {sortedSuggestions.map((suggestion, index) => {
          const config = adjustmentConfig[suggestion.adjustmentType];
          const Icon = config.icon;
          const timeChanged =
            new Date(suggestion.suggestedStartTime).getTime() !==
            new Date(suggestion.originalStartTime).getTime();
          const roomChanged = suggestion.suggestedRoomName !== originalRoomName;

          return (
            <div
              key={suggestion.id}
              className={cn(
                'relative rounded-xl border-2 transition-all duration-300 overflow-hidden',
                'animate-slide-up',
                index === 0
                  ? 'border-accent-300 bg-gradient-to-br from-accent-50/50 to-white shadow-lg'
                  : 'border-neutral-100 bg-white hover:border-primary-200 hover:shadow-md',
              )}
              style={{ animationDelay: `${index * 80}ms`, opacity: 0 }}
            >
              {index === 0 && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-accent" />
              )}

              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn(
                      'shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-md',
                      config.color,
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-primary-800">
                          方案 {index + 1}
                        </h3>
                        <span className={cn(
                          'px-2.5 py-0.5 rounded-full text-[11px] font-medium border',
                          config.badgeClass,
                        )}>
                          {config.label}
                        </span>
                        {index === 0 && (
                          <span className="px-2.5 py-0.5 rounded-full bg-gradient-accent text-white text-[11px] font-bold flex items-center gap-1 shadow-sm">
                            <Sparkles className="w-3 h-3" />
                            最佳方案
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        {suggestion.adjustmentReason}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-xs text-neutral-400 mb-1">推荐度</div>
                    <div className="relative w-24 h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-1000 ease-out',
                          index === 0
                            ? 'bg-gradient-accent'
                            : 'bg-gradient-to-r from-primary-400 to-primary-500',
                        )}
                        style={{ width: `${suggestion.confidence}%` }}
                      />
                    </div>
                    <div className="text-sm font-bold text-primary-600 mt-1">
                      {suggestion.confidence}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="relative rounded-xl p-3 bg-neutral-50 border border-neutral-200">
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-danger-400" />
                      原方案
                    </div>
                    <div className="space-y-2">
                      {originalStartTime && originalEndTime && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className={cn(
                            'text-neutral-600',
                            timeChanged && 'line-through text-danger-500',
                          )}>
                            {formatDateTime(originalStartTime)} - {formatTimeOnly(originalEndTime)}
                          </span>
                        </div>
                      )}
                      {originalRoomName && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className={cn(
                            'text-neutral-600',
                            roomChanged && 'line-through text-danger-500',
                          )}>
                            {originalRoomName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative rounded-xl p-3 bg-success-50 border border-success-200">
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 md:block hidden">
                      <div className="w-4 h-4 rounded-full bg-success-500 flex items-center justify-center shadow-md">
                        <ArrowRight className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-success-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-success-500" />
                      建议方案
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3.5 h-3.5 text-success-500 shrink-0" />
                        <span className={cn(
                          'font-medium',
                          timeChanged ? 'text-success-700' : 'text-neutral-600',
                        )}>
                          {formatDateTime(suggestion.suggestedStartTime)} - {formatTimeOnly(suggestion.suggestedEndTime)}
                        </span>
                        {timeChanged && (
                          <span className="px-1.5 py-0.5 rounded bg-success-100 text-success-700 text-[10px] font-bold">
                            调整
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className={cn(
                          'font-medium',
                          roomChanged ? 'text-success-700' : 'text-neutral-600',
                        )}>
                          {suggestion.suggestedRoomName || originalRoomName || '未指定'}
                        </span>
                        {roomChanged && (
                          <span className="px-1.5 py-0.5 rounded bg-success-100 text-success-700 text-[10px] font-bold">
                            调整
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {suggestion.conflictsResolved.length > 0 && (
                  <div className="mb-4 px-3 py-2 bg-primary-50/50 rounded-lg flex items-start gap-2">
                    <Check className="w-4 h-4 text-success-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-600">
                      可解决 <span className="font-bold text-success-600">{suggestion.conflictsResolved.length}</span> 个资源冲突问题
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-neutral-400">
                    {timeChanged && roomChanged
                      ? '时间和地点均已优化调整'
                      : timeChanged
                        ? '时间已优化，地点保持不变'
                        : '地点已优化，时间保持不变'}
                  </div>
                  <button
                    onClick={() => onApply?.(suggestion)}
                    className={cn(
                      'flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200',
                      index === 0
                        ? 'bg-gradient-accent text-white shadow-lg shadow-accent-500/30 hover:shadow-xl hover:shadow-accent-500/40 hover:-translate-y-0.5'
                        : 'bg-gradient-primary text-white shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5',
                    )}
                  >
                    <Check className="w-4 h-4" />
                    应用此方案
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
