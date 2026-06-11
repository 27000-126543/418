import { useState, useMemo } from 'react';
import {
  Coffee,
  Utensils,
  Plus,
  Minus,
  Clock,
  DollarSign,
  ChefHat,
  Apple,
  Cookie,
  Soup,
  Wine,
} from 'lucide-react';
import { useResourceStore } from '@/store/useResourceStore';
import type { CateringOption, CateringType } from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatters';

const cateringTypeConfig: Record<CateringType | 'all', { label: string; icon: typeof Coffee; color: string }> = {
  all: {
    label: '全部',
    icon: ChefHat,
    color: 'from-primary-500 to-primary-600',
  },
  coffee: {
    label: '咖啡',
    icon: Coffee,
    color: 'from-amber-600 to-amber-700',
  },
  tea: {
    label: '茶饮',
    icon: Wine,
    color: 'from-emerald-600 to-emerald-700',
  },
  snacks: {
    label: '点心',
    icon: Cookie,
    color: 'from-orange-500 to-orange-600',
  },
  lunch: {
    label: '午餐',
    icon: Utensils,
    color: 'from-rose-500 to-rose-600',
  },
  dinner: {
    label: '晚餐',
    icon: Soup,
    color: 'from-indigo-500 to-indigo-600',
  },
  fruit: {
    label: '水果',
    icon: Apple,
    color: 'from-red-500 to-red-600',
  },
};

interface CateringPickerProps {
  selectedQuantities?: Record<string, number>;
  onChange?: (quantities: Record<string, number>) => void;
  expectedAttendees?: number;
  className?: string;
}

