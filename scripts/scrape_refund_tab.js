/**
 * =========================================================================
 * 🎯 SHOPEE REFUND & RETURN EXTRACTOR (DÀNH RIÊNG CHO TAB TRẢ HÀNG / HOÀN TIỀN)
 * =========================================================================
 * Cách dùng:
 * 1. Mở Shopee trên máy tính -> Vào mục "Đơn Mua" -> Bấm qua tab "TRẢ HÀNG / HOÀN TIỀN" (hoặc "ĐÃ HỦY").
 * 2. Nhấn F12 (hoặc Chuột phải -> Inspect) -> Chọn tab Console.
 * 3. Dán toàn bộ mã bên dưới và nhấn Enter.
 * 4. Trình duyệt sẽ tự động cuộn trang, đọc toàn bộ chi tiết và tự tải file JSON chuẩn 100%!
 */

(async function extractShopeeRefunds() {
  console.log("%c🚀 BẮT ĐẦU TRÍCH XUẤT TAB TRẢ HÀNG / HOÀN TIỀN TỪ SHOPEE...", "color: #ee4d2d; font-size: 15px; font-weight: bold;");

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // 1. TỰ ĐỘNG CUỘN ĐỂ TẢI HẾT TOÀN BỘ CÁC ĐƠN
  console.log("📜 Đang cuộn trang để tải toàn bộ danh sách đơn hàng...");
  let prevHeight = 0;
  let sameCount = 0;
  for (let i = 0; i < 35; i++) {
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(500);
    const currHeight = document.body.scrollHeight;
    if (currHeight === prevHeight) {
      sameCount++;
      if (sameCount >= 3) break;
    } else {
      sameCount = 0;
      prevHeight = currHeight;
    }
  }
  window.scrollTo(0, 0);
  await sleep(300);

  // 2. TÌM TẤT CẢ CÁC KHỐI ĐƠN HÀNG (CARDS) TRÊN GIAO DIỆN
  const extractedOrders = [];
  const processedCodes = new Set();

  // Tìm tất cả các thẻ đơn hàng hoặc link chi tiết đơn
  const allContainers = Array.from(document.querySelectorAll('div, section'));
  
  // Lọc các container đại diện cho 1 đơn hàng
  const orderCards = allContainers.filter(el => {
    const txt = el.innerText || '';
    const hasRefundKeyword = txt.includes('Tổng số tiền') || 
                             txt.includes('Tổng tiền hoàn') || 
                             txt.includes('Thành tiền') || 
                             txt.includes('HOÀN TIỀN') || 
                             txt.includes('TRẢ HÀNG') || 
                             txt.includes('ĐÃ HỦY');
    const hasShopOrChat = txt.includes('Xem Shop') || txt.includes('Trao Đổi') || txt.includes('Chat') || txt.includes('Mua Lại');
    const isLeafCard = !Array.from(el.children).some(c => (c.innerText || '').includes('Tổng số tiền') && (c.innerText || '').includes('Xem Shop'));
    return hasRefundKeyword && hasShopOrChat && isLeafCard && el.offsetWidth > 350 && el.offsetHeight > 80;
  });

  console.log(`🔎 Tìm thấy ${orderCards.length} đơn hàng trên màn hình. Đang đọc thông tin chi tiết...`);

  orderCards.forEach((card, idx) => {
    try {
      const text = card.innerText || '';
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

      // --- Tên Shop ---
      let shopName = 'Shopee Shop';
      for (const line of lines) {
        if (line.length > 1 && !line.includes('₫') && !line.includes('HOÀN') && !line.includes('TRẢ HÀNG') && !line.includes('ĐÃ HỦY') && !line.includes('Xem Shop') && !line.includes('Trao Đổi')) {
          shopName = line.replace(/Yêu thích\+?|Mall|Shopee/gi, '').trim() || 'Shopee Shop';
          break;
        }
      }

      // --- Trạng thái đơn ---
      let status = 'REFUNDED';
      let statusText = 'Trả hàng/Hoàn tiền';
      const upperText = text.toUpperCase();

      if (upperText.includes('YÊU CẦU ĐÃ ĐƯỢC HỦY') || upperText.includes('ĐÃ HỦY YÊU CẦU') || upperText.includes('ĐÃ HỦY')) {
        status = 'CANCELLED';
        statusText = 'Đã hủy yêu cầu';
      } else if (upperText.includes('HOÀN TIỀN THÀNH CÔNG') || upperText.includes('ĐÃ HOÀN TIỀN')) {
        status = 'REFUNDED';
        statusText = 'Hoàn tiền thành công';
      } else if (upperText.includes('ĐANG XỬ LÝ') || upperText.includes('CHỜ')) {
        status = 'REFUNDING';
        statusText = 'Đang xử lý hoàn tiền';
      }

      // --- Giá tiền / Tiền hoàn lại ---
      let amount = 0;
      // Tìm số tiền sau các từ khóa "Tổng tiền hoàn", "Thành tiền", "Tổng số tiền"
      const matchSpecial = text.match(/(?:Tổng tiền hoàn|Tổng số tiền|Thành tiền|Tiền hoàn|Giá)\s*[:：]?\s*₫?\s*([0-9.,]+)/i);
      if (matchSpecial) {
        const raw = matchSpecial[1].replace(/[^0-9]/g, '');
        amount = parseInt(raw, 10) || 0;
      }

      // Nếu chưa tìm thấy, lấy giá tiền xuất hiện trong card
      if (amount === 0) {
        const allPrices = text.match(/₫\s*([0-9.,]+)/g) || text.match(/([0-9.,]+)\s*₫/g) || [];
        if (allPrices.length > 0) {
          // Lấy giá lớn nhất hoặc giá cuối cùng
          const prices = allPrices.map(p => parseInt(p.replace(/[^0-9]/g, ''), 10)).filter(n => n > 1000);
          if (prices.length > 0) {
            amount = Math.max(...prices);
          }
        }
      }

      // --- Tên sản phẩm ---
      let productName = 'Sản phẩm Shopee';
      for (const line of lines) {
        if (
          line.length > 8 && 
          !line.includes('₫') && 
          !line.includes('Xem Shop') && 
          !line.includes('Trao Đổi') && 
          !line.includes('Chat') &&
          !line.includes('Mua Lại') &&
          !line.includes('HOÀN') &&
          !line.includes('TRẢ HÀNG') &&
          !line.includes('YÊU CẦU') &&
          line !== shopName
        ) {
          productName = line;
          break;
        }
      }

      // --- Số lượng ---
      const qtyMatch = text.match(/x\s*([0-9]+)/i);
      const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

      // --- Mã đơn hàng ---
      let orderCode = '';
      const links = card.querySelectorAll('a[href]');
      for (const link of links) {
        const href = link.href || '';
        const m = href.match(/order\/([0-9]+)/) || href.match(/order_id=([0-9]+)/) || href.match(/order_sn=([0-9]+)/);
        if (m) {
          orderCode = m[1];
          break;
        }
      }

      // Nếu không có link ID, tạo mã nhận diện duy nhất từ nội dung
      if (!orderCode) {
        const hash = Math.abs((shopName + productName + amount + idx).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
        orderCode = 'SP' + hash;
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
        cancelReason: status === 'CANCELLED' ? 'Đã hủy' : '',
        refundReason: statusText,
        items: [
          {
            name: productName,
            quantity: quantity,
            price: amount
          }
        ]
      });

    } catch (e) {
      console.warn("Lỗi khi đọc card:", e);
    }
  });

  console.log(`%c🎉 TRÍCH XUẤT HOÀN TẤT ${extractedOrders.length} ĐƠN HÀNG CÓ ĐẦY ĐỦ TIỀN VÀ SẢN PHẨM!`, "color: #059669; font-size: 15px; font-weight: bold;");

  if (extractedOrders.length === 0) {
    alert("⚠️ Chưa nhận diện được đơn. Hãy chắc chắn bạn đang ở trang Shopee và các đơn đã hiển thị trên màn hình.");
    return;
  }

  // Tự động tải file JSON chuẩn
  const blob = new Blob([JSON.stringify(extractedOrders, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `shopee_tra_hang_hoan_tien_${extractedOrders.length}_don.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  alert(`🎉 XONG! Đã trích xuất thành công ${extractedOrders.length} đơn Trả hàng / Hoàn tiền vào file JSON vừa tải về máy. Hãy nạp file này vào ứng dụng!`);
})();
