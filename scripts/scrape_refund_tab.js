/**
 * =========================================================================
 * 🎯 SHOPEE REFUND & RETURN EXTRACTOR V2 (CHỐNG TRÙNG ĐƠN 100%)
 * =========================================================================
 * Cách dùng:
 * 1. Mở Shopee trên máy tính -> Vào mục "Đơn Mua" -> Bấm qua tab "TRẢ HÀNG / HOÀN TIỀN" (hoặc "ĐÃ HỦY").
 * 2. Nhấn F12 -> Chọn tab Console.
 * 3. Dán toàn bộ mã bên dưới và nhấn Enter.
 */

(async function extractShopeeRefundsV2() {
  console.log("%c🚀 BẮT ĐẦU QUÉT TAB TRẢ HÀNG / HOÀN TIỀN (PHIÊN BẢN CHỐNG TRÙNG 100%)...", "color: #ee4d2d; font-size: 15px; font-weight: bold;");

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // 1. Tự động cuộn trang để tải hết tất cả đơn hàng
  console.log("📜 Đang cuộn trang...");
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

  // 2. TÌM CHÍNH XÁC CÁC CARD ĐƠN HÀNG DỰA TRÊN HEADER SHOP (Mỗi card chỉ lấy đúng 1 lần)
  const orderCards = [];
  const processedCardNodes = new Set();

  // Tìm tất cả các link hoặc nút 'Xem Shop' / 'Trao Đổi' (mỗi đơn hàng chỉ có 1 nút này)
  const shopHeaders = Array.from(document.querySelectorAll('a[href*="/shop/"], a[href*="/shop"], [class*="shop-header"], button:not([class*="st"])'));
  
  shopHeaders.forEach(el => {
    const text = el.innerText || '';
    if (text.includes('Xem Shop') || text.includes('Trao Đổi') || el.href?.includes('/shop/')) {
      // Tìm container lớn bao toàn bộ đơn hàng này
      let card = el.parentElement;
      for (let depth = 0; depth < 8; depth++) {
        if (!card || !card.parentElement) break;
        const cardText = card.innerText || '';
        if (
          (cardText.includes('Tổng tiền hoàn') || cardText.includes('Tổng số tiền') || cardText.includes('Thành tiền') || cardText.includes('₫')) &&
          card.offsetHeight > 100 &&
          card.offsetWidth > 350
        ) {
          // Đảm bảo không nhảy ra ngoài container lớn của toàn bộ trang
          if (card.offsetWidth < document.body.offsetWidth * 0.95) {
            if (!processedCardNodes.has(card)) {
              processedCardNodes.add(card);
              orderCards.push(card);
            }
            break;
          }
        }
        card = card.parentElement;
      }
    }
  });

  console.log(`🔎 Tìm thấy ${orderCards.length} đơn hàng thực tế trên màn hình!`);

  const extractedOrders = [];
  const seenKeys = new Set();

  orderCards.forEach((card, idx) => {
    try {
      const text = card.innerText || '';
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

      // 1. Tên Shop
      let shopName = 'Shopee Shop';
      for (const line of lines) {
        if (
          line.length > 1 && 
          line.length < 35 &&
          !line.includes('₫') && 
          !line.includes('HOÀN') && 
          !line.includes('TRẢ HÀNG') && 
          !line.includes('ĐÃ HỦY') && 
          !line.includes('Xem Shop') && 
          !line.includes('Trao Đổi') &&
          !line.includes('Tổng tiền')
        ) {
          shopName = line.replace(/Yêu thích\+?|Mall|Shopee/gi, '').trim() || 'Shopee Shop';
          break;
        }
      }

      // 2. Trạng thái
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

      // 3. Số tiền hoàn lại (Chỉ lấy số tiền > 1000đ)
      let amount = 0;
      const matchSpecial = text.match(/(?:Tổng tiền hoàn|Tổng số tiền|Thành tiền|Tiền hoàn)\s*[:：]?\s*₫?\s*([0-9.,]+)/i);
      if (matchSpecial) {
        amount = parseInt(matchSpecial[1].replace(/[^0-9]/g, ''), 10) || 0;
      }
      if (amount <= 1000) {
        const allPrices = text.match(/₫\s*([0-9.,]+)/g) || text.match(/([0-9.,]+)\s*₫/g) || [];
        const validPrices = allPrices.map(p => parseInt(p.replace(/[^0-9]/g, ''), 10)).filter(n => n > 1000);
        if (validPrices.length > 0) {
          amount = Math.max(...validPrices);
        }
      }

      // Bỏ qua đơn rác 0đ hoặc 1đ
      if (amount <= 1000) return;

      // 4. Tên sản phẩm (Bỏ qua các từ khóa 'Tổng tiền hoàn', 'Xem Shop')
      let productName = 'Sản phẩm Shopee';
      for (const line of lines) {
        if (
          line.length > 10 && 
          !line.includes('₫') && 
          !line.includes('Xem Shop') && 
          !line.includes('Trao Đổi') && 
          !line.includes('Chat') &&
          !line.includes('Mua Lại') &&
          !line.includes('HOÀN') &&
          !line.includes('TRẢ HÀNG') &&
          !line.includes('YÊU CẦU') &&
          !line.includes('Tổng tiền') &&
          !line.includes('Thành tiền') &&
          line !== shopName
        ) {
          productName = line;
          break;
        }
      }

      // 5. Số lượng
      const qtyMatch = text.match(/x\s*([0-9]+)/i);
      const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

      // 6. Mã đơn hàng duy nhất
      let orderCode = '';
      const links = card.querySelectorAll('a[href]');
      for (const link of links) {
        const href = link.href || '';
        const m = href.match(/order\/([0-9]+)/) || href.match(/order_id=([0-9]+)/) || href.match(/order_sn=([0-9]+)/);
        if (m) { orderCode = m[1]; break; }
      }

      // Key chống trùng: Shop + Số tiền (nếu không có order id)
      const dedupeKey = orderCode || `${shopName}_${amount}`;
      if (seenKeys.has(dedupeKey)) return;
      seenKeys.add(dedupeKey);

      if (!orderCode) {
        orderCode = 'SP' + Math.abs((shopName + amount + idx).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
      }

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

  console.log(`%c🎉 ĐÃ LỌC SẠCH & TRÍCH XUẤT ${extractedOrders.length} ĐƠN DUY NHẤT (0 ĐƠN TRÙNG)!`, "color: #059669; font-size: 15px; font-weight: bold;");

  if (extractedOrders.length === 0) {
    alert("⚠️ Chưa nhận diện được đơn. Hãy chắc chắn bạn đang ở tab Trả hàng / Hoàn tiền của Shopee.");
    return;
  }

  const blob = new Blob([JSON.stringify(extractedOrders, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `shopee_tra_hang_chuan_${extractedOrders.length}_don.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  alert(`🎉 XONG! Đã trích xuất ${extractedOrders.length} đơn hàng chuẩn xác (không bị trùng đơn). Hãy nạp file JSON này vào sổ!`);
})();
