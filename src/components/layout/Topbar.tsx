import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Settings as SettingsIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User as UserType } from '@/types';
import { mockUsers } from '@/data/users';

interface TopbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Topbar({ sidebarOpen, onToggleSidebar }: TopbarProps) {
  const currentUser: UserType = mockUsers[0];
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = 5;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 transition-all duration-300',
        sidebarOpen ? 'left-64' : 'left-20',
        'lg:left-[inherit] lg:right-0',
      )}
      style={{ left: sidebarOpen ? '256px' : '80px' }}
    >
      <div className="flex h-full items-center justify-between gap-4 border-b border-neutral-200 bg-white/80 px-4 backdrop-blur-lg sm:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="hidden rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-primary-500 lg:block"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-primary-500 lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索会议、人员、会议室..."
              className="w-64 rounded-xl border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm text-neutral-700 placeholder-neutral-400 outline-none transition-all focus:w-80 focus:border-accent-400 focus:bg-white focus:ring-2 focus:ring-accent-100"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-xl p-2 text-neutral-500 transition-all hover:bg-neutral-100 hover:text-primary-500"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-danger-500 to-danger-600 px-1 text-[10px] font-bold text-white shadow-md">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card animate-slide-up z-50">
                <div className="border-b border-neutral-100 bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3">
                  <h3 className="font-semibold text-white">通知中心</h3>
                  <p className="text-xs text-white/70">{unreadCount} 条未读消息</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="cursor-pointer border-b border-neutral-50 px-4 py-3 transition-colors hover:bg-neutral-50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-accent-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-800">
                            会议提醒：Q2季度总结会
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            将于今天下午 14:00 在 301会议室 开始
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button className="rounded-xl p-2 text-neutral-500 transition-all hover:bg-neutral-100 hover:text-primary-500">
            <HelpCircle className="h-5 w-5" />
          </button>

          <div className="mx-2 h-8 w-px bg-neutral-200" />

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 rounded-xl p-1.5 pr-3 transition-all hover:bg-neutral-100"
            >
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-9 w-9 rounded-xl object-cover ring-2 ring-white shadow-md"
                />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-success-500" />
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-neutral-800">
                  {currentUser.name}
                </p>
                <p className="text-xs text-neutral-500">{currentUser.department}</p>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-neutral-400 transition-transform',
                  showUserMenu && 'rotate-180',
                )}
              />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card animate-slide-up z-50">
                <div className="border-b border-neutral-100 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                    <div>
                      <p className="font-semibold text-neutral-800">
                        {currentUser.name}
                      </p>
                      <p className="text-xs text-neutral-500">{currentUser.email}</p>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  <button className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50">
                    <User className="h-4 w-4 text-neutral-400" />
                    个人资料
                  </button>
                  <button className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50">
                    <SettingsIcon className="h-4 w-4 text-neutral-400" />
                    账户设置
                  </button>
                </div>
                <div className="border-t border-neutral-100 py-2">
                  <button className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-danger-500 transition-colors hover:bg-danger-50">
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-neutral-200 bg-white px-4 py-3 md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索会议、人员、会议室..."
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm text-neutral-700 placeholder-neutral-400 outline-none transition-all focus:border-accent-400 focus:bg-white focus:ring-2 focus:ring-accent-100"
          />
        </div>
      </div>
    </header>
  );
}
