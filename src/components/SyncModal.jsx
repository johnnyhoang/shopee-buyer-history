import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storage';
import { 
  X, 
  Upload, 
  DownloadCloud, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Users,
  Download,
  ShieldCheck,
  Filter,
  Check
} from 'lucide-react';

export const SyncModal = () => {
  const { 
    isSyncModalOpen, 
    setIsSyncModalOpen, 
    accounts, 
    importOrders, 
    showNotification 
  } = useApp();

  const [jsonText, setJsonText] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || 'acc_main');
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [filterRefundOnly, setFilterRefundOnly] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [unfilteredOrdersCache, setUnfilteredOrdersCache] = useState(null);

  if (!isSyncModalOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonText(event.target.result);
      setErrorMsg('');
      setUnfilteredOrdersCache(null);
    };
    reader.onerror = () => {
      setErrorMsg('Không thể đọc file đã chọn.');
    };
    reader.readAsText(file);
  };

  const parseNumber = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const clean = String(val).replace(/[^0-9.-]+/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const parseShopeeData = (parsed, applyFilter = true) => {
    let rawList = [];

    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else if (parsed.orders && Array.isArray(parsed.orders)) {
      rawList = parsed.orders;
    } else if (parsed.details_list) {
      rawList = parsed.details_list;
    } else if (parsed.data && Array.isArray(parsed.data)) {
      rawList = parsed.data;
    }

    if (!rawList || rawList.length === 0) {
      throw new Error('Không tìm thấy danh sách đơn hàng trong dữ liệu này.');
    }

    const mapped = rawList.map((item) => {
      // Nếu đã có cấu trúc định dạng chuẩn
      if (item.orderCode && item.status) {
        const total = parseNumber(item.totalAmount);
        const refund = item.refundAmount !== undefined ? parseNumber(item.refundAmount) : total;
        return {
          ...item,
          orderCode: String(item.orderCode),
          status: String(item.status).toUpperCase(),
          totalAmount: total,
          refundAmount: refund,
          paymentMethod: item.paymentMethod || 'ShopeePay / Thẻ',
          userNote: item.userNote || '',
          items: item.items || [],
        };
      }

      // Xử lý object thô từ Shopee
      const info = item.info_card || item;
      const rawItems = item.item_list || item.items || [];
      const items = rawItems.map(p => ({
        name: p.item_info?.item_name || p.name || 'Sản phẩm Shopee',
        imageUrl: p.item_info?.item_image ? `https://down-vn.img.susercontent.com/file/${p.item_info.item_image}` : '',
        quantity: parseNumber(p.order_price_info?.amount || p.amount || 1),
        price: parseNumber(p.order_price_info?.final_price || p.price || 0) > 10000000 
          ? parseNumber(p.order_price_info?.final_price || p.price || 0) / 100000 
          : parseNumber(p.order_price_info?.final_price || p.price || 0),
        modelName: p.item_info?.model_name || p.model_name || ''
      }));

      let status = 'COMPLETED';
      let statusText = info.order_list_cards?.[0]?.status_text || info.status_text || 'Hoàn thành';
      const st = (statusText || '').toLowerCase();
      if (st.includes('hủy') || st.includes('cancelled')) status = 'CANCELLED';
      else if (st.includes('trả hàng') || st.includes('hoàn tiền') || st.includes('refund')) status = 'REFUNDED';
      else if (st.includes('đang giao') || st.includes('vận chuyển') || st.includes('shipping')) status = 'SHIPPING';
      else if (st.includes('chờ thanh toán')) status = 'PENDING_PAYMENT';
      else if (st.includes('chờ lấy hàng') || st.includes('đang xử lý')) status = 'PROCESSING';

      const orderId = item.order_id || item.order_sn || item.id || Date.now();
      const rawPrice = parseNumber(info.subtotal_price || info.total_price || item.final_total || item.totalAmount || 0);
      const total = rawPrice > 10000000 ? rawPrice / 100000 : rawPrice;

      return {
        id: 'shopee_' + orderId,
        orderCode: String(orderId),
        shopName: info.shop_info?.username || info.shop_name || 'Shopee Shop',
        status: status,
        statusText: statusText,
        orderTime: new Date((item.create_time || item.pay_time || Date.now() / 1000) * 1000).toISOString(),
        cancelTime: item.cancel_time ? new Date(item.cancel_time * 1000).toISOString() : null,
        totalAmount: total,
        refundAmount: total,
        paymentMethod: info.payment_method_name || item.payment_method || 'ShopeePay / Thẻ',
        cancelReason: item.cancel_reason || '',
        refundReason: item.return_refund_reason || '',
        items: items
      };
    });

    if (!applyFilter) {
      return mapped;
    }

    // 🎯 BỘ LỌC CHỈ NẠP CÁC ĐƠN CẦN HOÀN TIỀN:
    const refundOnlyOrders = mapped.filter(ord => {
      const statusUpper = (ord.status || '').toUpperCase();
      const statusTextLower = (ord.statusText || '').toLowerCase();

      // 1. Đơn Trả hàng / Hoàn tiền -> LẤY
      const isReturnRefund = statusUpper === 'REFUNDED' || 
                             statusUpper === 'REFUNDING' || 
                             statusTextLower.includes('trả hàng') || 
                             statusTextLower.includes('hoàn tiền');
      
      // 2. Đơn Đã Hủy có phát sinh tiền (> 0)
      const refundAmt = parseNumber(ord.refundAmount || ord.totalAmount || 0);
      const isCancelledPaid = (statusUpper === 'CANCELLED' || statusTextLower.includes('hủy')) && refundAmt > 0;

      return isReturnRefund || isCancelledPaid;
    });

    return refundOnlyOrders;
  };

  const handleProcessImport = (forceAll = false) => {
    setErrorMsg('');
    setUnfilteredOrdersCache(null);

    if (!jsonText.trim()) {
      setErrorMsg('Vui lòng dán nội dung JSON hoặc chọn file JSON.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      const shouldFilter = forceAll ? false : filterRefundOnly;
      const ordersArray = parseShopeeData(parsed, shouldFilter);

      if (ordersArray.length === 0) {
        // Kiểm tra xem nếu không lọc thì có bao nhiêu đơn
        const allOrders = parseShopeeData(parsed, false);
        if (allOrders.length > 0) {
          setUnfilteredOrdersCache(allOrders);
          setErrorMsg(`Dữ liệu có ${allOrders.length} đơn hàng nhưng đều là đơn Hoàn thành/Đang giao bình thường (không có đơn Hủy/Trả hàng).`);
          return;
        } else {
          setErrorMsg('Không tìm thấy đơn hàng nào trong file dữ liệu.');
          return;
        }
      }

      const accId = isNewAccount ? `acc_${Date.now()}` : selectedAccountId;
      const accName = isNewAccount ? (newAccountName.trim() || 'Tài khoản Shopee mới') : undefined;

      importOrders(ordersArray, accId, accName);
      setIsSyncModalOpen(false);
      setJsonText('');
    } catch (err) {
      console.error(err);
      setErrorMsg('Dữ liệu JSON không hợp lệ: ' + (err.message || 'Lỗi cú pháp'));
    }
  };

  const handleExportAll = () => {
    const jsonStr = storageService.exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `shopee_refund_ledger_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    showNotification('Đã xuất file sao lưu dữ liệu thành công!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold shrink-0">
              <DownloadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Nhập Dữ Liệu Vào Sổ</h3>
              <p className="text-[11px] text-slate-500">Hỗ trợ file xuất Shopee và file sao lưu JSON</p>
            </div>
          </div>

          <button
            onClick={() => setIsSyncModalOpen(false)}
            className="w-7 h-7 rounded-full bg-slate-200/70 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 max-h-[75vh] overflow-y-auto text-xs">
          
          {/* Target Account Selection */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-900" />
              Gán đơn hàng cho tài khoản:
            </label>
            
            <div className="flex items-center gap-1.5">
              <select
                disabled={isNewAccount}
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                aria-label="Chọn tài khoản"
                className="flex-1 bg-white text-xs font-semibold p-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-100"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    👤 {acc.name} {acc.username ? `(@${acc.username})` : ''}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsNewAccount(!isNewAccount)}
                className="text-[11px] font-bold text-slate-800 bg-white px-2 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-100 shrink-0"
              >
                {isNewAccount ? 'Chọn cũ' : '+ Thêm mới'}
              </button>
            </div>

            {isNewAccount && (
              <div className="pt-1">
                <input
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Nhập tên người mua..."
                  className="w-full text-xs p-1.5 bg-white border border-amber-400 rounded-lg focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Smart Filter Toggle */}
          <div 
            onClick={() => setFilterRefundOnly(!filterRefundOnly)}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
              filterRefundOnly 
                ? 'bg-amber-50/80 border-amber-300 text-amber-950' 
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <input
              type="checkbox"
              checked={filterRefundOnly}
              onChange={() => {}}
              className="rounded text-amber-600 focus:ring-0 cursor-pointer w-4 h-4 mt-0.5"
            />
            <div className="text-[11px] flex-1">
              <strong className="font-bold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-amber-600" />
                Chỉ nạp các đơn Cần hoàn tiền (Khuyên dùng)
              </strong>
              <div className="text-slate-600 mt-0.5 leading-relaxed">
                Tự động lọc đơn <strong>Trả hàng / Hoàn tiền</strong> và đơn <strong>Đã hủy có thanh toán</strong>. Bỏ qua đơn đang giao và đơn hủy 0đ.
              </div>
            </div>
          </div>

          {/* File Upload Box */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Chọn file JSON:
            </label>
            <div className="border border-dashed border-slate-300 hover:border-slate-800 bg-slate-50/50 hover:bg-slate-100/50 rounded-xl p-3 text-center cursor-pointer transition-all relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
              <p className="text-[11px] font-semibold text-slate-700">Kéo thả file .json vào đây hoặc bấm để chọn</p>
            </div>
          </div>

          {/* Text Area for pasting */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Hoặc dán trực tiếp nội dung JSON:
            </label>
            <textarea
              rows={4}
              value={jsonText}
              onChange={(e) => { 
                setJsonText(e.target.value); 
                setErrorMsg(''); 
                setUnfilteredOrdersCache(null);
              }}
              placeholder="Dán dữ liệu JSON vào đây..."
              className="w-full text-[11px] p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Error message / Notice */}
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-rose-800 text-[11px]">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMsg}</span>
              </div>

              {unfilteredOrdersCache && (
                <div className="pt-1 border-t border-rose-200 flex items-center justify-between">
                  <span className="text-slate-700 font-medium">Bạn vẫn muốn nạp tất cả?</span>
                  <button
                    type="button"
                    onClick={() => handleProcessImport(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-2.5 py-1 rounded-lg text-xs"
                  >
                    👉 Nạp tất cả {unfilteredOrdersCache.length} đơn này
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Backup / Export Option */}
          <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Sao lưu dữ liệu hiện tại:</span>
            <button
              type="button"
              onClick={handleExportAll}
              className="font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 underline"
            >
              <Download className="w-3.5 h-3.5" />
              Tải file JSON sao lưu
            </button>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(false)}
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 font-bold transition-colors"
          >
            Đóng
          </button>
          
          <button
            type="button"
            onClick={() => handleProcessImport(false)}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-2xs flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Tiến Hành Nhập</span>
          </button>
        </div>

      </div>
    </div>
  );
};
