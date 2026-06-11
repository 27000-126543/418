import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarClock,
  Video,
  Bell,
  FileBarChart,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { to: '/meetings', label: '会议管理', icon: CalendarClock },
  { to: '/meetings/create', label: '发起会议', icon: Video },
  { to: '/notifications', label: '通知中心', icon: Bell },
  { to: '/reports', label: '报表导出', icon: FileBarChart },
  { to: '/statistics', label: '数据统计', icon: BarChart3 },
  { to: '/settings', label: '系统设置', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-gradient-to-b from-primary-500 to-primary-700 text-white transition-all duration-300 ease-in-out',
        isOpen ? 'w-64' : 'w-20',
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 shadow-glow">
            <BrainCircuit className="h-6 w-6 text-white" />
          </div>
          <div
            className={cn(
              'flex flex-col overflow-hidden transition-all duration-300',
              isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0',
            )}
          >
            <span className="font-display text-lg font-bold tracking-wide">智能会议</span>
            <span className="text-xs text-accent-200">管理平台</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200',
                  isActive
                    ? 'bg-white/15 text-white shadow-inner'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-accent-300 to-accent-500 transition-all duration-200',
                      isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50',
                    )}
                  />
                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0 transition-transform duration-200',
                      isActive ? 'text-accent-300' : '',
                    )}
                  />
                  <span
                    className={cn(
                      'whitespace-nowrap text-sm font-medium transition-all duration-300',
                      isOpen ? 'opacity-100' : 'w-0 opacity-0',
                    )}
                  >
                    {item.label}
                  </span>
                  {isActive && isOpen && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-accent-400 shadow-glow" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-xl bg-white/10 p-2 text-white/80 transition-all hover:bg-white/20 hover:text-white"
        >
          {isOpen ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
