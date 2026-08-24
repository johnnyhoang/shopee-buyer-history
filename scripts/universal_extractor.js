(function universalShopeeExtractor() {
  console.log("%c🚀 ĐANG QUÉT TOÀN DIỆN ĐƠN HÀNG SHOPEE...", "color: #ee4d2d; font-size: 14px; font-weight: bold;");

  const capturedOrders = new Map();

  // 1. CHIẾN LƯỢC 1: Đọc trực tiếp từ React State / React Fiber trên DOM
  function extractFromReactFiber() {
    try {
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
        if (fiberKey) {
          let fiber = el[fiberKey];
          let depth = 0;
          while (fiber && depth < 20) {
            // Tìm trong memoizedProps, stateNode, memoizedState
            const checkData = (obj) => {
              if (!obj || typeof obj !== 'object') return;
              if (Array.isArray(obj)) {
                obj.forEach(checkItem);
              } else if (obj.details_list && Array.isArray(obj.details_list)) {
                obj.details_list.forEach(checkItem);
              } else if (obj.order_data?.details_list) {
                obj.order_data.details_list.forEach(checkItem);
              } else if (obj.orders && Array.isArray(obj.orders)) {
                obj.orders.forEach(checkItem);
              }
            };

            const checkItem = (item) => {
              if (item && (item.order_id || item.order_sn || item.info_card)) {
                const info = item.info_card || item;
                const orderId = item.order_id || item.order_sn || item.id || Date.now();
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
                if (st.includes('hủy')) status = 'CANCELLED';
                else if (st.includes('trả hàng') || st.includes('hoàn tiền')) status = 'REFUNDED';
                else if (st.includes('đang giao') || st.includes('vận chuyển')) status = 'SHIPPING';
                else if (st.includes('chờ thanh toán')) status = 'PENDING_PAYMENT';

                const total = (info.subtotal_price || info.total_price || item.final_total || 0) > 10000000 
                  ? (info.subtotal_price || info.total_price || item.final_total || 0) / 100000 
                  : (info.subtotal_price || info.total_price || item.final_total || 0);

                capturedOrders.set(String(orderId), {
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
                });
              }
            };

            if (fiber.memoizedProps) checkData(fiber.memoizedProps);
            if (fiber.memoizedState) checkData(fiber.memoizedState);
            fiber = fiber.return;
            depth++;
          }
        }
      }
    } catch(e) {
      console.warn("React Fiber scan error:", e);
    }
  }

  // 2. CHIẾN LƯỢC 2: Quét trực tiếp các thẻ hiển thị trên giao diện DOM
  function extractFromDOM() {
    try {
      const cardContainers = document.querySelectorAll('div, section, article');
      cardContainers.forEach(el => {
        const text = el.innerText || '';
        // Nhận diện thẻ đơn hàng qua các từ khóa và link đơn
        const hasOrderKeywords = text.includes('₫') && (
          text.includes('ĐÃ HỦY') || text.includes('TRẢ HÀNG') || text.includes('HOÀN TIỀN') || 
          text.includes('HOÀN THÀNH') || text.includes('Đang giao') || text.includes('ĐÃ GIAO') ||
          text.includes('Thành tiền') || text.includes('Tổng số tiền')
        );

        const orderLink = el.querySelector('a[href*="/user/purchase/order/"]') || el.querySelector('a[href*="order_id"]');
        
        if (hasOrderKeywords && orderLink && el.offsetWidth > 300 && el.offsetHeight > 80) {
          const match = orderLink.href.match(/order[=/]([0-9]+)/);
          const orderCode = match ? match[1] : ('ORD_' + Math.abs(text.slice(0, 50).split('').reduce((a,b)=>((a<<5)-a)+b.charCodeAt(0),0)));

          if (capturedOrders.has(orderCode)) return;

          // Phân loại trạng thái
          let status = 'COMPLETED';
          let statusText = 'Hoàn thành';
          if (text.includes('ĐÃ HỦY') || text.includes('Đã hủy') || text.includes('ĐÃ HUỶ')) {
            status = 'CANCELLED';
            statusText = 'Đã hủy';
          } else if (text.includes('TRẢ HÀNG') || text.includes('Trả hàng') || text.includes('HOÀN TIỀN') || text.includes('Hoàn tiền')) {
            status = 'REFUNDED';
            statusText = 'Trả hàng / Hoàn tiền';
          } else if (text.includes('ĐANG GIAO') || text.includes('Đang giao') || text.includes('Vận chuyển')) {
            status = 'SHIPPING';
            statusText = 'Đang giao';
          }

          // Tiền
          const prices = text.match(/₫\s*([0-9.,]+)/g) || text.match(/([0-9.,]+)\s*₫/g) || [];
          let amount = 0;
          if (prices.length > 0) {
            const rawP = prices[prices.length - 1].replace(/[^0-9]/g, '');
            amount = parseInt(rawP, 10) || 0;
          }

          // Tên shop
          const shopEl = el.querySelector('a[href*="/shop/"]') || el.querySelector('[class*="shop"]');
          const shopName = shopEl ? shopEl.innerText.trim() : 'Shop Shopee';

          // Tên sản phẩm
          const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5 && !l.includes('₫') && !l.includes('Shopee') && !l.includes('Đơn hàng'));
          const productName = lines[1] || lines[0] || 'Sản phẩm Shopee';

          capturedOrders.set(orderCode, {
            id: 'shopee_' + orderCode,
            orderCode: orderCode,
            shopName: shopName,
            status: status,
            statusText: statusText,
            orderTime: new Date().toISOString(),
            totalAmount: amount,
            refundAmount: amount,
            paymentMethod: 'ShopeePay / Thẻ',
            items: [{ name: productName, quantity: 1, price: amount }]
          });
        }
      });
    } catch(e) {
      console.warn("DOM scan error:", e);
    }
  }

  // 3. CHIẾN LƯỢC 3: Hooking XHR & Fetch cho các lần bấm tiếp theo
  const origXHR = window.XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function(method, url) {
    this.addEventListener('load', function() {
      try {
        if (typeof url === 'string' && (url.includes('/order') || url.includes('/purchase'))) {
          const data = JSON.parse(this.responseText);
          const list = data?.data?.order_data?.details_list || data?.data?.details_list || data?.data?.orders || [];
          if (list.length > 0) {
            extractFromReactFiber();
            extractFromDOM();
            console.log(`📥 Bắt gói XHR: Đã có ${capturedOrders.size} đơn.`);
          }
        }
      } catch(e) {}
    });
    return origXHR.apply(this, arguments);
  };

  // Thực thi quét ngay lập tức
  extractFromReactFiber();
  extractFromDOM();

  console.log(`%c📊 KẾT QUẢ QUÉT TỨC THÌ: Tìm thấy ${capturedOrders.size} đơn hàng!`, "color: #059669; font-size: 13px; font-weight: bold;");

  const ordersArray = Array.from(capturedOrders.values());

  if (ordersArray.length > 0) {
    const blob = new Blob([JSON.stringify(ordersArray, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `shopee_orders_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    alert(`🎉 Thành công! Đã quét được ${ordersArray.length} đơn hàng và tự động tải file JSON về máy.`);
  } else {
    alert(`⚠️ Chưa nhận diện được đơn trên màn hình này. Hãy cuộn trang xuống một chút hoặc bấm vào tab "Đã hủy" / "Trả hàng" trên Shopee rồi dán lại lệnh.`);
  }
})();
