import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, normalizePaymentMethod, PAYMENT_METHODS } from '../utils/formatters';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  CheckSquare, 
  Square, 
  Edit2, 
  Check, 
  X, 
  ChevronDown,
  ArrowDownCircle
} from 'lucide-react';

export const RefundLedgerTable = () => {
  const { 
    refundLedgerEntries, 
    accountOrders,
    setActiveTab,
    accounts, 
    searchQuery, 
    setSearchQuery,
    orderTypeFilter,
    setOrderTypeFilter,
    reconciliationFilter,
    setReconciliationFilter,
    paymentMethodFilter,
    setPaymentMethodFilter,
    toggleRefundStatus,
    updateRefundField,
    batchConfirmRefunds,
    batchDisputeRefunds,
    setSelectedOrder
  } = useApp();

  const [selectedIds, setSelectedIds] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [tempNoteValue, setTempNoteValue] = useState('');
  
  // Phân trang 50 dòng + Cuộn tải tiếp (Infinite Scroll / Pagination)
  const [visibleCount, setVisibleCount] = useState(50);
  const tableBottomRef = useRef(null);

  // Reset phân trang khi đổi bộ lọc hoặc tìm kiếm
  useEffect(() => {
    setVisibleCount(50);
  }, [orderTypeFilter, reconciliationFilter, paymentMethodFilter, searchQuery]);

  const getAccountName = (id) => {
    const acc = accounts.find(a => a.id === id);
    return acc ? acc.name : 'Người mua';
  };

  // Checkbox handlers
  const handleSelectAll = () => {
    if (selectedIds.length === refundLedgerEntries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(refundLedgerEntries.map(o => o.id));
    }
  };

  const handleToggleRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Inline Note Edit
  const handleStartEditNote = (order) => {
    setEditingNoteId(order.id);
    setTempNoteValue(order.userNote || '');
  };

  const handleSaveNote = (orderId) => {
    updateRefundField(orderId, { userNote: tempNoteValue.trim() });
    setEditingNoteId(null);
  };

  // Calculate Column Totals (trên toàn bộ kết quả lọc)
  const totalPaid = refundLedgerEntries.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalRefund = refundLedgerEntries.reduce((sum, o) => sum + (o.refundAmount || o.totalAmount || 0), 0);
  const totalConfirmed = refundLedgerEntries
    .filter(o => o.refundStatus === 'CONFIRMED_RECEIVED')
    .reduce((sum, o) => sum + (o.refundAmount || o.totalAmount || 0), 0);
  const totalPending = totalRefund - totalConfirmed;

  // Danh sách dòng đang được hiển thị theo phân trang
  const displayedEntries = refundLedgerEntries.slice(0, visibleCount);
  const hasMore = visibleCount < refundLedgerEntries.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 50, refundLedgerEntries.length));
  };

  return (
    <div className="space-y-4">
      
      {/* Sổ cái Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left Filters */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Lọc theo Loại Đơn */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <span className="text-slate-500 font-semibold px-1">Loại:</span>
            <button
              onClick={() => setOrderTypeFilter('ALL')}
              className={`px-2 py-1 rounded font-bold transition-all ${
                orderTypeFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả ({refundLedgerEntries.length})
            </button>
            <button
              onClick={() => setOrderTypeFilter('CANCELLED')}
              className={`px-2 py-1 rounded font-bold transition-all ${
                orderTypeFilter === 'CANCELLED' ? 'bg-rose-700 text-white' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              Đơn Hủy
            </button>
            <button
              onClick={() => setOrderTypeFilter('REFUNDED')}
              className={`px-2 py-1 rounded font-bold transition-all ${
                orderTypeFilter === 'REFUNDED' ? 'bg-purple-700 text-white' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              Trả Hàng
            </button>
          </div>

          {/* Lọc theo Trạng thái đối soát */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <span className="text-slate-500 font-semibold px-1">Đối soát:</span>
            <button
              onClick={() => setReconciliationFilter('ALL')}
              className={`px-2 py-1 rounded font-bold transition-all ${
                reconciliationFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setReconciliationFilter('UNRESOLVED')}
              className={`px-2 py-1 rounded font-bold transition-all flex items-center gap-1 ${
                reconciliationFilter === 'UNRESOLVED' ? 'bg-amber-600 text-white' : 'text-amber-800 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3 h-3" />
              Chưa nhận tiền
            </button>
            <button
              onClick={() => setReconciliationFilter('CONFIRMED')}
              className={`px-2 py-1 rounded font-bold transition-all flex items-center gap-1 ${
                reconciliationFilter === 'CONFIRMED' ? 'bg-emerald-700 text-white' : 'text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Đã nhận tiền
            </button>
            <button
              onClick={() => setReconciliationFilter('DISPUTED')}
              className={`px-2 py-1 rounded font-bold transition-all flex items-center gap-1 ${
                reconciliationFilter === 'DISPUTED' ? 'bg-rose-700 text-white' : 'text-rose-800 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Quá hạn
            </button>
          </div>

          {/* Lọc Phương thức hoàn tiền */}
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            aria-label="Lọc theo phương thức thanh toán hoàn tiền"
            className="bg-slate-100 text-slate-800 font-semibold p-1.5 rounded-lg border border-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="ALL">💳 Mọi phương thức hoàn</option>
            {PAYMENT_METHODS.map(pm => (
              <option key={pm.key} value={pm.key}>
                {pm.icon} {pm.label}
              </option>
            ))}
          </select>

        </div>

        {/* Right Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo sản phẩm, shop, ghi chú..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

      </div>

      {/* Batch Action Bar (khi có dòng được chọn) */}
      {selectedIds.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-100">
          <div className="font-bold text-amber-900 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-amber-700" />
            <span>Đã chọn <strong>{selectedIds.length}</strong> đơn trong sổ</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => batchConfirmRefunds(selectedIds)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đánh dấu Đã nhận tiền ({selectedIds.length})
            </button>
            <button
              onClick={() => batchDisputeRefunds(selectedIds)}
              className="bg-rose-700 hover:bg-rose-800 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Gắn cờ Quá hạn
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-slate-600 hover:text-slate-900 px-2 py-1 font-semibold"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* SỔ KẾ TOÁN TABLE VIEW */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            
            {/* Header Columns */}
            <thead className="bg-slate-900 text-slate-100 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả các dòng"
                    checked={refundLedgerEntries.length > 0 && selectedIds.length === refundLedgerEntries.length}
                    onChange={handleSelectAll}
                    className="rounded text-orange-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-2 text-center w-10 font-bold">STT</th>
                <th className="py-2.5 px-3 w-28">Ngày phát sinh</th>
                <th className="py-2.5 px-3 w-32">Người mua</th>
                <th className="py-2.5 px-3 w-28 font-mono">Mã đơn</th>
                <th className="py-2.5 px-3 min-w-[220px]">Nội dung hàng hóa & Shop</th>
                <th className="py-2.5 px-2 text-center w-20">Loại</th>
                <th className="py-2.5 px-3 text-right w-28">Thanh toán</th>
                <th className="py-2.5 px-3 text-right w-32 font-bold text-amber-300">Tiền hoàn lại</th>
                <th className="py-2.5 px-3 w-40">Phương thức hoàn</th>
                <th className="py-2.5 px-3 text-center w-36">Trạng thái đối soát</th>
                <th className="py-2.5 px-3 min-w-[180px]">Ghi chú sổ sách</th>
              </tr>
            </thead>

            {/* Body Rows */}
            <tbody className="divide-y divide-slate-200">
              {displayedEntries.length === 0 ? (
                <tr>
                  <td colSpan="12" className="py-12 text-center">
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="text-slate-800 font-bold text-sm">
                        {paymentMethodFilter !== 'ALL' || reconciliationFilter !== 'ALL' || orderTypeFilter !== 'ALL' || searchQuery
                          ? 'Không tìm thấy đơn hàng nào khớp với bộ lọc hiện tại.'
                          : 'Chưa có đơn Hủy hoặc Trả hàng nào cần đối soát.'}
                      </div>
                      {accountOrders.length > 0 && paymentMethodFilter === 'ALL' && reconciliationFilter === 'ALL' && orderTypeFilter === 'ALL' && !searchQuery ? (
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-2">
                          <p className="text-xs text-amber-900 font-medium">
                            Bạn đang có <strong>{accountOrders.length}</strong> đơn mua hoàn thành trong hệ thống (không có đơn hủy/trả hàng).
                          </p>
                          <button
                            onClick={() => setActiveTab('all-ledger')}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs inline-flex items-center gap-1.5 transition-all"
                          >
                            <span>👉 Chuyển sang Sổ Nhật Ký Toàn Bộ Đơn Mua ({accountOrders.length} đơn)</span>
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Hãy thử điều chỉnh lại bộ lọc hoặc bấm nút <strong>"Đồng bộ / Nhập đơn"</strong> để nạp dữ liệu.
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayedEntries.map((order, index) => {
                  const isSelected = selectedIds.includes(order.id);
                  const isFinished = order.refundStatus === 'CONFIRMED_RECEIVED';
                  const isDisputed = order.refundStatus === 'DISPUTED';
                  const isEditingNote = editingNoteId === order.id;
                  const firstItem = order.items?.[0];
                  const otherItemsCount = (order.items?.length || 1) - 1;
                  const currentPM = normalizePaymentMethod(order.paymentMethod);

                  return (
                    <tr 
                      key={order.id}
                      className={`transition-colors font-medium ${
                        isSelected 
                          ? 'bg-amber-50/70' 
                          : isFinished 
                          ? 'bg-emerald-50/20 hover:bg-slate-50' 
                          : isDisputed 
                          ? 'bg-rose-50/40 hover:bg-rose-50/60'
                          : 'hover:bg-amber-50/30'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Chọn đơn hàng ${order.orderCode}`}
                          checked={isSelected}
                          onChange={() => handleToggleRow(order.id)}
                          className="rounded text-orange-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* STT */}
                      <td className="py-2.5 px-2 text-center text-slate-400 font-mono text-[11px]">
                        {index + 1}
                      </td>

                      {/* Ngày hủy/trả */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        {formatDate(order.cancelTime || order.orderTime)}
                      </td>

                      {/* Người mua */}
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                          👤 {getAccountName(order.accountId)}
                        </span>
                      </td>

                      {/* Mã đơn */}
                      <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                        #{order.orderCode}
                      </td>

                      {/* Nội dung hàng hóa & Shop */}
                      <td className="py-2.5 px-3">
                        <div className="text-slate-900 font-semibold line-clamp-1" title={firstItem?.name}>
                          {firstItem?.name || 'Đơn hàng Shopee'}
                          {otherItemsCount > 0 && (
                            <span className="text-slate-400 font-normal ml-1">(+{otherItemsCount} món)</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="font-medium text-slate-700">🏪 {order.shopName}</span>
                          {(order.cancelReason || order.refundReason) && (
                            <span className="text-slate-400 truncate max-w-[200px]" title={order.cancelReason || order.refundReason}>
                              • {order.cancelReason || order.refundReason}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Loại đơn */}
                      <td className="py-2.5 px-2 text-center">
                        {order.status === 'CANCELLED' ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded border border-rose-200">
                            HỦY ĐƠN
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded border border-purple-200">
                            TRẢ HÀNG
                          </span>
                        )}
                      </td>

                      {/* Tiền thanh toán */}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500 whitespace-nowrap">
                        {formatCurrency(order.totalAmount)}
                      </td>

                      {/* Tiền hoàn lại */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                        <span className={`text-sm ${
                          isFinished 
                            ? 'text-emerald-700' 
                            : isDisputed 
                            ? 'text-rose-700' 
                            : 'text-amber-700 font-black'
                        }`}>
                          {formatCurrency(order.refundAmount || order.totalAmount)}
                        </span>
                      </td>

                      {/* Phương thức hoàn (Đồng bộ chuẩn 100% với bộ lọc) */}
                      <td className="py-2 px-3 text-[11px] whitespace-nowrap">
                        <select
                          value={currentPM}
                          onChange={(e) => updateRefundField(order.id, { paymentMethod: e.target.value })}
                          className="bg-slate-100 hover:bg-white text-slate-800 text-[11px] font-semibold py-1 px-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer max-w-[150px] truncate"
                          title="Bấm để đổi phương thức hoàn tiền"
                        >
                          {PAYMENT_METHODS.map(pm => (
                            <option key={pm.key} value={pm.key}>
                              {pm.icon} {pm.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Đối soát nhận tiền (1-Click Toggle) */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {isFinished ? (
                          <button
                            onClick={() => toggleRefundStatus(order.id)}
                            title="Bấm để chuyển về Chưa nhận tiền nếu muốn theo dõi lại"
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] px-2.5 py-1 rounded-md shadow-xs flex items-center justify-center gap-1 mx-auto transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ĐÃ NHẬN TIỀN
                          </button>
                        ) : isDisputed ? (
                          <button
                            onClick={() => toggleRefundStatus(order.id)}
                            title="Bấm để xác nhận đã nhận đủ tiền"
                            className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-[11px] px-2.5 py-1 rounded-md shadow-xs flex items-center justify-center gap-1 mx-auto transition-all"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            QUÁ HẠN
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleRefundStatus(order.id)}
                            title="Bấm để xác nhận đã nhận đủ tiền vào tài khoản"
                            className="bg-amber-100 hover:bg-emerald-600 hover:text-white text-amber-900 border border-amber-300 font-bold text-[11px] px-2.5 py-1 rounded-md flex items-center justify-center gap-1 mx-auto transition-all group"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-700 group-hover:text-white" />
                            <span className="group-hover:hidden">CHƯA NHẬN</span>
                            <span className="hidden group-hover:inline">BẤM ĐÃ NHẬN</span>
                          </button>
                        )}
                      </td>

                      {/* Ghi chú sổ sách (Inline Editable) */}
                      <td className="py-2.5 px-3">
                        {isEditingNote ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              autoFocus
                              value={tempNoteValue}
                              onChange={(e) => setTempNoteValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveNote(order.id);
                                if (e.key === 'Escape') setEditingNoteId(null);
                              }}
                              placeholder="Ví dụ: Đã vào Techcombank 20/08..."
                              className="w-full text-xs p-1 bg-white border border-slate-400 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                            />
                            <button
                              onClick={() => handleSaveNote(order.id)}
                              className="p-1 bg-slate-900 text-white rounded hover:bg-slate-800"
                              title="Lưu ghi chú"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                              title="Hủy"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => handleStartEditNote(order)}
                            className="cursor-pointer hover:bg-slate-100 p-1 rounded group flex items-center justify-between text-[11px]"
                            title="Bấm để sửa ghi chú đối soát"
                          >
                            <span className={order.userNote ? 'text-slate-800 font-medium' : 'text-slate-400 italic'}>
                              {order.userNote || '+ Thêm ghi chú...'}
                            </span>
                            <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 shrink-0 ml-1" />
                          </div>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Grand Total Footer */}
            {refundLedgerEntries.length > 0 && (
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-mono text-xs font-bold text-slate-900">
                <tr>
                  <td colSpan="6" className="py-3 px-4 text-right uppercase tracking-wider text-slate-600">
                    Tổng cộng toàn bộ ({refundLedgerEntries.length} đơn):
                  </td>
                  <td className="py-3 px-2 text-center text-slate-500">--</td>
                  <td className="py-3 px-3 text-right text-slate-600">
                    {formatCurrency(totalPaid)}
                  </td>
                  <td className="py-3 px-3 text-right text-amber-700 font-black text-sm">
                    {formatCurrency(totalRefund)}
                  </td>
                  <td colSpan="3" className="py-3 px-4 text-xs font-sans text-slate-700">
                    <div className="flex items-center gap-4">
                      <span>Đã nhận: <strong className="text-emerald-700 font-mono">{formatCurrency(totalConfirmed)}</strong></span>
                      <span>Còn phải thu: <strong className="text-amber-700 font-mono">{formatCurrency(totalPending)}</strong></span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            )}

          </table>
        </div>
      </div>

      {/* Pagination / Load More Bar */}
      {refundLedgerEntries.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-300 text-xs">
          <span className="text-slate-600 font-medium">
            Đang hiển thị <strong>{displayedEntries.length}</strong> / <strong>{refundLedgerEntries.length}</strong> đơn hàng
          </span>

          {hasMore ? (
            <button
              onClick={handleLoadMore}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg shadow-xs flex items-center gap-1.5 transition-all hover:scale-[1.01]"
            >
              <ArrowDownCircle className="w-4 h-4 text-amber-400" />
              <span>Tải thêm 50 đơn tiếp theo (còn {refundLedgerEntries.length - visibleCount} đơn)</span>
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