export default function CateringPicker({
  selectedQuantities = {},
  onChange,
  expectedAttendees = 1,
  className,
}: CateringPickerProps) {
  const { cateringOptions } = useResourceStore();
  const [activeType, setActiveType] = useState<CateringType | 'all'>('all');

  const cateringTypes: Array<CateringType> = ['coffee', 'tea', 'snacks', 'lunch', 'dinner', 'fruit'];

  const filteredOptions = useMemo(() => {
    if (activeType === 'all') return cateringOptions;
    return cateringOptions.filter((c) => c.type === activeType);
  }, [cateringOptions, activeType]);

  const subtotals = useMemo(() => {
    return Object.entries(selectedQuantities).reduce((acc, [id, qty]) => {
      const option = cateringOptions.find((c) => c.id === id);
      if (option) {
        acc[id] = option.pricePerPerson * qty;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [selectedQuantities, cateringOptions]);

  const totalAmount = useMemo(() => {
    return Object.values(subtotals).reduce((sum, val) => sum + val, 0) * expectedAttendees;
  }, [subtotals, expectedAttendees]);

  const totalItems = useMemo(() => {
    return Object.values(selectedQuantities).reduce((sum, qty) => sum + qty, 0);
  }, [selectedQuantities]);

  const handleQuantityChange = (cateringId: string, delta: number) => {
    if (!onChange) return;
    const currentQty = selectedQuantities[cateringId] || 0;
    const newQty = Math.max(0, currentQty + delta);

    const newQuantities = { ...selectedQuantities };
    if (newQty === 0) {
      delete newQuantities[cateringId];
    } else {
      newQuantities[cateringId] = newQty;
    }
    onChange(newQuantities);
  };

  return (
    <div className={cn('bg-white rounded-2xl shadow-card p-6', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary-800">餐饮服务</h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              选择饮品和餐食 · {totalItems} 项已选
            </p>
          </div>
        </div>

        {totalAmount > 0 && (
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl px-5 py-3 text-right">
            <div className="text-xs text-neutral-500 mb-0.5">
              预估总额 · {expectedAttendees} 人
            </div>
            <div className="flex items-center gap-1 justify-end">
              <DollarSign className="w-4 h-4 text-primary-600" />
              <span className="text-xl font-bold text-primary-700">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mb-6 overflow-x-auto pb-2 -mx-2 px-2">
        <div className="flex items-center gap-2 min-w-max">
          {(Object.keys(cateringTypeConfig) as Array<CateringType | 'all'>).map((type) => {
            const config = cateringTypeConfig[type];
            const Icon = config.icon;
            const count =
              type === 'all'
                ? cateringOptions.length
                : cateringOptions.filter((c) => c.type === type).length;

            return (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap',
                  activeType === type
                    ? ['bg-gradient-to-br', 'text-white', 'shadow-md', config.color]
                    : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100',
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{config.label}</span>
                <span className={cn(
                  'px-1.5 py-0.5 rounded-md text-[10px] font-bold',
                  activeType === type ? 'bg-white/20 text-white/90' : 'bg-white text-neutral-500',
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredOptions.map((option, index) => (
          <CateringCard
            key={option.id}
            option={option}
            index={index}
            quantity={selectedQuantities[option.id] || 0}
            subtotal={subtotals[option.id] || 0}
            onIncrease={() => handleQuantityChange(option.id, 1)}
            onDecrease={() => handleQuantityChange(option.id, -1)}
          />
        ))}
      </div>

      {filteredOptions.length === 0 && (
        <div className="py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
            <ChefHat className="w-8 h-8 text-neutral-300" />
          </div>
          <p className="text-neutral-400">该分类暂无餐饮选项</p>
        </div>
      )}
    </div>
  );
}

interface CateringCardProps {
  option: CateringOption;
  index: number;
  quantity: number;
  subtotal: number;
  onIncrease: () => void;
  onDecrease: () => void;
}

function CateringCard({
  option,
  index,
  quantity,
  subtotal,
  onIncrease,
  onDecrease,
}: CateringCardProps) {
  const typeConfig = cateringTypeConfig[option.type];
  const TypeIcon = typeConfig.icon;
  const hasQuantity = quantity > 0;

  return (
    <div
      className={cn(
        'group relative rounded-xl overflow-hidden border transition-all duration-300',
        'animate-slide-up',
        hasQuantity
          ? 'border-accent-300 shadow-lg bg-white'
          : 'border-neutral-100 hover:border-primary-200 hover:shadow-md bg-white',
      )}
      style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}
    >
      <div className="relative h-40 overflow-hidden bg-neutral-100">
        <img
          src={option.image}
          alt={option.name}
          className={cn(
            'w-full h-full object-cover transition-transform duration-500',
            'group-hover:scale-110',
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        <div className={cn(
          'absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-md',
          'bg-white/90 backdrop-blur-sm text-neutral-700',
        )}>
          <TypeIcon className="w-3 h-3" />
          {typeConfig.label}
        </div>

        {hasQuantity && (
          <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gradient-accent flex items-center justify-center text-white text-xs font-bold shadow-glow animate-pulse-once">
            {quantity}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-primary-800 text-sm leading-tight">
            {option.name}
          </h3>
        </div>

        <div className="flex items-center justify-between mb-3 text-xs text-neutral-500">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-primary-400" />
            <span className="font-medium text-primary-600">
              {formatCurrency(option.pricePerPerson)}/人
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-warning-500" />
            <span>{option.preparationTime}分钟</span>
          </div>
        </div>

        {hasQuantity && (
          <div className="mb-3 px-3 py-2 bg-accent-50 rounded-lg text-center animate-fade-in">
            <span className="text-xs text-neutral-500">小计 · </span>
            <span className="text-sm font-bold text-accent-600">
              {formatCurrency(subtotal)}/人
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className={cn(
            'flex items-center gap-3 transition-all duration-200',
            hasQuantity
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95 pointer-events-none absolute',
          )}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDecrease();
              }}
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200',
                quantity === 1
                  ? 'bg-danger-50 text-danger-500 hover:bg-danger-100'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
              )}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-primary-700 text-lg">
              {quantity}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onIncrease();
            }}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200',
              hasQuantity
                ? 'bg-gradient-accent text-white shadow-md shadow-accent-500/30 hover:shadow-lg hover:shadow-accent-500/40'
                : 'w-full bg-gradient-primary text-white shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 justify-center',
            )}
          >
            <Plus className={cn(
              'w-4 h-4 transition-transform duration-200',
              'group-hover:rotate-90',
            )} />
            {hasQuantity ? '添加' : '选择'}
          </button>
        </div>
      </div>
    </div>
  );
}
