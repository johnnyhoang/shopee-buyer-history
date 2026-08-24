import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storage';
import { 
  X, 
  DownloadCloud, 
  Upload, 
  FileJson, 
  Check, 
  AlertCircle, 
  FileDown, 
  Users, 
  Layers 
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
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || 'acc_1');
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isSyncModalOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        setJsonText(String(content));
        setErrorMsg('');
      } catch (err) {
        setErrorMsg('Không thể đọc file JSON này.');
      }
    };
    reader.readAsText(file);
  };

  const handleProcessImport = () => {
    setErrorMsg('');
    if (!jsonText.trim()) {
      setErrorMsg('Vui lòng dán nội dung JSON hoặc chọn file JSON.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      let ordersArray = [];

      if (Array.isArray(parsed)) {
        ordersArray = parsed;
      } else if (parsed.orders && Array.isArray(parsed.orders)) {
        ordersArray = parsed.orders;
      } else if (parsed.data?.order_data?.details_list) {
        // Raw Shopee API response format
        ordersArray = parsed.data.order_data.details_list.map((item) => {
          const info = item.info_card || {};
          const items = (item.item_list || []).map(p => ({
            name: p.item_info?.item_name || 'Sản phẩm Shopee',
            imageUrl: p.item_info?.item_image ? `https://down-vn.img.susercontent.com/file/${p.item_info.item_image}` : '',
            quantity: p.order_price_info?.amount || 1,
            price: (p.order_price_info?.final_price || 0) / 100000,
            modelName: p.item_info?.model_name || ''
          }));

          let status = 'COMPLETED';
          let statusText = info.order_list_cards?.[0]?.status_text || 'Hoàn thành';
          const st = statusText.toLowerCase();
          if (st.includes('hủy')) status = 'CANCELLED';
          else if (st.includes('trả hàng') || st.includes('hoàn tiền')) status = 'REFUNDED';
          else if (st.includes('đang giao') || st.includes('vận chuyển')) status = 'SHIPPING';
          else if (st.includes('chờ thanh toán')) status = 'PENDING_PAYMENT';

          return {
            id: 'shopee_' + item.order_id,
            orderCode: String(item.order_id),
            shopName: info.shop_info?.username || 'Shopee Shop',
            status: status,
            statusText: statusText,
            orderTime: new Date((item.create_time || Date.now() / 1000) * 1000).toISOString(),
            cancelTime: item.cancel_time ? new Date(item.cancel_time * 1000).toISOString() : null,
            totalAmount: (info.subtotal_price || 0) / 100000,
            refundAmount: (info.subtotal_price || 0) / 100000,
            paymentMethod: info.payment_method_name || 'ShopeePay / Thẻ',
            cancelReason: item.cancel_reason || '',
            refundReason: item.return_refund_reason || '',
            shippingFee: (info.shipping_fee || 0) / 100000,
            voucherDiscount: (info.voucher_price || 0) / 100000,
            items: items
          };
        });
      } else {
        throw new Error('Định dạng dữ liệu không tương thích.');
      }

      if (ordersArray.length === 0) {
        setErrorMsg('Không tìm thấy đơn hàng nào trong file dữ liệu.');
        return;
      }

      const accId = isNewAccount ? `acc_${Date.now()}` : selectedAccountId;
      const accName = isNewAccount ? (newAccountName.trim() || 'Tài khoản Shopee mới') : undefined;

      importOrders(ordersArray, accId, accName);
      setIsSyncModalOpen(false);
      setJsonText('');
    } catch (err) {
      console.error(err);
      setErrorMsg('Dữ liệu JSON không hợp lệ hoặc bị lỗi cú pháp.');
    }
  };

  const handleExportAll = () => {
    const jsonStr = storageService.exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `shopee_orders_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    showNotification('Đã xuất file sao lưu dữ liệu thành công!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Đồng Bộ & Nhập Đơn Hàng</h3>
              <p className="text-xs text-slate-400">Nhập danh sách đơn hàng đã quét từ Shopee vào ứng dụng</p>
            </div>
          </div>

          <button
            onClick={() => setIsSyncModalOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          {/* Target Account Selection */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-orange-600" />
              Gán đơn hàng cho tài khoản người mua:
            </label>
            
            <div className="flex items-center gap-2">
              <select
                disabled={isNewAccount}
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                aria-label="Chọn tài khoản người mua nhận dữ liệu"
                className="flex-1 bg-white text-xs font-semibold p-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-slate-100"
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
                className="text-xs font-bold text-orange-600 bg-white px-3 py-2 border border-slate-300 rounded-xl hover:bg-orange-50"
              >
                {isNewAccount ? 'Chọn tài khoản cũ' : '+ Tạo tài khoản mới'}
              </button>
            </div>

            {isNewAccount && (
              <div className="pt-2">
                <input
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Nhập tên tài khoản người mua mới (ví dụ: Chị Lan, Anh Nam...)"
                  className="w-full text-xs p-2 bg-white border border-orange-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}
          </div>

          {/* File Upload Box */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Chọn file JSON (do Extension hoặc Console xuất ra):
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-orange-400 bg-slate-50/50 hover:bg-orange-50/30 rounded-2xl p-4 text-center cursor-pointer transition-all relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-7 h-7 text-slate-400 mx-auto mb-1" />
              <p className="text-xs font-semibold text-slate-700">Kéo thả file .json vào đây hoặc bấm để duyệt</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Hỗ trợ file JSON đơn hàng tự động từ Shopee</p>
            </div>
          </div>

          {/* Text Area for pasting */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Hoặc dán trực tiếp nội dung JSON:
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="[ { &quot;id&quot;: &quot;...&quot;, &quot;items&quot;: [ ... ] } ]"
              rows={4}
              className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Export button */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[11px] text-slate-400">Sao lưu dữ liệu phòng ngừa:</span>
            <button
              onClick={handleExportAll}
              className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              Xuất sao lưu toàn bộ
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={() => setIsSyncModalOpen(false)}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
          >
            Hủy
          </button>
          <button
            onClick={handleProcessImport}
            className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-500/30 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Bắt đầu Nhập Dữ Liệu
          </button>
        </div>

      </div>
    </div>
  );
};
