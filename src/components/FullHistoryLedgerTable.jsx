import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/formatters';
import { Search, Layers, Store, ExternalLink, ArrowDownCircle } from 'lucide-react';

export const FullHistoryLedgerTable = () => {
  const { 
    accountOrders, 
    accounts, 
    searchQuery, 
    setSearchQuery,
    setSelectedOrder 
  } = useApp();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [visibleCount, setVisibleCount] = useState(50);

  useEffect(() => {
    setVisibleCount(50);
  }, [statusFilter, searchQuery]);

  const getAccountName = (id) => {
    const acc = accounts.find(a => a.id === id);
    return acc ? acc.name : 'Người mua';
  };

  const filteredOrders = accountOrders.filter(o => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = (o.orderCode || '').toLowerCase().includes(q);
      const matchShop = (o.shopName || '').toLowerCase().includes(q);
      const matchItem = o.items?.some(i => (i.name || '').toLowerCase().includes(q));
      if (!matchCode && !matchShop && !matchItem) return false;
    }
    return true;
  });

  const totalSpent = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const displayedOrders = filteredOrders.slice(0, visibleCount);
  const hasMore = visibleCount < filteredOrders.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 50, filteredOrders.length));
  };

  return (
    <div className="space-y-4">
      
      {/* Search & Status filter */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-500 font-semibold mr-1">Trạng thái:</span>
          {[
            { key: 'ALL', label: 'Tất cả đơn' },
            { key: 'COMPLETED', label: 'Hoàn thành' },
            { key: 'SHIPPING', label: 'Đang giao' },
            { key: 'CANCELLED', label: 'Đã hủy' },
            { key: 'REFUNDED', label: 'Trả hàng' },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key)}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                statusFilter === item.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo sản phẩm, shop, mã đơn..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Accounting Table for All Orders */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead className="bg-slate-900 text-slate-100 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 text-center w-10">STT</th>
                <th className="py-2.5 px-3 w-28">Ngày đặt</th>
                <th className="py-2.5 px-3 w-32">Người mua</th>
                <th className="py-2.5 px-3 w-28 font-mono">Mã đơn</th>
                <th className="py-2.5 px-3 min-w-[260px]">Nội dung hàng hóa & Shop</th>
                <th className="py-2.5 px-3 text-center w-28">Trạng thái</th>
                <th className="py-2.5 px-3 text-right w-32 font-bold text-slate-200">Tổng thanh toán</th>
                <th className="py-2.5 px-3 w-36">Thanh toán bằng</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400 font-medium">
                    Không tìm thấy đơn hàng nào.
                  </td>
                </tr>
              ) : (
                displayedOrders.map((order, idx) => {
                  const badge = getStatusBadge(order.status);
                  const firstItem = order.items?.[0];
                  const otherCount = (order.items?.length || 1) - 1;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50 font-medium">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        {formatDate(order.orderTime)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                          👤 {getAccountName(order.accountId)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                        #{order.orderCode}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-900 font-semibold line-clamp-1">
                          {firstItem?.name || 'Đơn hàng Shopee'}
                          {otherCount > 0 && (
                            <span className="text-slate-400 font-normal ml-1">(+{otherCount} món)</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          🏪 {order.shopName}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-600 whitespace-nowrap">
                        {order.paymentMethod || 'Chưa rõ'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {filteredOrders.length > 0 && (
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-mono text-xs font-bold text-slate-900">
                <tr>
                  <td colSpan="6" className="py-3 px-4 text-right uppercase tracking-wider text-slate-600">
                    Tổng chi tiêu ({filteredOrders.length} đơn):
                  </td>
                  <td className="py-3 px-3 text-right text-slate-900 font-black text-sm">
                    {formatCurrency(totalSpent)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Pagination / Load More Bar */}
      {filteredOrders.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-300 text-xs">
          <span className="text-slate-600 font-medium">
            Đang hiển thị <strong>{displayedOrders.length}</strong> / <strong>{filteredOrders.length}</strong> đơn hàng
          </span>

          {hasMore ? (
            <button
              onClick={handleLoadMore}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg shadow-xs flex items-center gap-1.5 transition-all hover:scale-[1.01]"
            >
              <ArrowDownCircle className="w-4 h-4 text-amber-400" />
              <span>Tải thêm 50 đơn tiếp theo (còn {filteredOrders.length - visibleCount} đơn)</span>
            </button>
          ) : (
            <span className="text-slate-400 font-semibold italic">
              Đã hiển thị toàn bộ danh sách đơn hàng
            </span>
          )}
        </div>
      )}

    </div>
  );
};
