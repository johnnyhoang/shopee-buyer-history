import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { RefundTrackerView } from './components/RefundTrackerView';
import { AllOrdersView } from './components/AllOrdersView';
import { AnalyticsView } from './components/AnalyticsView';
import { ExtensionGuideView } from './components/ExtensionGuideView';
import { OrderDetailModal } from './components/OrderDetailModal';
import { AccountManagerModal } from './components/AccountManagerModal';
import { SyncModal } from './components/SyncModal';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const MainContent = () => {
  const { activeTab, notification } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Floating Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className={`p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-semibold ${
            notification.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : notification.type === 'warning'
              ? 'bg-amber-900 text-amber-100 border-amber-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}>
            {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {notification.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />}
            {notification.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        <StatsOverview />

        {/* Dynamic Tab Views */}
        {activeTab === 'refunds' && <RefundTrackerView />}
        {activeTab === 'all-orders' && <AllOrdersView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'extension-guide' && <ExtensionGuideView />}
      </main>

      {/* Modals */}
      <OrderDetailModal />
      <AccountManagerModal />
      <SyncModal />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          Shopee Buyer History & Refund Tracker • Giải pháp quản lý mua sắm & đối soát tiền hoàn trả an toàn
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
