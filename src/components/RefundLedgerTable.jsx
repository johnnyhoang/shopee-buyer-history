import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, normalizePaymentMethod, PAYMENT_METHODS } from '../utils/formatters';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  CheckSquare, 
  Edit2, 
  Check, 
  X, 
  ArrowDownCircle,
  Trash2,
  Ban
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
    deleteOrder,
    batchDeleteOrders,
    markNoRefundNeeded,
    autoDeduplicateOrders
  } = useApp();

  const [selectedIds, setSelectedIds] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [tempNoteValue, setTempNoteValue] = useState('');
  
  // Phân trang 50 dòng
  const [visibleCount, setVisibleCount] = useState(50);

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

  const totalPaid = refundLedgerEntries.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalRefund = refundLedgerEntries.reduce((sum, o) => sum + (o.refundAmount || o.totalAmount || 0), 0);
  const totalConfirmed = refundLedgerEntries
    .filter(o => o.refundStatus === 'CONFIRMED_RECEIVED')
    .reduce((sum, o) => sum + (o.refundAmount || o.totalAmount || 0), 0);
  const totalPending = totalRefund - totalConfirmed;

  const displayedEntries = refundLedgerEntries.slice(0, visibleCount);
  const hasMore = visibleCount < refundLedgerEntries.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 50, refundLedgerEntries.length));
  };

  return (
    <div className="space-y-2">
      
      {/* Sổ cái Filter Bar - Ultra Compact */}
      <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-1.5 text-xs">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm mã đơn, shop, món hàng..."
            className="w-full pl-7 pr-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 text-[11px]">
          
          {/* Loại Đơn */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 shrink-0">
            <button
              onClick={() => setOrderTypeFilter('ALL')}
              className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                orderTypeFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({refundLedgerEntries.length})
            </button>
            <button
              onClick={() => setOrderTypeFilter('CANCELLED')}
              className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                orderTypeFilter === 'CANCELLED' ? 'bg-rose-700 text-white' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hủy
            </button>
            <button
              onClick={() => setOrderTypeFilter('REFUNDED')}
              className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                orderTypeFilter === 'REFUNDED' ? 'bg-purple-700 text-white' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Trả hàng
            </button>
          </div>

          {/* Đối soát */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200 shrink-0">
            <button
              onClick={() => setReconciliationFilter('UNRESOLVED')}
              className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                reconciliationFilter === 'UNRESOLVED' ? 'bg-amber-600 text-white' : 'text-amber-800 hover:bg-amber-100'
              }`}
            >
              Chưa nhận
            </button>
            <button
              onClick={() => setReconciliationFilter('CONFIRMED')}
              className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                reconciliationFilter === 'CONFIRMED' ? 'bg-emerald-700 text-white' : 'text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Đã nhận
            </button>
            <button
              onClick={() => setReconciliationFilter('ALL')}
              className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                reconciliationFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Mọi TT
            </button>
          </div>

          {/* Phương thức hoàn */}
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            aria-label="Lọc theo phương thức hoàn"
            className="bg-slate-100 text-slate-800 font-semibold p-1 rounded border border-slate-200 focus:outline-none cursor-pointer shrink-0 text-[11px]"
          >
            <option value="ALL">Mọi phương thức</option>
            {PAYMENT_METHODS.map(pm => (
              <option key={pm.key} value={pm.key}>
                {pm.icon} {pm.label}
              </option>
            ))}
          </select>

          {/* Dọn đơn trùng */}
          <button
            onClick={() => {
              if (window.confirm('Tự động quét và loại bỏ các dòng rác (Tổng tiền hoàn) và đơn trùng lặp?')) {
                autoDeduplicateOrders();
              }
            }}
            title="Lọc sạch dòng rác và đơn trùng lặp"
            className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold px-2 py-1 rounded text-[11px] transition-colors shrink-0"
          >
            <span>🧹 Dọn đơn trùng</span>
          </button>

        </div>

      </div>

      {/* Batch Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 px-2 py-1.5 rounded-lg flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
          <div className="font-bold text-amber-900 flex items-center gap-1">
            <CheckSquare className="w-3.5 h-3.5 text-amber-700" />
            <span>Đã chọn <strong>{selectedIds.length}</strong> đơn</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => batchConfirmRefunds(selectedIds)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-2 py-1 rounded font-bold transition-colors"
            >
              Đã nhận ({selectedIds.length})
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Đánh dấu ${selectedIds.length} đơn là Chưa thanh toán (Bỏ hoàn)?`)) {
                  selectedIds.forEach(id => markNoRefundNeeded(id));
                  setSelectedIds([]);
                }
              }}
              className="bg-slate-700 hover:bg-slate-800 text-white px-2 py-1 rounded font-bold transition-colors"
            >
              Chưa TT ({selectedIds.length})
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Xóa ${selectedIds.length} đơn đã chọn khỏi hệ thống?`)) {
                  batchDeleteOrders(selectedIds);
                  setSelectedIds([]);
                }
              }}
              className="bg-rose-900 hover:bg-rose-800 text-white px-2 py-1 rounded font-bold transition-colors"
            >
              Xóa ({selectedIds.length})
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-slate-600 hover:text-slate-900 px-1.5 py-0.5 font-semibold"
            >
              Bỏ
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 📱 MOBILE ULTRA-COMPACT DENSE LIST (Màn hình nhỏ < md)   */}
      {/* ======================================================== */}
      <div className="block md:hidden divide-y divide-slate-200 bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        {displayedEntries.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            Không tìm thấy đơn nào phù hợp.
          </div>
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
              <div 
                key={order.id}
                className={`p-2 transition-all text-xs space-y-1 ${
                  isSelected 
                    ? 'bg-amber-50/80' 
                    : isFinished 
                    ? 'bg-emerald-50/15' 
                    : isDisputed 
                    ? 'bg-rose-50/30' 
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* Dòng 1: STT, Mã đơn, Huy hiệu, Tiền hoàn & Nút xác nhận */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0">
                    <input
                      type="checkbox"
                      aria-label={`Chọn đơn ${order.orderCode}`}
                      checked={isSelected}
                      onChange={() => handleToggleRow(order.id)}
                      className="rounded text-orange-600 focus:ring-0 cursor-pointer w-3.5 h-3.5 shrink-0"
                    />
                    <span className="font-mono text-slate-400 text-[10px] shrink-0">#{index + 1}</span>
                    <span className="font-mono font-bold text-slate-900 text-[11px] truncate">#{order.orderCode}</span>
                    {order.status === 'CANCELLED' ? (
                      <span className="text-[9px] font-bold px-1 py-0.2 bg-rose-100 text-rose-800 rounded shrink-0">HỦY</span>
                    ) : (
                      <span className="text-[9px] font-bold px-1 py-0.2 bg-purple-100 text-purple-800 rounded shrink-0">TRẢ</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`font-mono text-xs font-black ${
                      isFinished ? 'text-emerald-700' : isDisputed ? 'text-rose-700' : 'text-amber-700'
                    }`}>
                      {formatCurrency(order.refundAmount || order.totalAmount)}
                    </span>

                    {/* Quick 1-Touch Toggle Button */}
                    {isFinished ? (
                      <button
                        onClick={() => toggleRefundStatus(order.id)}
                        className="bg-emerald-700 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-2xs flex items-center gap-0.5"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ĐÃ NHẬN</span>
                      </button>
                    ) : isDisputed ? (
                      <button
                        onClick={() => toggleRefundStatus(order.id)}
                        className="bg-rose-700 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-2xs flex items-center gap-0.5"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>QUÁ HẠN</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleRefundStatus(order.id)}
                        className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded shadow-2xs flex items-center gap-0.5 hover:bg-emerald-600 hover:text-white"
                      >
                        <Clock className="w-3 h-3" />
                        <span>CHƯA NHẬN</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Dòng 2: Tên Shop, Ngày, Phương thức hoàn & Thao tác */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 gap-1">
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <span className="font-semibold text-slate-700 truncate">🏪 {order.shopName}</span>
                    <span>•</span>
                    <span className="font-mono shrink-0">{formatDate(order.cancelTime || order.orderTime)}</span>
                    <span>•</span>
                    <span className="shrink-0">👤 {getAccountName(order.accountId)}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <select
                      value={currentPM}
                      onChange={(e) => updateRefundField(order.id, { paymentMethod: e.target.value })}
                      className="bg-slate-100 text-slate-700 text-[10px] font-semibold py-0.5 px-1 rounded border border-slate-200 focus:outline-none max-w-[100px] truncate"
                    >
                      {PAYMENT_METHODS.map(pm => (
                        <option key={pm.key} value={pm.key}>
                          {pm.icon} {pm.label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        if (window.confirm('Bỏ hoàn (Chưa thanh toán)?')) {
                          markNoRefundNeeded(order.id);
                        }
                      }}
                      title="Chưa thanh toán (Bỏ hoàn)"
                      className="p-0.5 text-slate-400 hover:text-slate-700"
                    >
                      <Ban className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Xóa đơn #${order.orderCode}?`)) {
                          deleteOrder(order.id);
                        }
                      }}
                      title="Xóa đơn"
                      className="p-0.5 text-slate-300 hover:text-rose-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Dòng 3: Tên sản phẩm & Ghi chú (Compact) */}
                <div className="flex items-center justify-between text-[11px] gap-2 pt-0.5">
                  <div className="text-slate-800 font-medium truncate flex-1" title={firstItem?.name}>
                    {firstItem?.name || 'Sản phẩm Shopee'}
                    {otherItemsCount > 0 && <span className="text-slate-400 font-normal ml-1">(+{otherItemsCount})</span>}
                  </div>

                  {/* Ghi chú inline */}
                  <div className="shrink-0 max-w-[45%] text-[10px]">
                    {isEditingNote ? (
                      <div className="flex items-center gap-0.5">
                        <input
                          type="text"
                          autoFocus
                          value={tempNoteValue}
                          onChange={(e) => setTempNoteValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveNote(order.id);
                            if (e.key === 'Escape') setEditingNoteId(null);
                          }}
                          placeholder="Ghi chú..."
                          className="w-24 text-[10px] p-0.5 bg-white border border-slate-400 rounded"
                        />
                        <button onClick={() => handleSaveNote(order.id)} className="p-0.5 bg-slate-900 text-white rounded"><Check className="w-2.5 h-2.5" /></button>
                        <button onClick={() => setEditingNoteId(null)} className="p-0.5 bg-slate-200 text-slate-700 rounded"><X className="w-2.5 h-2.5" /></button>
                      </div>
                    ) : (
                      <span 
                        onClick={() => handleStartEditNote(order)}
                        className={`cursor-pointer truncate block px-1 py-0.2 rounded hover:bg-slate-100 ${
                          order.userNote ? 'text-blue-700 font-medium bg-blue-50' : 'text-slate-400 italic'
                        }`}
                        title={order.userNote || 'Thêm ghi chú'}
                      >
                        📝 {order.userNote || '+ Note'}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* ======================================================== */}
      {/* 💻 DESKTOP DENSE TABLE VIEW (Màn hình lớn >= md)         */}
      {/* ======================================================== */}
      <div className="hidden md:block bg-white rounded-lg border border-slate-300 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            
            <thead className="bg-slate-900 text-slate-100 font-mono text-[10px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-1.5 px-2 text-center w-8">
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả"
                    checked={refundLedgerEntries.length > 0 && selectedIds.length === refundLedgerEntries.length}
                    onChange={handleSelectAll}
                    className="rounded text-orange-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                  />
                </th>
                <th className="py-1.5 px-1 text-center w-8">STT</th>
                <th className="py-1.5 px-2 w-24">Ngày</th>
                <th className="py-1.5 px-2 w-28">Người mua</th>
                <th className="py-1.5 px-2 w-24 font-mono">Mã đơn</th>
                <th className="py-1.5 px-2 min-w-[200px]">Nội dung hàng & Shop</th>
                <th className="py-1.5 px-1 text-center w-14">Loại</th>
                <th className="py-1.5 px-2 text-right w-24">Thanh toán</th>
                <th className="py-1.5 px-2 text-right w-28 font-bold text-amber-300">Hoàn lại</th>
                <th className="py-1.5 px-2 w-32">Hoàn về</th>
                <th className="py-1.5 px-2 text-center w-32">Đối soát</th>
                <th className="py-1.5 px-2 min-w-[140px]">Ghi chú</th>
                <th className="py-1.5 px-1 text-center w-8">Xóa</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 text-[11px]">
              {displayedEntries.length === 0 ? (
                <tr>
                  <td colSpan="13" className="py-8 text-center text-slate-400">
                    Không tìm thấy đơn hàng nào khớp với bộ lọc.
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
                      className={`transition-colors ${
                        isSelected 
                          ? 'bg-amber-50/70' 
                          : isFinished 
                          ? 'bg-emerald-50/15 hover:bg-slate-50' 
                          : isDisputed 
                          ? 'bg-rose-50/30 hover:bg-rose-50/50' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-1.5 px-2 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Chọn ${order.orderCode}`}
                          checked={isSelected}
                          onChange={() => handleToggleRow(order.id)}
                          className="rounded text-orange-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                        />
                      </td>
                      <td className="py-1.5 px-1 text-center text-slate-400 font-mono text-[10px]">{index + 1}</td>
                      <td className="py-1.5 px-2 font-mono text-[10px] text-slate-600 whitespace-nowrap">{formatDate(order.cancelTime || order.orderTime)}</td>
                      <td className="py-1.5 px-2">
                        <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] truncate max-w-[90px] inline-block">
                          {getAccountName(order.accountId)}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 font-mono text-slate-600 text-[10px]">#{order.orderCode}</td>
                      <td className="py-1.5 px-2">
                        <div className="text-slate-900 font-semibold truncate max-w-[240px]" title={firstItem?.name}>
                          {firstItem?.name || 'Đơn hàng Shopee'}
                          {otherItemsCount > 0 && <span className="text-slate-400 font-normal ml-1">(+{otherItemsCount})</span>}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                          <span>🏪 {order.shopName}</span>
                          {(order.cancelReason || order.refundReason) && <span>• {order.cancelReason || order.refundReason}</span>}
                        </div>
                      </td>
                      <td className="py-1.5 px-1 text-center">
                        {order.status === 'CANCELLED' ? (
                          <span className="text-[9px] font-bold px-1 py-0.2 bg-rose-100 text-rose-800 rounded">HỦY</span>
                        ) : (
                          <span className="text-[9px] font-bold px-1 py-0.2 bg-purple-100 text-purple-800 rounded">TRẢ</span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-slate-500 whitespace-nowrap">{formatCurrency(order.totalAmount)}</td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold whitespace-nowrap">
                        <span className={`${isFinished ? 'text-emerald-700' : isDisputed ? 'text-rose-700' : 'text-amber-700 font-black'}`}>
                          {formatCurrency(order.refundAmount || order.totalAmount)}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 whitespace-nowrap">
                        <select
                          value={currentPM}
                          onChange={(e) => updateRefundField(order.id, { paymentMethod: e.target.value })}
                          className="bg-slate-100 hover:bg-white text-slate-800 text-[10px] font-semibold py-0.5 px-1 rounded border border-slate-200 focus:outline-none cursor-pointer max-w-[120px] truncate"
                        >
                          {PAYMENT_METHODS.map(pm => (
                            <option key={pm.key} value={pm.key}>{pm.icon} {pm.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-1.5 px-2 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {isFinished ? (
                            <button
                              onClick={() => toggleRefundStatus(order.id)}
                              className="bg-emerald-700 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-2xs flex items-center gap-0.5"
                            >
                              <CheckCircle2 className="w-3 h-3" /> ĐÃ NHẬN
                            </button>
                          ) : isDisputed ? (
                            <button
                              onClick={() => toggleRefundStatus(order.id)}
                              className="bg-rose-700 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-2xs flex items-center gap-0.5"
                            >
                              <AlertTriangle className="w-3 h-3" /> QUÁ HẠN
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleRefundStatus(order.id)}
                              className="bg-amber-100 hover:bg-emerald-600 hover:text-white text-amber-900 border border-amber-300 font-bold text-[10px] px-2 py-0.5 rounded flex items-center gap-0.5"
                            >
                              <Clock className="w-3 h-3 text-amber-700" /> CHƯA NHẬN
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (window.confirm('Bỏ hoàn (Chưa thanh toán)?')) markNoRefundNeeded(order.id);
                            }}
                            title="Chưa thanh toán (Bỏ hoàn)"
                            className="p-0.5 text-slate-400 hover:text-slate-700"
                          >
                            <Ban className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-1.5 px-2">
                        {isEditingNote ? (
                          <div className="flex items-center gap-0.5">
                            <input
                              type="text"
                              autoFocus
                              value={tempNoteValue}
                              onChange={(e) => setTempNoteValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveNote(order.id);
                                if (e.key === 'Escape') setEditingNoteId(null);
                              }}
                              className="w-full text-[10px] p-0.5 bg-white border border-slate-400 rounded"
                            />
                            <button onClick={() => handleSaveNote(order.id)} className="p-0.5 bg-slate-900 text-white rounded"><Check className="w-2.5 h-2.5" /></button>
                            <button onClick={() => setEditingNoteId(null)} className="p-0.5 bg-slate-200 text-slate-700 rounded"><X className="w-2.5 h-2.5" /></button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => handleStartEditNote(order)}
                            className="cursor-pointer hover:bg-slate-100 p-0.5 rounded flex items-center justify-between text-[10px]"
                          >
                            <span className={order.userNote ? 'text-slate-800 font-medium truncate max-w-[120px]' : 'text-slate-400 italic'}>
                              {order.userNote || '+ Ghi chú'}
                            </span>
                            <Edit2 className="w-2.5 h-2.5 text-slate-400 shrink-0 ml-0.5" />
                          </div>
                        )}
                      </td>
                      <td className="py-1.5 px-1 text-center">
                        <button
                          onClick={() => {
                            if (window.confirm(`Xóa đơn #${order.orderCode}?`)) deleteOrder(order.id);
                          }}
                          className="p-0.5 text-slate-300 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Total Footer */}
            {refundLedgerEntries.length > 0 && (
              <tfoot className="bg-slate-100 border-t border-slate-300 font-mono text-[11px] font-bold text-slate-900">
                <tr>
                  <td colSpan="6" className="py-2 px-2 text-right uppercase text-slate-600">Tổng ({refundLedgerEntries.length} đơn):</td>
                  <td></td>
                  <td className="py-2 px-2 text-right text-slate-600">{formatCurrency(totalPaid)}</td>
                  <td className="py-2 px-2 text-right text-amber-700 font-black">{formatCurrency(totalRefund)}</td>
                  <td colSpan="4" className="py-2 px-2 text-[10px] text-slate-700">
                    Đã nhận: <strong className="text-emerald-700">{formatCurrency(totalConfirmed)}</strong> • Còn: <strong className="text-amber-700">{formatCurrency(totalPending)}</strong>
                  </td>
                </tr>
              </tfoot>
            )}

          </table>
        </div>
      </div>

      {/* Pagination Load More Bar */}
      {refundLedgerEntries.length > 0 && (
        <div className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-[11px]">
          <span className="text-slate-500">
            Hiển thị <strong>{displayedEntries.length}</strong> / <strong>{refundLedgerEntries.length}</strong> đơn
          </span>

          {hasMore ? (
            <button
              onClick={handleLoadMore}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-1 px-3 rounded shadow-2xs flex items-center gap-1 transition-all"
            >
              <ArrowDownCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Tải thêm 50 đơn (còn {refundLedgerEntries.length - visibleCount})</span>
            </button>
          ) : (
            <span className="text-slate-400 font-medium italic">
              Đã tải hết {refundLedgerEntries.length} đơn
            </span>
          )}
        </div>
      )}

    </div>
  );
};
