import React, { useState } from 'react';
import { Puzzle, Download, Copy, Check, Terminal, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ExtensionGuideView = () => {
  const { setIsSyncModalOpen } = useApp();
  const [copiedScript, setCopiedScript] = useState(false);

  // Script chạy trực tiếp trong DevTools Console trên trang Shopee nếu user không muốn cài Extension
  const bookmarkletCode = `(async function crawlShopeeOrders() {
  console.log("🚀 Bắt đầu quét đơn hàng Shopee...");
  const orders = [];
  let offset = 0;
  const limit = 20;
  let hasMore = true;

  while (hasMore) {
    try {
      const res = await fetch(\`/api/v4/order/get_all_order_and_item_list?limit=\${limit}&offset=\${offset}\`);
      const data = await res.json();
      const list = data?.data?.order_data?.details_list || [];
      if (!list.length) {
        hasMore = false;
        break;
      }

      list.forEach(item => {
        const info = item.info_card || {};
        const items = (item.item_list || []).map(p => ({
          name: p.item_info?.item_name || 'Sản phẩm Shopee',
          imageUrl: p.item_info?.item_image ? \`https://down-vn.img.susercontent.com/file/\${p.item_info.item_image}\` : '',
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

        orders.push({
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
        });
      });

      offset += limit;
      console.log(\`📦 Đã tải \${orders.length} đơn hàng...\`);
      if (list.length < limit) hasMore = false;
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.error("Lỗi khi tải đơn:", err);
      hasMore = false;
    }
  }

  // Tự động tải file JSON về máy
  const blob = new Blob([JSON.stringify(orders, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = \`shopee_orders_\${Date.now()}.json\`;
  document.body.appendChild(a);
  a.click();
  alert(\`🎉 Đã xuất thành công \${orders.length} đơn hàng! Hãy kéo thả file này vào ứng dụng.\`);
})();`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-6 rounded-2xl text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
            <Puzzle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Hướng Dẫn Lấy Đơn Hàng Tự Động Từ Shopee</h2>
            <p className="text-orange-100 text-xs mt-1">
              An toàn 100% - Không lo lộ mật khẩu hay bị chặn OTP/Captcha.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Cách 1: Tiện ích mở rộng Chrome Extension */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Cách 1 (Khuyên dùng)</span>
              <span className="bg-orange-100 text-orange-700 text-[11px] font-bold px-2 py-0.5 rounded-full">Tiện ích 1-Click</span>
            </div>
            
            <h3 className="text-base font-bold text-slate-800 mt-2">
              Cài đặt Chrome Extension "Shopee History Sync"
            </h3>
            
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Mã nguồn Extension đã được tạo sẵn trong thư mục <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">extension/</code> của dự án.
            </p>

            <ol className="mt-4 space-y-3 text-xs text-slate-700 list-decimal list-inside">
              <li>Mở Chrome / Edge / Cốc Cốc, truy cập <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">chrome://extensions</code></li>
              <li>Bật công tắc <strong>Developer mode (Chế độ dành cho nhà phát triển)</strong> ở góc phải trên.</li>
              <li>Bấm <strong>Load unpacked (Tải tiện ích đã giải nén)</strong> và chọn thư mục <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">extension</code> trong ứng dụng này.</li>
              <li>Mở Shopee và đăng nhập tài khoản của bạn hoặc người thân, click biểu tượng Extension và bấm <strong>"Bắt đầu quét & Đồng bộ"</strong>.</li>
            </ol>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              Mở Trình Đồng Bộ & Nhập Dữ Liệu
            </button>
          </div>
        </div>

        {/* Cách 2: Chạy Script nhanh trên F12 Console (Không cần cài đặt gì) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Cách 2 (Nhanh nhất)</span>
              <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full">Chạy trực tiếp DevTools</span>
            </div>
            
            <h3 className="text-base font-bold text-slate-800 mt-2">
              Dán Script quét đơn vào Console trình duyệt
            </h3>
            
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Nếu bạn không muốn cài extension, chỉ cần mở trang Shopee đã đăng nhập và dán đoạn mã bên dưới.
            </p>

            <ol className="mt-4 space-y-2 text-xs text-slate-700 list-decimal list-inside">
              <li>Đăng nhập <a href="https://shopee.vn" target="_blank" rel="noreferrer" className="text-orange-600 underline font-medium">shopee.vn</a> trên trình duyệt.</li>
              <li>Nhấn phím <strong>F12</strong> (hoặc chuột phải chọn <em>Kiểm tra / Inspect</em>) và chuyển qua tab <strong>Console</strong>.</li>
              <li>Copy đoạn script bên dưới, dán vào Console rồi bấm <strong>Enter</strong>.</li>
              <li>Trình duyệt sẽ tự động quét toàn bộ đơn và tải về file <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.json</code> để bạn nhập vào app.</li>
            </ol>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={handleCopyScript}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {copiedScript ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Đã sao chép Script vào Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Sao chép Script quét đơn Shopee</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Security note */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-emerald-900">Bảo mật & Quyền riêng tư</h4>
          <p className="text-xs text-emerald-800/90 mt-1 leading-relaxed">
            Toàn bộ quá trình quét đơn diễn ra trực tiếp ngay trên máy tính của bạn thông qua trình duyệt cá nhân. 
            Mật khẩu, mã OTP và thông tin thanh toán tuyệt đối không bao giờ bị gửi ra ngoài máy tính. Dữ liệu được lưu trữ an toàn trong trình duyệt của bạn.
          </p>
        </div>
      </div>

    </div>
  );
};
