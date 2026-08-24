import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateTime, getStatusBadge } from '../utils/formatters';
import { 
  Layers, 
  Search, 
  Filter, 
  ExternalLink, 
  ChevronRight, 
  CreditCard, 
  Calendar,
  ShoppingBag,
  Store
} from 'lucide-react';

export const AllOrdersView = () => {
  const { 
    accountOrders, 
    accounts, 
    searchQuery, 
    setSearchQuery, 
    statusFilter, 
    setStatusFilter,
    setSelectedOrder 
  } = useApp();

  const getAccountName = (accId) => {
    const acc = accounts.find(a => a.id === accId);
    return acc ? acc.name : 'Người mua';
  };

  const filteredList = useMemo(() => {
    return accountOrders.filter((order) => {
      // Status filter
      if (statusFilter !== 'ALL' && order.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = (order.orderCode || '').toLowerCase().includes(q);
        const matchShop = (order.shopName || '').toLowerCase().includes(q);
        const matchItems = order.items?.some(i => (i.name || '').toLowerCase().includes(q));
        if (!matchCode && !matchShop && !matchItems) return false;
      }

      return true;
    });
  }, [accountOrders, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Search & Filter Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-600" />
              Lịch sử Tất cả Đơn Mua
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Danh sách chi tiết toàn bộ các đơn hàng đã đặt từ trước đến nay.
            </p>
          </div>

          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo sản phẩm, shop, mã đơn..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            />
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
          {[
            { key: 'ALL', label: 'Tất cả trạng thái' },
            { key: 'COMPLETED', label: 'Hoàn thành' },
            { key: 'SHIPPING', label: 'Đang giao' },
            { key: 'PROCESSING', label: 'Chờ lấy hàng' },
            { key: 'CANCELLED', label: 'Đã hủy' },
            { key: 'REFUNDED', label: 'Trả hàng / Hoàn tiền' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === item.key
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders count info */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Hiển thị <strong>{filteredList.length}</strong> đơn hàng</span>
      </div>

      {/* Order Cards List */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Không tìm thấy đơn hàng nào</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh lại bộ lọc trạng thái.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((order) => {
            const badge = getStatusBadge(order.status);
            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer overflow-hidden group"
              >
                {/* Header */}
                <div className="p-4 sm:px-6 bg-slate-50/60 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-orange-600" />
                      {order.shopName}
                    </span>
                    <span className="text-xs bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium text-slate-600">
                      👤 {getAccountName(order.accountId)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      #{order.orderCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  
                  {/* Items List */}
                  <div className="lg:col-span-8 space-y-3">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-orange-600 transition-colors">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            {item.modelName && (
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-600">
                                {item.modelName}
                              </span>
                            )}
                            <span>Số lượng: x{item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing & Date */}
                  <div className="lg:col-span-4 lg:border-l lg:border-slate-100 lg:pl-6 flex flex-col justify-center space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Thời gian đặt:</span>
                      <span>{formatDateTime(order.orderTime)}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Thanh toán:</span>
                      <span className="font-medium text-slate-700">{order.paymentMethod || 'Chưa rõ'}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs font-semibold text-slate-600">Tổng thanh toán:</span>
                      <span className="text-base font-black text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
