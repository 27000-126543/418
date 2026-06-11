import { useState } from 'react';
import type { User, AttendanceStatus } from '@/types';
import { cn } from '@/lib/utils';

interface AvatarItem {
  user: User;
  status?: AttendanceStatus;
}

interface AvatarMatrixProps {
  avatars: AvatarItem[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

const sizeConfig = {
  sm: { avatar: 'h-7 w-7', ring: 'ring-2', text: 'text-xs', overlap: '-space-x-2', extra: 'h-7 w-7 text-xs' },
  md: { avatar: 'h-9 w-9', ring: 'ring-2', text: 'text-sm', overlap: '-space-x-3', extra: 'h-9 w-9 text-sm' },
  lg: { avatar: 'h-11 w-11', ring: 'ring-3', text: 'text-base', overlap: '-space-x-4', extra: 'h-11 w-11 text-base' },
};

const statusColors: Record<AttendanceStatus, string> = {
  confirmed: 'bg-success-500',
  tentative: 'bg-warning-500',
  declined: 'bg-danger-500',
  late: 'bg-orange-500',
  absent: 'bg-red-500',
  pending: 'bg-neutral-400',
};

function getInitials(name: string): string {
  return name
    .split('')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getGradientFromName(name: string): string {
  const gradients = [
    'from-primary-400 to-primary-600',
    'from-accent-400 to-accent-600',
    'from-emerald-400 to-emerald-600',
    'from-purple-400 to-purple-600',
    'from-pink-400 to-pink-600',
    'from-indigo-400 to-indigo-600',
  ];
  const index = name.charCodeAt(0) % gradients.length;
  return gradients[index];
}

export default function AvatarMatrix({
  avatars,
  max = 5,
  size = 'md',
  className,
  showTooltip = true,
}: AvatarMatrixProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const styles = sizeConfig[size];
  const displayAvatars = avatars.slice(0, max);
  const extraCount = Math.max(0, avatars.length - max);

  return (
    <div className={cn('relative inline-flex items-center', styles.overlap, className)}>
      {displayAvatars.map((item, index) => (
        <div
          key={item.user.id}
          className="relative group"
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <div
            className={cn(
              'relative inline-block rounded-full bg-gradient-to-br overflow-hidden transition-transform duration-200',
              styles.avatar,
              styles.ring,
              'ring-white',
              hoveredIndex === index && 'scale-110 z-10',
              !item.user.avatar && getGradientFromName(item.user.name),
            )}
          >
            {item.user.avatar ? (
              <img
                src={item.user.avatar}
                alt={item.user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className={cn(
                  'flex h-full w-full items-center justify-center font-semibold text-white',
                  styles.text,
                )}
              >
                {getInitials(item.user.name)}
              </div>
            )}

            {item.status && (
              <span
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white',
                  statusColors[item.status],
                  size === 'sm' ? 'h-2 w-2' : size === 'lg' ? 'h-3.5 w-3.5' : 'h-3 w-3',
                )}
              />
            )}
          </div>

          {showTooltip && hoveredIndex === index && (
            <div className="absolute bottom-full left-1/2 z-50 mb-3 -translate-x-1/2 animate-fade-in">
              <div className="whitespace-nowrap rounded-xl bg-neutral-800 px-4 py-2 text-center shadow-lg">
                <p className="text-sm font-semibold text-white">{item.user.name}</p>
                <p className="text-xs text-neutral-300">{item.user.department}</p>
                {item.status && (
                  <p className="mt-1 text-xs text-neutral-400">
                    {item.status === 'confirmed' && '已确认出席'}
                    {item.status === 'tentative' && '待定'}
                    {item.status === 'declined' && '已拒绝'}
                    {item.status === 'late' && '迟到'}
                    {item.status === 'absent' && '缺席'}
                    {item.status === 'pending' && '待回复'}
                  </p>
                )}
              </div>
              <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-neutral-800" />
            </div>
          )}
        </div>
      ))}

      {extraCount > 0 && (
        <div
          className={cn(
            'relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 font-semibold text-neutral-600 transition-transform duration-200 hover:scale-110 hover:z-10 cursor-pointer',
            styles.extra,
            styles.ring,
            'ring-white',
          )}
        >
          +{extraCount}
        </div>
      )}
    </div>
  );
}
