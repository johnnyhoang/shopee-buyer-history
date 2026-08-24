import React from 'react';
import { useApp } from '../context/AppContext';
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
  RefreshCw
} from 'lucide-react';

export const LedgerHeader = () => {
  const { 
    accounts, 
    activeAccountId, 
    handleSelectAccount, 
    ledgerTotals, 
    refundLedgerEntries,
    setIsAccountModalOpen, 
    setIsSyncModalOpen,
    resetSampleData 
  } = useApp();

  return (
    <header className="bg-white border-b border-slate-300 sticky top-0 z-30 shadow-xs">
      
      {/* Top Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-base shadow-sm">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-black text-slate-900 text-base sm:text-lg tracking-tight font-sans">
                  SỔ ĐỐI SOÁT HOÀN TIỀN SHOPEE
                </h1>
                <span className="bg-slate-100 text-slate-700 text-[11px] font-mono px-2 py-0.5 rounded border border-slate-300">
                  Accounting Ledger
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Theo dõi thu hồi tiền đơn hủy, trả hàng & hoàn tiền đa tài khoản</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            
            {/* Account Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-300">
              <span className="text-xs font-semibold text-slate-600 pl-2 pr-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Sổ của:
              </span>
              <select
                value={activeAccountId}
                onChange={(e) => handleSelectAccount(e.target.value)}
                aria-label="Chọn sổ tài khoản người mua"
                className="bg-white text-slate-900 text-xs font-bold rounded px-2 py-1 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
              >
                <option value="ALL">🌟 Tất cả tài khoản ({accounts.length})</option>
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

            {/* Export CSV / Excel */}
            <button
              onClick={() => exportToCSV(refundLedgerEntries, accounts)}
              className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-800 shadow-xs transition-colors"
              title="Xuất bảng đối soát ra file Excel / CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>

            {/* Sync / Import Button */}
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-amber-400" />
              <span>Đồng bộ / Nhập đơn</span>
            </button>

            {/* Reset sample data */}
            <button
              onClick={resetSampleData}
              title="Nạp lại dữ liệu mẫu"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

          </div>
        </div>
      </div>

      {/* Accounting Balance Bar (Dòng số liệu tài chính) */}
      <div className="bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            
            {/* 1. Tiền còn phải thu hồi */}
            <div className="bg-slate-800/80 p-2 rounded-lg border border-amber-500/40 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Tiền chờ hoàn về ({ledgerTotals.pendingCount} đơn)
                </div>
                <div className="text-base sm:text-lg font-mono font-black text-amber-300 mt-0.5">
                  {formatCurrency(ledgerTotals.totalPending)}
                </div>
              </div>
            </div>

            {/* 2. Tiền đã thu hồi an toàn */}
            <div className="bg-slate-800/80 p-2 rounded-lg border border-emerald-500/40 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Đã nhận tiền hoàn ({ledgerTotals.confirmedCount} đơn)
                </div>
                <div className="text-base sm:text-lg font-mono font-black text-emerald-300 mt-0.5">
                  {formatCurrency(ledgerTotals.totalReceived)}
                </div>
              </div>
            </div>

            {/* 3. Tiền bị quá hạn / khiếu nại */}
            <div className="bg-slate-800/80 p-2 rounded-lg border border-rose-500/40 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-rose-300 font-bold uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Quá hạn / Cần khiếu nại
                </div>
                <div className="text-base sm:text-lg font-mono font-black text-rose-300 mt-0.5">
                  {formatCurrency(ledgerTotals.totalDisputed)}
                </div>
              </div>
            </div>

            {/* 4. Tổng giá trị hoàn tất cả */}
            <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  Tổng hoàn ({ledgerTotals.totalEntries} đơn trả/hủy)
                </div>
                <div className="text-base sm:text-lg font-mono font-black text-white mt-0.5">
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
