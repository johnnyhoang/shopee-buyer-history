(async function captureShopeeOrdersDOM() {
  console.log("%c🚀 Bắt đầu trích xuất đơn hàng trực tiếp từ trang Shopee...", "color: #ee4d2d; font-size: 14px; font-weight: bold;");

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const orders = [];
  const processedOrderCodes = new Set();

  // Hàm quét các thẻ đơn hàng đang hiển thị trên DOM
  function parseCurrentPageOrders() {
    // Các selector phổ biến trên Shopee Web
    const orderElements = document.querySelectorAll('.order-card, [class*="order-list-card"], [class*="purchase-card"], [class*="order-item"]');
    
    // Nếu không tìm thấy class đặc trưng, tìm các khối đơn hàng bao bọc
    let cards = orderElements;
    if (cards.length === 0) {
      // Tìm các khối chứa nút hoặc link đơn hàng
      const orderLinks = document.querySelectorAll('a[href*="/user/purchase/order/"]');
      const cardSet = new Set();
      orderLinks.forEach(link => {
        let parent = link.closest('div[class*="container"]') || link.parentElement?.parentElement?.parentElement;
        if (parent) cardSet.add(parent);
      });
      cards = Array.from(cardSet);
    }

    console.log(`🔎 Tìm thấy ${cards.length} khối đơn hàng trên màn hình...`);

    // Quét chi tiết từng đơn
    document.querySelectorAll('div').forEach(el => {
      // Tìm các khối có chứa trạng thái đơn hàng (HOÀN THÀNH, ĐÃ HỦY, TRẢ HÀNG, v.v.)
      const text = el.innerText || '';
      if (
        (text.includes('ĐÃ HỦY') || text.includes('TRẢ HÀNG') || text.includes('HOÀN TIỀN') || text.includes('HOÀN THÀNH') || text.includes('ĐANG GIAO')) &&
        (text.includes('₫') || text.includes('đ')) &&
        el.querySelector('a[href*="/user/purchase/order/"]')
      ) {
        const orderLink = el.querySelector('a[href*="/user/purchase/order/"]');
        const matchCode = orderLink?.href?.match(/order\/([0-9]+)/);
        const orderCode = matchCode ? matchCode[1] : ('ORD_' + Math.random().toString(36).substr(2, 8));

        if (processedOrderCodes.has(orderCode)) return;
        processedOrderCodes.add(orderCode);

        // Tên shop
        const shopEl = el.querySelector('a[href*="/shop/"]') || el.querySelector('[class*="shop-name"]');
        const shopName = shopEl ? shopEl.innerText.trim() : 'Shop Shopee';

        // Trạng thái
        let status = 'COMPLETED';
        let statusText = 'Hoàn thành';
        if (text.includes('ĐÃ HỦY') || text.includes('Đã hủy')) {
          status = 'CANCELLED';
          statusText = 'Đã hủy';
        } else if (text.includes('TRẢ HÀNG') || text.includes('Trả hàng') || text.includes('Hoàn tiền')) {
          status = 'REFUNDED';
          statusText = 'Trả hàng / Hoàn tiền';
        } else if (text.includes('ĐANG GIAO') || text.includes('Đang giao')) {
          status = 'SHIPPING';
          statusText = 'Đang giao';
        }

        // Giá tiền
        const priceMatches = text.match(/₫([0-9.,]+)/g) || text.match(/([0-9.,]+)₫/g) || [];
        let totalAmount = 0;
        if (priceMatches.length > 0) {
          const lastPrice = priceMatches[priceMatches.length - 1].replace(/[^0-9]/g, '');
          totalAmount = parseInt(lastPrice, 10) || 0;
        }

        // Tên sản phẩm
        const itemNames = [];
        el.querySelectorAll('img').forEach(img => {
          const alt = img.alt || img.getAttribute('title');
          if (alt && alt.length > 5) itemNames.push(alt);
        });

        orders.push({
          id: 'shopee_' + orderCode,
          orderCode: orderCode,
          shopName: shopName,
          status: status,
          statusText: statusText,
          orderTime: new Date().toISOString(),
          totalAmount: totalAmount,
          refundAmount: totalAmount,
          paymentMethod: 'ShopeePay / Thẻ',
          userNote: '',
          items: itemNames.length > 0 
            ? itemNames.map(n => ({ name: n, quantity: 1, price: totalAmount }))
            : [{ name: 'Đơn hàng Shopee #' + orderCode, quantity: 1, price: totalAmount }]
        });
      }
    });

    return orders.length;
  }

  // Tự động cuộn trang xuống 3 lần để tải thêm đơn
  console.log("📜 Đang tự động cuộn trang để tải thêm các đơn bên dưới...");
  for (let i = 0; i < 4; i++) {
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(800);
    parseCurrentPageOrders();
  }

  console.log(`🎉 Đã trích xuất được: ${orders.length} đơn hàng!`);

  if (orders.length === 0) {
    alert("⚠️ Chưa nhận diện được đơn nào trên giao diện. Vui lòng cuộn xuống vài đơn hàng rồi chạy lại script.");
    return;
  }

  // Tải file JSON về máy
  const blob = new Blob([JSON.stringify(orders, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `shopee_orders_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  alert(`🎉 Thành công! Đã trích xuất ${orders.length} đơn hàng. File shopee_orders.json đã tự động tải về.`);
})();
