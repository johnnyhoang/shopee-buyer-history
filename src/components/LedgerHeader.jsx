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
    <header className="bg-white border-b border-slate-300 sticky top-0 z-30 shadow-2xs">
      
      {/* Top Navbar - Ultra Slim */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1.5 sm:py-2">
        <div className="flex items-center justify-between gap-1.5 sm:gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <h1 className="font-black text-slate-900 text-xs sm:text-sm tracking-tight whitespace-nowrap">
              SỔ ĐỐI SOÁT SHOPEE
            </h1>
          </div>

          {/* Action buttons - Compact */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            
            {/* Account Switcher */}
            <div className="flex items-center bg-slate-100 rounded px-1.5 py-0.5 border border-slate-200 shrink-0">
              <Users className="w-3 h-3 text-slate-500 mr-1 shrink-0" />
              <select
                value={activeAccountId}
                onChange={(e) => handleSelectAccount(e.target.value)}
                aria-label="Chọn sổ tài khoản"
                className="bg-transparent text-slate-900 text-[11px] font-bold focus:outline-none cursor-pointer max-w-[90px] sm:max-w-[140px] truncate"
              >
                <option value="ALL">Tất cả ({accounts.length})</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setIsAccountModalOpen(true)}
                title="Quản lý tài khoản"
                className="ml-1 text-slate-400 hover:text-slate-900"
              >
                +
              </button>
            </div>

            {/* Sync Button */}
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-2 py-1 rounded shadow-2xs transition-colors shrink-0"
            >
              <DownloadCloud className="w-3 h-3 text-amber-400" />
              <span>Nhập</span>
            </button>

            {/* Export Excel */}
            <button
              onClick={() => exportToCSV(refundLedgerEntries, accounts)}
              className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold px-2 py-1 rounded shadow-2xs transition-colors shrink-0"
              title="Xuất Excel"
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            {/* Clear data */}
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc muốn xóa sạch toàn bộ dữ liệu?')) {
                  clearAllData();
                }
              }}
              title="Xóa dữ liệu"
              className="p-1 text-slate-400 hover:text-rose-600 rounded shrink-0"
            >
              <Trash2 className="w-3 h-3" />
            </button>

            {/* User & Logout */}
            <div className="flex items-center pl-1 border-l border-slate-200 gap-1 shrink-0">
              <span className="hidden md:inline text-[11px] font-bold text-slate-700 max-w-[80px] truncate">
                {user?.name || 'Thùy Nga'}
              </span>
              <button
                onClick={logout}
                title="Đăng xuất"
                className="p-1 text-slate-400 hover:text-rose-600 rounded"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Accounting Balance Bar - Ultra Slim Dense Strip */}
      <div className="bg-slate-900 text-white border-t border-slate-800 py-1 px-2 sm:px-4 text-[11px]">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-3 no-scrollbar font-mono">
          
          {/* 1. Tiền chờ hoàn */}
          <div className="flex items-center gap-1 text-amber-300 whitespace-nowrap shrink-0">
            <Clock className="w-3 h-3 text-amber-400" />
            <span className="font-medium text-slate-400">Chờ:</span>
            <span className="font-black">{formatCurrency(ledgerTotals.totalPending)}</span>
            <span className="text-[10px] text-amber-400/80">({ledgerTotals.pendingCount})</span>
          </div>

          <div className="text-slate-700">|</div>

          {/* 2. Đã nhận */}
          <div className="flex items-center gap-1 text-emerald-300 whitespace-nowrap shrink-0">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span className="font-medium text-slate-400">Đã nhận:</span>
            <span className="font-black">{formatCurrency(ledgerTotals.totalReceived)}</span>
            <span className="text-[10px] text-emerald-400/80">({ledgerTotals.confirmedCount})</span>
          </div>

          <div className="text-slate-700">|</div>

          {/* 3. Quá hạn */}
          <div className="flex items-center gap-1 text-rose-300 whitespace-nowrap shrink-0">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span className="font-medium text-slate-400">Quá hạn:</span>
            <span className="font-black">{formatCurrency(ledgerTotals.totalDisputed)}</span>
          </div>

          <div className="text-slate-700">|</div>

          {/* 4. Tổng */}
          <div className="flex items-center gap-1 text-slate-200 whitespace-nowrap shrink-0">
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span className="font-medium text-slate-400">Tổng:</span>
            <span className="font-bold">{formatCurrency(ledgerTotals.totalRefundDue)}</span>
            <span className="text-[10px] text-slate-400">({ledgerTotals.totalEntries} đơn)</span>
          </div>

        </div>
      </div>

    </header>
  );
};
