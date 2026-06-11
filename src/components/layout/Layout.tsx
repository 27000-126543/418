import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface LayoutProps {
  className?: string;
}

export default function Layout({ className }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <Topbar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

      <main
        className={cn(
          'min-h-screen pt-16 transition-all duration-300',
          sidebarOpen ? 'md:ml-64' : 'md:ml-20',
        )}
        style={{ marginLeft: sidebarOpen ? '256px' : '80px' }}
      >
        <div
          className={cn(
            'mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8',
            className,
          )}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
