import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type GradientVariant = 'blue' | 'cyan' | 'green' | 'orange';

interface GradientConfig {
  bg: string;
  iconBg: string;
  text: string;
}

const gradients: Record<GradientVariant, GradientConfig> = {
  blue: {
    bg: 'from-primary-500 via-primary-400 to-primary-600',
    iconBg: 'bg-white/20',
    text: 'text-white',
  },
  cyan: {
    bg: 'from-accent-500 via-accent-400 to-accent-600',
    iconBg: 'bg-white/20',
    text: 'text-white',
  },
  green: {
    bg: 'from-emerald-500 via-emerald-400 to-emerald-600',
    iconBg: 'bg-white/20',
    text: 'text-white',
  },
  orange: {
    bg: 'from-warning-500 via-orange-400 to-warning-600',
    iconBg: 'bg-white/20',
    text: 'text-white',
  },
};

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  trendLabel?: string;
  variant?: GradientVariant;
  suffix?: string;
  className?: string;
}

export default function KPICard({
  title,
  value,
  icon,
  trend,
  trendLabel = '较上月',
  variant = 'blue',
  suffix,
  className,
}: KPICardProps) {
  const config = gradients[variant];
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl p-6 text-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover',
        `bg-gradient-to-br ${config.bg}`,
        className,
      )}
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl transition-transform duration-500 group-hover:scale-125" />
      <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-black/5 blur-2xl" />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl backdrop-blur-sm',
              config.iconBg,
            )}
          >
            <span className="h-6 w-6 text-white">
              {icon}
            </span>
          </div>
          {trend !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm',
                isPositive
                  ? 'bg-white/20 text-white'
                  : 'bg-white/20 text-white',
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              <span>{isPositive ? '+' : ''}{trend}%</span>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-1">
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="text-3xl font-bold tracking-tight">
            {value}
            {suffix && <span className="text-lg font-medium ml-1 opacity-90">{suffix}</span>}
          </p>
          {trendLabel && (
            <p className="text-xs text-white/60">{trendLabel}</p>
          )}
        </div>
      </div>
    </div>
  );
}
