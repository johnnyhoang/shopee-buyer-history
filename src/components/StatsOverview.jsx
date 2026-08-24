import React from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import { 
  DollarSign, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ShoppingBag,
  TrendingDown
} from 'lucide-react';

export const StatsOverview = () => {
  const { stats, setActiveTab, setRefundFilter } = useApp();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* Thẻ 1: Tiền đang chờ hoàn (Trọng tâm nhất) */}
      <div 
        onClick={() => {
          setActiveTab('refunds');
          setRefundFilter('PENDING_OR_REFUNDED');
        }}
        className={`p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
          stats.pendingRefundAmount > 0 
            ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border-amber-300 ring-1 ring-amber-200' 
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600" />
            Đang chờ tiền hoàn về
          </span>
          {stats.unresolvedRefundsCount > 0 && (
            <span className="text-[11px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
              {stats.unresolvedRefundsCount} đơn
            </span>
          )}
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-amber-700 tracking-tight">
            {formatCurrency(stats.pendingRefundAmount)}
          </div>
          <p className="text-xs text-amber-800/80 mt-1 font-medium">
            {stats.pendingRefundAmount > 0 
              ? 'Tiền Shopee/Shop đang xử lý hoàn trả' 
              : 'Tất cả tiền hoàn đã được đối soát đủ'}
          </p>
        </div>
      </div>

      {/* Thẻ 2: Tiền đã hoàn & Đã nhận đủ (Kết thúc theo dõi) */}
      <div 
        onClick={() => {
          setActiveTab('refunds');
          setRefundFilter('CONFIRMED_RECEIVED');
        }}
        className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Đã nhận tiền hoàn tất
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
            Xong đối soát
          </span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            {formatCurrency(stats.confirmedRefundAmount)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Đã xác nhận tiền về tài khoản / thẻ an toàn
          </p>
        </div>
      </div>

      {/* Thẻ 3: Đơn quá hạn / Cần khiếu nại (nếu có) */}
      <div 
        onClick={() => {
          setActiveTab('refunds');
          setRefundFilter(stats.disputedRefundAmount > 0 ? 'DISPUTED' : 'ALL');
        }}
        className={`p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
          stats.disputedRefundAmount > 0 
            ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-200' 
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className={`w-4 h-4 ${stats.disputedRefundAmount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
            Đơn cần khiếu nại
          </span>
        </div>
        <div className="mt-3">
          <div className={`text-2xl font-black tracking-tight ${stats.disputedRefundAmount > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
            {formatCurrency(stats.disputedRefundAmount)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {stats.disputedRefundAmount > 0 
              ? 'Đã quá hạn hoàn thông thường' 
              : 'Không có đơn nào bị quá hạn'}
          </p>
        </div>
      </div>

      {/* Thẻ 4: Tổng chi tiêu thực tế (Đã trừ hoàn trả) */}
      <div 
        onClick={() => setActiveTab('all-orders')}
        className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-orange-500" />
            Tổng đơn & Mua sắm
          </span>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
            {stats.totalOrdersCount} đơn
          </span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatCurrency(stats.totalSpend)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {stats.completedCount} đơn nhận thành công, {stats.shippingCount} đang giao
          </p>
        </div>
      </div>

    </div>
  );
};
