import React from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import { BarChart3, TrendingUp, RotateCcw, CheckCircle, ShieldAlert, ShoppingBag } from 'lucide-react';

export const AnalyticsView = () => {
  const { stats, accountOrders, accounts } = useApp();

  // Nhóm chi tiêu theo từng tài khoản
  const accountBreakdown = accounts.map((acc) => {
    const orders = accountOrders.filter(o => o.accountId === acc.id);
    let spent = 0;
    let refunded = 0;
    let pending = 0;

    orders.forEach(o => {
      if (o.status === 'COMPLETED' || o.status === 'SHIPPING' || o.status === 'PROCESSING') {
        spent += (o.totalAmount || 0);
      } else if (o.status === 'CANCELLED' || o.status === 'REFUNDED' || o.status === 'REFUNDING') {
        const refAmt = o.refundAmount || o.totalAmount || 0;
        if (o.refundStatus === 'CONFIRMED_RECEIVED') {
          refunded += refAmt;
        } else {
          pending += refAmt;
        }
      }
    });

    return {
      ...acc,
      ordersCount: orders.length,
      spent,
      refunded,
      pending,
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-orange-600" />
          Báo Cáo & Thống Kê Chi Tiêu
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Tổng quan dòng tiền mua sắm, đối soát hoàn trả và phân bổ chi tiêu theo từng người mua.
        </p>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Tổng tiền đã mua thành công</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatCurrency(stats.totalSpend)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tổng cộng {stats.completedCount + stats.shippingCount} đơn hàng giao nhận
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold mb-2">
            <span>Tổng tiền đang chờ hoàn</span>
            <RotateCcw className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">
            {formatCurrency(stats.pendingRefundAmount)}
          </div>
          <p className="text-xs text-amber-800/70 mt-1">
            {stats.unresolvedRefundsCount} đơn cần đối soát tiền về tài khoản
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold mb-2">
            <span>Tổng tiền hoàn đã thu hồi đủ</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {formatCurrency(stats.confirmedRefundAmount)}
          </div>
          <p className="text-xs text-emerald-700/80 mt-1">
            Đã đối soát an toàn, kết thúc theo dõi
          </p>
        </div>
      </div>

      {/* Account spending breakdown table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">
            Chi tiết theo từng Tài khoản người mua
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 text-slate-500 uppercase border-b border-slate-100 font-semibold">
              <tr>
                <th className="py-3.5 px-6">Tài khoản</th>
                <th className="py-3.5 px-4 text-center">Số đơn</th>
                <th className="py-3.5 px-4 text-right">Đã mua</th>
                <th className="py-3.5 px-4 text-right">Đã nhận hoàn</th>
                <th className="py-3.5 px-4 text-right">Đang chờ hoàn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accountBreakdown.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-800 text-sm">{acc.name}</div>
                    <div className="text-slate-400 text-[11px] font-mono">{acc.username ? `@${acc.username}` : ''}</div>
                  </td>
                  <td className="py-4 px-4 text-center font-semibold text-slate-700">
                    {acc.ordersCount}
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-slate-900">
                    {formatCurrency(acc.spent)}
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-emerald-600">
                    {formatCurrency(acc.refunded)}
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-amber-600">
                    {formatCurrency(acc.pending)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
