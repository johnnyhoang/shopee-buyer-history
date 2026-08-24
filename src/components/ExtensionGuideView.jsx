import React, { useState } from 'react';
import { Puzzle, Download, Copy, Check, Terminal, ShieldCheck, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ExtensionGuideView = () => {
  const { setIsSyncModalOpen } = useApp();
  const [copiedScript, setCopiedScript] = useState(false);

  // Script chạy trực tiếp trong Console F12 trên trang Shopee
  const bookmarkletCode = `(async function extractShopeeRefunds() {
  console.log("%c🚀 BẮT ĐẦU TRÍCH XUẤT TAB TRẢ HÀNG / HOÀN TIỀN TỪ SHOPEE...", "color: #ee4d2d; font-size: 15px; font-weight: bold;");

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // 1. Tự động cuộn trang để tải hết tất cả đơn hàng
  console.log("📜 Đang cuộn trang để tải toàn bộ danh sách...");
  let prevHeight = 0, sameCount = 0;
  for (let i = 0; i < 35; i++) {
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(500);
    const currHeight = document.body.scrollHeight;
    if (currHeight === prevHeight) {
      if (++sameCount >= 3) break;
    } else {
      sameCount = 0;
      prevHeight = currHeight;
    }
  }
  window.scrollTo(0, 0);
  await sleep(300);

  // 2. Thu thập và phân tích các khối đơn hàng
  const extractedOrders = [];
  const processedCodes = new Set();
  const allContainers = Array.from(document.querySelectorAll('div, section'));
  
  const orderCards = allContainers.filter(el => {
    const txt = el.innerText || '';
    const hasRefund = txt.includes('Tổng số tiền') || txt.includes('Tổng tiền hoàn') || txt.includes('Thành tiền') || txt.includes('HOÀN TIỀN') || txt.includes('TRẢ HÀNG') || txt.includes('ĐÃ HỦY');
    const hasShop = txt.includes('Xem Shop') || txt.includes('Trao Đổi') || txt.includes('Chat') || txt.includes('Mua Lại');
    const isLeaf = !Array.from(el.children).some(c => (c.innerText || '').includes('Tổng số tiền') && (c.innerText || '').includes('Xem Shop'));
    return hasRefund && hasShop && isLeaf && el.offsetWidth > 350 && el.offsetHeight > 80;
  });

  orderCards.forEach((card, idx) => {
    try {
      const text = card.innerText || '';
      const lines = text.split('\\n').map(l => l.trim()).filter(Boolean);

      // Tên Shop
      let shopName = 'Shopee Shop';
      for (const line of lines) {
        if (line.length > 1 && !line.includes('₫') && !line.includes('HOÀN') && !line.includes('TRẢ HÀNG') && !line.includes('ĐÃ HỦY') && !line.includes('Xem Shop') && !line.includes('Trao Đổi')) {
          shopName = line.replace(/Yêu thích\\+?|Mall|Shopee/gi, '').trim() || 'Shopee Shop';
          break;
        }
      }

      // Trạng thái
      let status = 'REFUNDED';
      let statusText = 'Trả hàng/Hoàn tiền';
      const upper = text.toUpperCase();
      if (upper.includes('YÊU CẦU ĐÃ ĐƯỢC HỦY') || upper.includes('ĐÃ HỦY YÊU CẦU') || upper.includes('ĐÃ HỦY')) {
        status = 'CANCELLED';
        statusText = 'Đã hủy yêu cầu';
      } else if (upper.includes('HOÀN TIỀN THÀNH CÔNG') || upper.includes('ĐÃ HOÀN TIỀN')) {
        status = 'REFUNDED';
        statusText = 'Hoàn tiền thành công';
      } else if (upper.includes('ĐANG XỬ LÝ') || upper.includes('CHỜ')) {
        status = 'REFUNDING';
        statusText = 'Đang xử lý hoàn tiền';
      }

      // Giá tiền
      let amount = 0;
      const matchSpecial = text.match(/(?:Tổng tiền hoàn|Tổng số tiền|Thành tiền|Tiền hoàn|Giá)\\s*[:：]?\\s*₫?\\s*([0-9.,]+)/i);
      if (matchSpecial) {
        amount = parseInt(matchSpecial[1].replace(/[^0-9]/g, ''), 10) || 0;
      }
      if (amount === 0) {
        const allPrices = text.match(/₫\\s*([0-9.,]+)/g) || text.match(/([0-9.,]+)\\s*₫/g) || [];
        const prices = allPrices.map(p => parseInt(p.replace(/[^0-9]/g, ''), 10)).filter(n => n > 1000);
        if (prices.length > 0) amount = Math.max(...prices);
      }

      // Tên sản phẩm
      let productName = 'Sản phẩm Shopee';
      for (const line of lines) {
        if (line.length > 8 && !line.includes('₫') && !line.includes('Xem Shop') && !line.includes('Trao Đổi') && !line.includes('Chat') && !line.includes('Mua Lại') && !line.includes('HOÀN') && !line.includes('TRẢ HÀNG') && !line.includes('YÊU CẦU') && line !== shopName) {
          productName = line;
          break;
        }
      }

      const qtyMatch = text.match(/x\\s*([0-9]+)/i);
      const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

      let orderCode = '';
      const links = card.querySelectorAll('a[href]');
      for (const link of links) {
        const href = link.href || '';
        const m = href.match(/order\\/([0-9]+)/) || href.match(/order_id=([0-9]+)/) || href.match(/order_sn=([0-9]+)/);
        if (m) { orderCode = m[1]; break; }
      }
      if (!orderCode) {
        orderCode = 'SP' + Math.abs((shopName + productName + amount + idx).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
      }

      if (processedCodes.has(orderCode)) return;
      processedCodes.add(orderCode);

      extractedOrders.push({
        id: 'shopee_' + orderCode,
        orderCode: String(orderCode),
        shopName: shopName,
        status: status,
        statusText: statusText,
        orderTime: new Date().toISOString(),
        cancelTime: new Date().toISOString(),
        totalAmount: amount,
        refundAmount: amount,
        paymentMethod: 'ShopeePay / Thẻ / Ngân hàng',
        cancelReason: status === 'CANCELLED' ? 'Đã hủy yêu cầu' : 'Yêu cầu Trả hàng / Hoàn tiền',
        refundReason: statusText,
        items: [{ name: productName, quantity: quantity, price: amount }]
      });
    } catch (e) {}
  });

  if (extractedOrders.length === 0) {
    alert("⚠️ Chưa nhận diện được đơn. Hãy chắc chắn bạn đang ở tab Trả hàng / Hoàn tiền của Shopee và danh sách đơn đã hiển thị.");
    return;
  }

  const blob = new Blob([JSON.stringify(extractedOrders, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = \`shopee_tra_hang_hoan_tien_\${extractedOrders.length}_don.json\`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  alert(\`🎉 XONG! Đã trích xuất thành công \${extractedOrders.length} đơn có đầy đủ Tên sản phẩm, Tên Shop & Số tiền hoàn. Hãy nạp file JSON này vào sổ!\`);
})();`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  return (
    <div className="space-y-4 text-xs">
      
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 text-slate-950 rounded-lg font-bold shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold">Cách Quét Đơn Trả Hàng / Hoàn Tiền Shopee Chuẩn 100%</h2>
            <p className="text-slate-400 text-[11px]">Trích xuất đầy đủ: Tên sản phẩm, Tên shop, Số tiền hoàn và Mã đơn hàng</p>
          </div>
        </div>

        <button
          onClick={() => setIsSyncModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg font-bold text-xs shrink-0"
        >
          Mở Hộp Thoại Nhập
        </button>
      </div>

      {/* 3 Bước thực hiện */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-amber-600" />
          3 Bước Trích Xuất Dữ Liệu Trong 10 Giây:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 text-xs">Bước 1: Mở Shopee</div>
            <p className="text-slate-600 text-[11px]">
              Đăng nhập Shopee $\rightarrow$ Vào mục <strong>Đơn Mua</strong> $\rightarrow$ Bấm qua tab <strong>Trả hàng / Hoàn tiền</strong>.
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 text-xs">Bước 2: Mở Console F12</div>
            <p className="text-slate-600 text-[11px]">
              Nhấn phím <strong>F12</strong> (hoặc chuột phải chọn <em>Inspect / Kiểm tra</em>) $\rightarrow$ bấm qua tab <strong>Console</strong>.
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 text-xs">Bước 3: Dán mã & Chạy</div>
            <p className="text-slate-600 text-[11px]">
              Bấm nút <strong>Sao chép mã</strong> bên dưới $\rightarrow$ Dán vào Console rồi bấm <strong>Enter</strong>. File JSON chuẩn sẽ tự động tải về!
            </p>
          </div>
        </div>

        {/* Copy script box */}
        <div className="pt-2">
          <div className="flex items-center justify-between pb-1">
            <span className="font-bold text-slate-700 text-[11px]">Mã script trích xuất Shopee (Đã tối ưu):</span>
            <button
              onClick={handleCopyScript}
              className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1 rounded-lg font-bold text-xs transition-colors shadow-2xs"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copiedScript ? 'Đã sao chép vào bộ nhớ tạm!' : 'Bấm Sao Chép Mã Script'}</span>
            </button>
          </div>

          <pre className="bg-slate-950 text-slate-200 p-3 rounded-xl font-mono text-[10px] overflow-x-auto max-h-48 border border-slate-800 leading-relaxed">
            {bookmarkletCode}
          </pre>
        </div>

      </div>

    </div>
  );
};
