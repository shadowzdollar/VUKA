import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Button, Badge } from "../../components";

export function TraderDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const navigation = [
    { name: 'Overview', href: '/trader', icon: '📊' },
    { name: 'Send Money', href: '/trader/send', icon: '💸' },
    { name: 'Activity', href: '/trader/activity', icon: '📋' },
    { name: 'Invoices', href: '/trader/invoices', icon: '📄' },
    { name: 'Recipients', href: '/trader/recipients', icon: '👥' },
    { name: 'Escrow', href: '/trader/escrow', icon: '🔒' },
    { name: 'Trust Score', href: '/trader/trust', icon: '⭐' },
    { name: 'Reports', href: '/trader/reports', icon: '📈' },
    { name: 'Support', href: '/trader/support', icon: '💬' },
    { name: 'Settings', href: '/trader/settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">V</span>
              </div>
              <div>
                <span className="font-bold text-black">VUKA</span>
                <span className="block text-xs text-gray-500">TRADER</span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-black"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 hover:text-black transition-colors"
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Info */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold">
                JD
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-black">John Doe</div>
                <div className="text-xs text-gray-500">+250 700 000 000</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-3">
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-black"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center space-x-4">
            <Badge variant="info">3 Unread</Badge>
            <Button variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
