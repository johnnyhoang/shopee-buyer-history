import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/LoginScreen';
import { LedgerHeader } from './components/LedgerHeader';
import { RefundLedgerTable } from './components/RefundLedgerTable';
import { FullHistoryLedgerTable } from './components/FullHistoryLedgerTable';
import { ExtensionGuideView } from './components/ExtensionGuideView';
import { OrderDetailModal } from './components/OrderDetailModal';
import { AccountManagerModal } from './components/AccountManagerModal';
import { SyncModal } from './components/SyncModal';
import { 
  BookOpen, 
  RotateCcw, 
  Layers, 
  Puzzle, 
  CheckCircle2, 
  AlertCircle, 
  Info 
} from 'lucide-react';

const MainLayout = () => {
  const { isAuthenticated } = useAuth();
  const { activeTab, setActiveTab, ledgerTotals, notification } = useApp();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans">
      <LedgerHeader />

      {/* Floating Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className={`p-3.5 rounded-xl shadow-xl flex items-center gap-2.5 border text-xs font-bold ${
            notification.type === 'success'
              ? 'bg-slate-900 text-emerald-300 border-slate-700'
              : notification.type === 'warning'
              ? 'bg-slate-900 text-rose-300 border-slate-700'
              : 'bg-slate-900 text-amber-300 border-slate-700'
          }`}>
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {notification.type === 'warning' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {notification.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="bg-white border-b border-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2 py-1.5 overflow-x-auto text-xs">
            
            {/* Tab 1: Sổ đối soát hoàn tiền (Mặc định) */}
            <button
              onClick={() => setActiveTab('refund-ledger')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg font-bold transition-all ${
                activeTab === 'refund-ledger'
                  ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sổ Đối Soát Hoàn Tiền (Đơn Trả & Hủy)</span>
              {ledgerTotals.pendingCount > 0 && (
                <span className="bg-slate-900 text-amber-400 text-[10px] font-mono font-black px-1.5 py-0.2 rounded">
                  {ledgerTotals.pendingCount}
                </span>
              )}
            </button>

            {/* Tab 2: Sổ tất cả đơn mua */}
            <button
              onClick={() => setActiveTab('all-ledger')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg font-bold transition-all ${
                activeTab === 'all-ledger'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Sổ Nhật Ký Toàn Bộ Đơn Mua</span>
            </button>

            {/* Tab 3: Hướng dẫn quét đơn Shopee */}
            <button
              onClick={() => setActiveTab('sync-guide')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg font-bold transition-all ${
                activeTab === 'sync-guide'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Puzzle className="w-3.5 h-3.5" />
              <span>Tiện Ích Tự Động Quét Shopee</span>
            </button>

          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1">
        {activeTab === 'refund-ledger' && <RefundLedgerTable />}
        {activeTab === 'all-ledger' && <FullHistoryLedgerTable />}
        {activeTab === 'sync-guide' && <ExtensionGuideView />}
      </main>

      {/* Modals */}
      <OrderDetailModal />
      <AccountManagerModal />
      <SyncModal />

      {/* Footer */}
      <footer className="border-t border-slate-300 bg-white py-3 text-center text-xs text-slate-500 font-mono">
        Shopee Accounting Ledger • Sổ Kế Toán & Đối Soát Hoàn Tiền Mua Sắm Cục Bộ
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </AuthProvider>
  );
}
