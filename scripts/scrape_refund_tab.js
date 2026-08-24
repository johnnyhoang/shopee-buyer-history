(async function scrapeAllShopeeRefundsDOM() {
  console.log("%c🚀 BẮT ĐẦU QUÉT TẤT CẢ ĐƠN TRẢ HÀNG / HOÀN TIỀN TỪ GIAO DIỆN...", "color: #ee4d2d; font-size: 14px; font-weight: bold;");

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const orders = [];
  const processedCodes = new Set();

  // 1. Tự động cuộn trang từ từ xuống cuối để kích hoạt lazy load tất cả các đơn
  console.log("📜 Đang tự động cuộn trang để tải toàn bộ gần 100 đơn hàng...");
  let lastScrollHeight = 0;
  let noChangeCount = 0;

  for (let i = 0; i < 40; i++) {
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(600);
    const currentHeight = document.body.scrollHeight;
    if (currentHeight === lastScrollHeight) {
      noChangeCount++;
      if (noChangeCount >= 3) break; // Đã cuộn hết trang
    } else {
      noChangeCount = 0;
      lastScrollHeight = currentHeight;
    }
  }

  window.scrollTo(0, 0);
  await sleep(400);

  // 2. Thu thập tất cả các khối đơn hàng trên trang
  // Mỗi đơn hàng trên Shopee là một card lớn
  const allDivs = document.querySelectorAll('div');
  const cardCandidates = [];

  allDivs.forEach(div => {
    // Nhận diện khối đơn hàng: Chứa tên shop và chữ "Tổng tiền hoàn" hoặc "TRẢ HÀNG" hoặc giá tiền ₫
    const text = div.innerText || '';
    if (
      (text.includes('Tổng tiền hoàn') || text.includes('TRẢ HÀNG/HOÀN TIỀN') || text.includes('YÊU CẦU ĐÃ ĐƯỢC HỦY') || text.includes('HOÀN THÀNH') || text.includes('ĐÃ HỦY')) &&
      (text.includes('Trao Đổi Thêm') || text.includes('Xem Shop') || div.querySelector('button, a')) &&
      div.offsetWidth > 400 &&
      div.offsetHeight > 100
    ) {
      // Đảm bảo không lấy div cha bao ngoài mà chỉ lấy đúng card đơn hàng
      const isParent = Array.from(div.children).some(child => 
        (child.innerText || '').includes('Tổng tiền hoàn') && (child.innerText || '').includes('Xem Shop') && child.offsetHeight > 100
      );
      if (!isParent) {
        cardCandidates.push(div);
      }
    }
  });

  console.log(`🔎 Tìm thấy ${cardCandidates.length} đơn hàng trên trang! Đang phân tích chi tiết...`);

  cardCandidates.forEach((card, index) => {
    try {
      const text = card.innerText || '';
      
      // Tên Shop
      const shopBtn = card.querySelector('a[href*="/shop/"]') || card.querySelector('button') || card.querySelector('span');
      let shopName = 'Shopee Shop';
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        shopName = lines[0].replace(/Trao Đổi Thêm|Xem Shop|Yêu Thích\+/gi, '').trim() || 'Shopee Shop';
      }

      // Trạng thái đơn
      let status = 'REFUNDED';
      let statusText = 'Trả hàng / Hoàn tiền';
      if (text.includes('YÊU CẦU ĐÃ ĐƯỢC HỦY') || text.includes('ĐÃ HỦY') || text.includes('Đã hủy yêu cầu')) {
        status = 'CANCELLED';
        statusText = 'Yêu cầu đã hủy';
      } else if (text.includes('HOÀN TIỀN THÀNH CÔNG') || text.includes('Hoàn tiền thành công')) {
        status = 'REFUNDED';
        statusText = 'Hoàn tiền thành công';
      } else if (text.includes('HOÀN THÀNH')) {
        status = 'COMPLETED';
        statusText = 'Hoàn thành';
      }

      // Tiền hoàn lại
      let refundAmount = 0;
      const refundMatch = text.match(/Tổng tiền hoàn\s*([0-9.,]+)₫/i) || 
                          text.match(/Tổng tiền hoàn\s*₫([0-9.,]+)/i) || 
                          text.match(/Tổng số tiền\s*[:：]?\s*₫?([0-9.,]+)/i);
      
      if (refundMatch) {
        const rawNum = refundMatch[1].replace(/[^0-9]/g, '');
        refundAmount = parseInt(rawNum, 10) || 0;
      }

      // Nếu không tìm thấy chữ "Tổng tiền hoàn", lấy giá tiền lớn nhất/cuối cùng trong card
      if (refundAmount === 0) {
        const allPrices = text.match(/([0-9.,]+)₫/g) || text.match(/₫([0-9.,]+)/g) || [];
        if (allPrices.length > 0) {
          const lastP = allPrices[allPrices.length - 1].replace(/[^0-9]/g, '');
          refundAmount = parseInt(lastP, 10) || 0;
        }
      }

      // Tên sản phẩm
      let productName = 'Sản phẩm Shopee';
      // Tìm dòng tên sản phẩm (thường nằm sau tên shop và trước giá tiền)
      for (let j = 1; j < Math.min(lines.length, 6); j++) {
        const line = lines[j];
        if (
          line.length > 10 && 
          !line.includes('₫') && 
          !line.includes('Trao Đổi') && 
          !line.includes('Xem Shop') && 
          !line.includes('YÊU CẦU') &&
          !line.includes('TRẢ HÀNG') &&
          !line.includes('Đã hủy')
        ) {
          productName = line;
          break;
        }
      }

      // Số lượng
      const qtyMatch = text.match(/x\s*([0-9]+)/i);
      const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

      // Mã đơn hàng (tìm link hoặc hash chuỗi)
      let orderCode = '';
      const link = card.querySelector('a[href*="order"]');
      if (link && link.href) {
        const m = link.href.match(/order\/([0-9]+)/) || link.href.match(/order_id=([0-9]+)/);
        if (m) orderCode = m[1];
      }
      if (!orderCode) {
        orderCode = 'REF_' + Math.abs((productName + shopName + index).split('').reduce((a,b)=>((a<<5)-a)+b.charCodeAt(0),0));
      }

      if (processedCodes.has(orderCode)) return;
      processedCodes.add(orderCode);

      orders.push({
        id: 'shopee_' + orderCode,
        orderCode: orderCode,
        shopName: shopName,
        status: status,
        statusText: statusText,
        orderTime: new Date().toISOString(),
        cancelTime: new Date().toISOString(),
        totalAmount: refundAmount,
        refundAmount: refundAmount,
        paymentMethod: 'ShopeePay / Thẻ / Ngân hàng',
        cancelReason: text.includes('Đã hủy yêu cầu') ? 'Đã hủy yêu cầu' : 'Yêu cầu Trả hàng / Hoàn tiền',
        refundReason: statusText,
        items: [
          {
            name: productName,
            quantity: quantity,
            price: refundAmount
          }
        ]
      });

    } catch (err) {
      console.warn("Lỗi phân tích card:", err);
    }
  });

  console.log(`%c🎉 ĐÃ TRÍCH XUẤT THÀNH CÔNG ${orders.length} ĐƠN HÀNG!`, "color: #059669; font-size: 14px; font-weight: bold;");

  if (orders.length === 0) {
    alert("⚠️ Chưa nhận diện được đơn hàng. Vui lòng đảm bảo các đơn hàng đã hiển thị trên màn hình.");
    return;
  }

  // Tự động tải file JSON
  const blob = new Blob([JSON.stringify(orders, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `shopee_orders_${orders.length}_don_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  alert(`🎉 XONG! Đã trích xuất toàn bộ ${orders.length} đơn hàng vào file JSON vừa tải về.`);
})();
