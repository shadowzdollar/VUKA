import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Button, Badge } from "../../components";

export function OperatorDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const navigation = [
    { name: 'Overview', href: '/operator', icon: '📊' },
    { name: 'Escrows', href: '/operator/escrows', icon: '🔒' },
    { name: 'Reconciliation', href: '/operator/reconciliation', icon: '🔄' },
    { name: 'Providers', href: '/operator/providers', icon: '📡' },
    { name: 'Settlements', href: '/operator/settlements', icon: '💰' },
    { name: 'Disputes', href: '/operator/disputes', icon: '⚖️' },
    { name: 'Compliance', href: '/operator/compliance', icon: '✅' },
    { name: 'Activity', href: '/operator/activity', icon: '📋' },
    { name: 'Analytics', href: '/operator/analytics', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">V</span>
              </div>
              <div>
                <span className="font-bold text-black">VUKA</span>
                <span className="block text-xs text-gray-500">OPERATOR</span>
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

          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold">
                OP
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-black">Operator</div>
                <div className="text-xs text-gray-500">System Admin</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-3">
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
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
            <Badge variant="success">System Healthy</Badge>
            <Button variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
