import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDateTime, getStatusBadge, getRefundStatusInfo } from '../utils/formatters';
import confetti from 'canvas-confetti';
import { 
  X, 
  Store, 
  CreditCard, 
  Calendar, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Edit3, 
  Check, 
  RotateCcw,
  ExternalLink
} from 'lucide-react';

export const OrderDetailModal = () => {
  const { 
    selectedOrder, 
    setSelectedOrder, 
    accounts,
    confirmRefundReceived, 
    markRefundDisputed, 
    resetRefundTracking, 
    saveOrderNote 
  } = useApp();

  const [note, setNote] = useState(selectedOrder?.userNote || '');
  const [isEditingNote, setIsEditingNote] = useState(false);

  if (!selectedOrder) return null;

  const account = accounts.find(a => a.id === selectedOrder.accountId);
  const isRefundOrCancel = selectedOrder.status === 'CANCELLED' || selectedOrder.status === 'REFUNDED' || selectedOrder.status === 'REFUNDING';
  const refundInfo = getRefundStatusInfo(selectedOrder.refundStatus);
  const statusBadge = getStatusBadge(selectedOrder.status);

  const handleSaveNote = () => {
    saveOrderNote(selectedOrder.id, note);
    setIsEditingNote(false);
  };

  const handleConfirm = () => {
    confirmRefundReceived(selectedOrder.id, note);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });
    setSelectedOrder({
      ...selectedOrder,
      refundStatus: 'CONFIRMED_RECEIVED',
      refundConfirmedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">{selectedOrder.shopName}</h3>
              <p className="text-xs text-slate-400 font-mono">Mã đơn: #{selectedOrder.orderCode}</p>
            </div>
          </div>

          <button
            onClick={() => setSelectedOrder(null)}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Account & Status Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Tài khoản:</span>
              <span className="text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                👤 {account?.name || 'Tài khoản người mua'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
            </div>
          </div>

          {/* Refund Status Special Banner (if cancelled/refunded) */}
          {isRefundOrCancel && (
            <div className={`p-4 rounded-2xl border ${
              selectedOrder.refundStatus === 'CONFIRMED_RECEIVED'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : selectedOrder.refundStatus === 'DISPUTED'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <RotateCcw className="w-4 h-4" />
                  <span>Theo dõi đối soát hoàn tiền</span>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${refundInfo.badgeClass}`}>
                  {refundInfo.label}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-200/50">
                <span>Số tiền cần hoàn trả:</span>
                <span className="text-lg font-black text-orange-600">
                  {formatCurrency(selectedOrder.refundAmount || selectedOrder.totalAmount)}
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                <span>Phương thức nhận tiền:</span>
                <span className="font-semibold text-slate-800">{selectedOrder.paymentMethod || 'Ví ShopeePay / Thẻ'}</span>
              </div>

              {selectedOrder.refundConfirmedAt && (
                <div className="mt-2 text-xs text-emerald-700 bg-emerald-100/60 p-2 rounded-lg flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Đã xác nhận nhận đủ tiền vào ngày: {formatDateTime(selectedOrder.refundConfirmedAt)}
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex flex-wrap gap-2">
                {selectedOrder.refundStatus !== 'CONFIRMED_RECEIVED' ? (
                  <>
                    <button
                      onClick={handleConfirm}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Xác nhận Đã nhận đủ tiền (Kết thúc)
                    </button>
                    <button
                      onClick={() => markRefundDisputed(selectedOrder.id, note)}
                      className="py-2 px-3 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl font-semibold text-xs transition-colors"
                    >
                      Gắn cờ Quá hạn / Cần khiếu nại
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      resetRefundTracking(selectedOrder.id);
                      setSelectedOrder({
                        ...selectedOrder,
                        refundStatus: 'SHOPEE_REFUNDED',
                        refundConfirmedAt: null,
                      });
                    }}
                    className="py-1.5 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
                  >
                    Bỏ xác nhận (Tiếp tục theo dõi tiền hoàn)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Items in order */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Danh sách sản phẩm ({selectedOrder.items?.length || 0})
            </h4>
            <div className="space-y-3">
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs sm:text-sm text-slate-800 line-clamp-2">
                      {item.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      {item.modelName && (
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] text-slate-600">
                          {item.modelName}
                        </span>
                      )}
                      <span>Số lượng: x{item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xs sm:text-sm text-slate-900">
                      {formatCurrency(item.price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing summary */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Phí vận chuyển:</span>
              <span>{formatCurrency(selectedOrder.shippingFee || 0)}</span>
            </div>
            {selectedOrder.voucherDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Voucher giảm giá Shopee:</span>
                <span>-{formatCurrency(selectedOrder.voucherDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Tổng số tiền đã thanh toán:</span>
              <span className="text-orange-600">{formatCurrency(selectedOrder.totalAmount)}</span>
            </div>
          </div>

          {/* User Note area */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-orange-600" />
                Ghi chú riêng của bạn
              </span>
              {!isEditingNote && (
                <button
                  onClick={() => setIsEditingNote(true)}
                  className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
                >
                  Chỉnh sửa
                </button>
              )}
            </div>

            {isEditingNote ? (
              <div className="space-y-2 mt-2">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Đã nhận tiền vào Techcombank ngày 16/08..."
                  rows={2}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingNote(false)}
                    className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveNote}
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg shadow-sm"
                  >
                    Lưu ghi chú
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 italic">
                {selectedOrder.userNote || 'Chưa có ghi chú nào cho đơn hàng này.'}
              </p>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => setSelectedOrder(null)}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
