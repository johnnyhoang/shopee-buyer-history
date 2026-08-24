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
  Filter
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
  const [errorMsg, setErrorMsg] = useState('');

  if (!isSyncModalOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonText(event.target.result);
      setErrorMsg('');
    };
    reader.onerror = () => {
      setErrorMsg('Không thể đọc file đã chọn.');
    };
    reader.readAsText(file);
  };

  const parseShopeeData = (parsed) => {
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
      if (item.orderCode && item.status) {
        return item;
      }

      const info = item.info_card || item;
      const rawItems = item.item_list || item.items || [];
      const items = rawItems.map(p => ({
        name: p.item_info?.item_name || p.name || 'Sản phẩm Shopee',
        imageUrl: p.item_info?.item_image ? `https://down-vn.img.susercontent.com/file/${p.item_info.item_image}` : '',
        quantity: p.order_price_info?.amount || p.amount || 1,
        price: (p.order_price_info?.final_price || p.price || 0) / 100000,
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
      const rawPrice = info.subtotal_price || info.total_price || item.final_total || item.totalAmount || 0;
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

    // 🎯 BỘ LỌC CHỈ NẠP CÁC ĐƠN CẦN HOÀN TIỀN (Theo yêu cầu):
    // - Đơn Trả hàng / Hoàn tiền -> LẤY
    // - Đơn Đã Hủy CÓ THANH TOÁN (tiền hoàn > 1.000đ) -> LẤY
    // - Đơn đang giao, chờ thanh toán, hoàn thành bình thường, đơn hủy 0đ chưa trả tiền -> BỎ QUA
    const refundOnlyOrders = mapped.filter(ord => {
      const isReturnRefund = ord.status === 'REFUNDED' || 
                             ord.status === 'REFUNDING' || 
                             (ord.statusText || '').toLowerCase().includes('trả hàng') || 
                             (ord.statusText || '').toLowerCase().includes('hoàn tiền');
      
      const refundAmt = Number(ord.refundAmount || ord.totalAmount || 0);
      const isCancelledPaid = (ord.status === 'CANCELLED' || (ord.statusText || '').toLowerCase().includes('hủy')) && refundAmt > 1000;

      return isReturnRefund || isCancelledPaid;
    });

    return refundOnlyOrders;
  };

  const handleProcessImport = () => {
    setErrorMsg('');
    if (!jsonText.trim()) {
      setErrorMsg('Vui lòng dán nội dung JSON hoặc chọn file JSON.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      const ordersArray = parseShopeeData(parsed);

      if (ordersArray.length === 0) {
        setErrorMsg('Không tìm thấy đơn Trả hàng hoặc Đơn hủy đã thanh toán nào trong dữ liệu này (các đơn đang giao / đơn hủy chưa thanh toán đã được tự động bỏ qua).');
        return;
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
              <h3 className="font-bold text-slate-900 text-sm">Nhập Dữ Liệu Hoàn Tiền</h3>
              <p className="text-[11px] text-slate-500">Tự động chọn lọc đơn Trả hàng & Đơn hủy đã thanh toán</p>
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
          
          {/* Smart Filter Info Banner */}
          <div className="bg-amber-50/80 border border-amber-300/80 p-2.5 rounded-xl flex items-start gap-2 text-[11px] text-amber-900">
            <Filter className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Quy tắc nạp thông minh:</strong>
              <div className="text-amber-800/90 mt-0.5">
                • <strong>Chỉ nạp:</strong> Đơn <strong>Trả hàng</strong> và Đơn <strong>Đã hủy có phát sinh tiền hoàn</strong>.<br />
                • <strong>Tự động bỏ qua:</strong> Đơn đang giao, chờ giao và đơn hủy khi chưa thanh toán.
              </div>
            </div>
          </div>

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

          {/* File Upload Box */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Chọn file JSON từ Shopee:
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
              onChange={(e) => { setJsonText(e.target.value); setErrorMsg(''); }}
              placeholder="Dán dữ liệu JSON..."
              className="w-full text-[11px] p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-[11px]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
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
            onClick={handleProcessImport}
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
