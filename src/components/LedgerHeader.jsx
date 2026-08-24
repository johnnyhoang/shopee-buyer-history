import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import { exportToCSV } from '../utils/csvExport';
import { 
  BookOpen, 
  FileSpreadsheet, 
  DownloadCloud, 
  Users, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Trash2,
  LogOut,
  UserCheck
} from 'lucide-react';

export const LedgerHeader = () => {
  const { user, logout } = useAuth();
  const { 
    accounts, 
    activeAccountId, 
    handleSelectAccount, 
    ledgerTotals, 
    refundLedgerEntries,
    setIsAccountModalOpen, 
    setIsSyncModalOpen,
    clearAllData 
  } = useApp();

  return (
    <header className="bg-white border-b border-slate-300 sticky top-0 z-30 shadow-xs">
      
      {/* Top Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 sm:gap-3">
          
          {/* Logo, Title & User on Mobile */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-base shadow-sm shrink-0">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h1 className="font-black text-slate-900 text-sm sm:text-base tracking-tight font-sans">
                    SỔ ĐỐI SOÁT SHOPEE
                  </h1>
                  <span className="hidden sm:inline-block bg-slate-100 text-slate-700 text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-300">
                    Ledger
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Theo dõi thu hồi tiền đơn hủy, trả hàng & hoàn tiền đa tài khoản</p>
              </div>
            </div>

            {/* Mobile User & Logout */}
            <div className="flex md:hidden items-center gap-1">
              <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-[11px] font-bold text-slate-700">
                <UserCheck className="w-3 h-3 text-emerald-600" />
                <span className="max-w-[70px] truncate">{user?.name || 'Thùy Nga'}</span>
              </div>
              <button
                onClick={logout}
                title="Đăng xuất"
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action buttons (Scrollable or flex-wrap on mobile) */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            
            {/* Account Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-300 shrink-0">
              <span className="text-xs font-semibold text-slate-600 pl-1.5 pr-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sổ của:</span>
              </span>
              <select
                value={activeAccountId}
                onChange={(e) => handleSelectAccount(e.target.value)}
                aria-label="Chọn sổ tài khoản người mua"
                className="bg-white text-slate-900 text-xs font-bold rounded px-2 py-1 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer max-w-[120px] sm:max-w-none truncate"
              >
                <option value="ALL">🌟 Tất cả ({accounts.length})</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    👤 {acc.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setIsAccountModalOpen(true)}
                title="Quản lý danh sách tài khoản"
                className="ml-1 p-1 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sync / Import Button */}
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="flex items-center space-x-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg shadow-xs transition-colors shrink-0"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-amber-400" />
              <span>Đồng bộ / Nhập</span>
            </button>

            {/* Export CSV / Excel */}
            <button
              onClick={() => exportToCSV(refundLedgerEntries, accounts)}
              className="flex items-center space-x-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg border border-emerald-800 shadow-xs transition-colors shrink-0"
              title="Xuất bảng đối soát ra file Excel / CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            {/* Clear all data */}
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn xóa sạch toàn bộ dữ liệu trên Sổ Kế Toán?')) {
                  clearAllData();
                }
              }}
              title="Xóa sạch toàn bộ dữ liệu"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Desktop User info & Logout */}
            <div className="hidden md:flex items-center pl-1.5 border-l border-slate-200 space-x-1.5 shrink-0">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg text-[11px] font-bold text-slate-700">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{user?.name || 'Thùy Nga'}</span>
              </div>
              <button
                onClick={logout}
                title="Đăng xuất"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Accounting Balance Bar (2x2 grid on mobile, 4 columns on desktop) */}
      <div className="bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 text-xs">
            
            {/* 1. Tiền còn phải thu hồi */}
            <div className="bg-slate-800/90 p-2 sm:p-2.5 rounded-xl border border-amber-500/40 flex items-center justify-between">
              <div>
                <div className="text-[10px] sm:text-[11px] text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">Chờ hoàn ({ledgerTotals.pendingCount})</span>
                </div>
                <div className="text-sm sm:text-lg font-mono font-black text-amber-300 mt-0.5">
                  {formatCurrency(ledgerTotals.totalPending)}
                </div>
              </div>
            </div>

            {/* 2. Tiền đã thu hồi an toàn */}
            <div className="bg-slate-800/90 p-2 sm:p-2.5 rounded-xl border border-emerald-500/40 flex items-center justify-between">
              <div>
                <div className="text-[10px] sm:text-[11px] text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">Đã nhận ({ledgerTotals.confirmedCount})</span>
                </div>
                <div className="text-sm sm:text-lg font-mono font-black text-emerald-300 mt-0.5">
                  {formatCurrency(ledgerTotals.totalReceived)}
                </div>
              </div>
            </div>

            {/* 3. Tiền bị quá hạn / khiếu nại */}
            <div className="bg-slate-800/90 p-2 sm:p-2.5 rounded-xl border border-rose-500/40 flex items-center justify-between">
              <div>
                <div className="text-[10px] sm:text-[11px] text-rose-300 font-bold uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                  <span className="truncate">Quá hạn</span>
                </div>
                <div className="text-sm sm:text-lg font-mono font-black text-rose-300 mt-0.5">
                  {formatCurrency(ledgerTotals.totalDisputed)}
                </div>
              </div>
            </div>

            {/* 4. Tổng giá trị hoàn tất cả */}
            <div className="bg-slate-800/90 p-2 sm:p-2.5 rounded-xl border border-slate-700 flex items-center justify-between">
              <div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <RotateCcw className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">Tổng ({ledgerTotals.totalEntries} đơn)</span>
                </div>
                <div className="text-sm sm:text-lg font-mono font-black text-white mt-0.5">
                  {formatCurrency(ledgerTotals.totalRefundDue)}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </header>
  );
};
