import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingBag, 
  RotateCcw, 
  Layers, 
  BarChart3, 
  Users, 
  DownloadCloud, 
  RefreshCw, 
  Puzzle, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const Navbar = () => {
  const { 
    accounts, 
    activeAccountId, 
    handleSelectAccount, 
    activeTab, 
    setActiveTab, 
    stats,
    setIsAccountModalOpen,
    setIsSyncModalOpen,
    resetSampleData
  } = useApp();

  const activeAccount = accounts.find(a => a.id === activeAccountId);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & App Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20 text-white font-bold text-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-800 text-lg tracking-tight">Shopee Order & Refund Tracker</span>
                <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-orange-200">
                  Đối soát đơn mua
                </span>
              </div>
              <p className="text-xs text-slate-500">Quản lý lịch sử mua hàng & Theo dõi tiền hoàn trả hàng / hủy đơn</p>
            </div>
          </div>

          {/* Account Selector & Action Buttons */}
          <div className="flex items-center space-x-3">
            
            {/* Account Switcher Dropdown */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <span className="text-xs font-medium text-slate-500 pl-2 pr-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Người mua:
              </span>
              <select
                value={activeAccountId}
                onChange={(e) => handleSelectAccount(e.target.value)}
                aria-label="Chọn tài khoản người mua Shopee"
                className="bg-white text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value="ALL">🌟 Tất cả tài khoản ({accounts.length})</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    👤 {acc.name} {acc.username ? `(@${acc.username})` : ''}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setIsAccountModalOpen(true)}
                title="Quản lý danh sách tài khoản"
                className="ml-1 p-1.5 text-slate-500 hover:text-orange-600 hover:bg-white rounded-lg transition-colors"
              >
                <Users className="w-4 h-4" />
              </button>
            </div>

            {/* Sync Button */}
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-sm shadow-orange-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Đồng bộ đơn hàng</span>
            </button>

            {/* Reset / Demo Data menu */}
            <button
              onClick={resetSampleData}
              title="Khôi phục dữ liệu mẫu"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 border-t border-slate-100 py-1 overflow-x-auto">
          
          {/* Tab 1: Theo dõi hoàn tiền (Chuyên sâu) */}
          <button
            onClick={() => setActiveTab('refunds')}
            className={`flex items-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all relative ${
              activeTab === 'refunds'
                ? 'bg-orange-50 text-orange-700 shadow-sm border border-orange-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className={`w-4 h-4 ${activeTab === 'refunds' ? 'text-orange-600' : 'text-slate-400'}`} />
            <span>Theo dõi Đơn Trả & Hủy</span>
            
            {/* Badge đếm đơn chưa xong */}
            {stats.unresolvedRefundsCount > 0 ? (
              <span className="bg-rose-500 text-white text-xs font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow-sm">
                {stats.unresolvedRefundsCount}
              </span>
            ) : (
              <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-1.5 py-0.2 rounded-full">
                Xong
              </span>
            )}
          </button>

          {/* Tab 2: Toàn bộ đơn hàng */}
          <button
            onClick={() => setActiveTab('all-orders')}
            className={`flex items-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'all-orders'
                ? 'bg-orange-50 text-orange-700 shadow-sm border border-orange-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className={`w-4 h-4 ${activeTab === 'all-orders' ? 'text-orange-600' : 'text-slate-400'}`} />
            <span>Tất cả đơn mua ({stats.totalOrdersCount})</span>
          </button>

          {/* Tab 3: Thống kê & Phân tích chi tiêu */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-orange-50 text-orange-700 shadow-sm border border-orange-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className={`w-4 h-4 ${activeTab === 'analytics' ? 'text-orange-600' : 'text-slate-400'}`} />
            <span>Thống kê chi tiêu</span>
          </button>

          {/* Tab 4: Tiện ích mở rộng Extension */}
          <button
            onClick={() => setActiveTab('extension-guide')}
            className={`flex items-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'extension-guide'
                ? 'bg-orange-50 text-orange-700 shadow-sm border border-orange-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Puzzle className={`w-4 h-4 ${activeTab === 'extension-guide' ? 'text-orange-600' : 'text-slate-400'}`} />
            <span>Tiện ích Chrome Extension</span>
          </button>

        </nav>
      </div>
    </header>
  );
};
