import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateTime, getRefundStatusInfo } from '../utils/formatters';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RotateCcw, 
  Search, 
  Edit3, 
  CreditCard, 
  Wallet, 
  Building2, 
  Truck, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check
} from 'lucide-react';

export const RefundTrackerView = () => {
  const { 
    refundOrders, 
    refundFilter, 
    setRefundFilter, 
    searchQuery, 
    setSearchQuery,
    confirmRefundReceived,
    markRefundDisputed,
    resetRefundTracking,
    saveOrderNote,
    setSelectedOrder,
    accounts
  } = useApp();

  const [editingNoteId, setEditingNoteId] = useState(null);
  const [tempNote, setTempNote] = useState('');

  const getAccountName = (accId) => {
    const acc = accounts.find(a => a.id === accId);
    return acc ? acc.name : 'Người mua';
  };

  const getPaymentIcon = (method) => {
    if (!method) return <CreditCard className="w-4 h-4 text-slate-500" />;
    const m = method.toLowerCase();
    if (m.includes('thẻ') || m.includes('visa') || m.includes('mastercard')) {
      return <CreditCard className="w-4 h-4 text-indigo-600" />;
    }
    if (m.includes('ví') || m.includes('shopeepay')) {
      return <Wallet className="w-4 h-4 text-orange-500" />;
    }
    if (m.includes('ngân hàng') || m.includes('atm') || m.includes('chuyển khoản')) {
      return <Building2 className="w-4 h-4 text-emerald-600" />;
    }
    return <Truck className="w-4 h-4 text-slate-600" />;
  };

  const handleConfirmWithCelebration = (order) => {
    confirmRefundReceived(order.id);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const handleStartEditNote = (order) => {
    setEditingNoteId(order.id);
    setTempNote(order.userNote || '');
  };

  const handleSaveNote = (orderId) => {
    saveOrderNote(orderId, tempNote);
    setEditingNoteId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-orange-600" />
              Theo dõi Hoàn tiền & Đối soát Đơn Trả/Hủy
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Kiểm tra tình trạng tiền hoàn từ Shopee về Thẻ tín dụng, Ví ShopeePay hoặc Ngân hàng của bạn.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo sản phẩm, shop, ghi chú..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>

        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => setRefundFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              refundFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả đơn hủy/trả ({refundOrders.length})
          </button>

          <button
            onClick={() => setRefundFilter('PENDING_OR_REFUNDED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              refundFilter === 'PENDING_OR_REFUNDED'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Đang chờ tiền về
          </button>

          <button
            onClick={() => setRefundFilter('CONFIRMED_RECEIVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              refundFilter === 'CONFIRMED_RECEIVED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã nhận đủ tiền (Kết thúc)
          </button>

          <button
            onClick={() => setRefundFilter('DISPUTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              refundFilter === 'DISPUTED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Quá hạn / Cần khiếu nại
          </button>
        </div>
      </div>

      {/* Orders List */}
      {refundOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <RotateCcw className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Không có đơn hủy / trả hàng nào phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Không tìm thấy đơn hàng nào với bộ lọc hiện tại. Bạn có thể chọn tài khoản khác hoặc kiểm tra lại từ khóa tìm kiếm.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {refundOrders.map((order) => {
            const refundInfo = getRefundStatusInfo(order.refundStatus);
            const isFinished = order.refundStatus === 'CONFIRMED_RECEIVED';
            const isDisputed = order.refundStatus === 'DISPUTED';
            const isEditingNote = editingNoteId === order.id;

            return (
              <div 
                key={order.id}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden ${
                  isFinished 
                    ? 'border-slate-200 hover:border-slate-300' 
                    : isDisputed
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : 'border-amber-300 ring-1 ring-amber-200/80 hover:shadow-md'
                }`}
              >
                
                {/* Header card: Shop name, Account, Status */}
                <div className="p-4 sm:px-6 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-slate-800">
                      🏪 {order.shopName}
                    </span>
                    <span className="text-xs bg-white px-2.5 py-0.5 rounded-md border border-slate-200 font-medium text-slate-600">
                      👤 {getAccountName(order.accountId)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      #{order.orderCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${refundInfo.badgeClass}`}>
                      {refundInfo.label}
                    </span>
                  </div>
                </div>

                {/* Body card: Items + Refund Amount Info */}
                <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  
                  {/* Left: Product List (8 cols) */}
                  <div className="lg:col-span-7 space-y-3">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            {item.modelName && (
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-600 font-medium">
                                Phân loại: {item.modelName}
                              </span>
                            )}
                            <span>Số lượng: x{item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Lý do hủy/trả hàng */}
                    {(order.cancelReason || order.refundReason) && (
                      <div className="mt-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600 flex items-start gap-2">
                        <span className="font-semibold text-slate-700 shrink-0">Lý do:</span>
                        <span>{order.refundReason || order.cancelReason}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Refund Amount, Payment Method & Actions (5 cols) */}
                  <div className="lg:col-span-5 bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between h-full space-y-4">
                    
                    {/* Amount & Method */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Tiền cần nhận lại:</span>
                        <span className="text-lg sm:text-xl font-black text-orange-600">
                          {formatCurrency(order.refundAmount || order.totalAmount)}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                        <span className="flex items-center gap-1.5">
                          {getPaymentIcon(order.paymentMethod)}
                          <span className="font-medium">Hoàn về:</span>
                        </span>
                        <span className="font-semibold text-slate-800 text-right">
                          {order.paymentMethod || 'Ví / Thẻ ban đầu'}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Thời gian hủy/yêu cầu:</span>
                        <span>{formatDateTime(order.cancelTime || order.orderTime)}</span>
                      </div>
                    </div>

                    {/* Quick Action Button for Confirmation */}
                    <div className="pt-2">
                      {!isFinished ? (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleConfirmWithCelebration(order)}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Xác nhận Đã nhận đủ tiền (Kết thúc)
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => markRefundDisputed(order.id)}
                              className="flex-1 py-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold border border-rose-200 transition-colors flex items-center justify-center gap-1"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Quá hạn / Cần khiếu nại
                            </button>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1"
                            >
                              Chi tiết
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-center text-xs font-semibold text-emerald-800 flex items-center justify-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Đã nhận đủ tiền lúc {formatDateTime(order.refundConfirmedAt)}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-[11px]">
                            <button
                              onClick={() => resetRefundTracking(order.id)}
                              className="text-slate-500 hover:text-orange-600 underline font-medium"
                            >
                              Bỏ xác nhận (Theo dõi lại)
                            </button>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="text-slate-700 font-semibold hover:text-slate-900 flex items-center gap-0.5"
                            >
                              Xem chi tiết
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>

                </div>

                {/* Footer Note Area */}
                <div className="px-4 sm:px-6 py-2.5 bg-amber-50/30 border-t border-slate-100 flex items-center justify-between gap-4 text-xs">
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-semibold text-slate-500 shrink-0">📝 Ghi chú:</span>
                    {isEditingNote ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={tempNote}
                          onChange={(e) => setTempNote(e.target.value)}
                          placeholder="Ví dụ: Đã nhận tiền vào Techcombank ngày 16/08..."
                          className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        <button
                          onClick={() => handleSaveNote(order.id)}
                          className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                          title="Lưu ghi chú"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-700 italic">
                        {order.userNote ? `"${order.userNote}"` : <span className="text-slate-400">Chưa có ghi chú tài khoản nhận tiền</span>}
                      </span>
                    )}
                  </div>

                  {!isEditingNote && (
                    <button
                      onClick={() => handleStartEditNote(order)}
                      className="text-orange-600 hover:text-orange-700 font-medium text-[11px] flex items-center gap-1 shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {order.userNote ? 'Sửa ghi chú' : 'Thêm ghi chú'}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
