(function startShopeeSniffer() {
  console.log("%c🎯 SHOPEE ORDER SNIFFER ĐÃ KÍCH HOẠT!", "color: #10b981; font-size: 14px; font-weight: bold;");
  console.log("👉 Bây giờ bạn chỉ cần bấm vào các tab 'Đã hủy', 'Trả hàng/Hoàn tiền' hoặc 'Tất cả' trên Shopee, công cụ sẽ tự động bắt toàn bộ đơn hàng.");

  window.__CAPTURED_SHOPEE_ORDERS__ = window.__CAPTURED_SHOPEE_ORDERS__ || new Map();

  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const clone = response.clone();

    try {
      const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
      if (url.includes('/api/v4/order') || url.includes('/api/v2/order') || url.includes('order')) {
        clone.json().then(data => {
          const list = data?.data?.order_data?.details_list || 
                       data?.data?.details_list || 
                       data?.data?.orders || 
                       [];

          if (list && list.length > 0) {
            list.forEach(item => {
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
              if (st.includes('hủy')) status = 'CANCELLED';
              else if (st.includes('trả hàng') || st.includes('hoàn tiền')) status = 'REFUNDED';
              else if (st.includes('đang giao') || st.includes('vận chuyển')) status = 'SHIPPING';
              else if (st.includes('chờ thanh toán')) status = 'PENDING_PAYMENT';

              const orderId = item.order_id || item.order_sn || item.id || Date.now();
              const total = (info.subtotal_price || info.total_price || item.final_total || 0) > 10000000 
                ? (info.subtotal_price || info.total_price || item.final_total || 0) / 100000 
                : (info.subtotal_price || info.total_price || item.final_total || 0);

              window.__CAPTURED_SHOPEE_ORDERS__.set(String(orderId), {
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
            });

            console.log(`%c📥 Đã bắt được thêm đơn! Tổng số đơn trong bộ nhớ: ${window.__CAPTURED_SHOPEE_ORDERS__.size}`, 'color: #059669; font-weight: bold;');
          }
        }).catch(() => {});
      }
    } catch(e) {}

    return response;
  };

  // Tạo nút bấm Tải file nổi trên góc màn hình Shopee
  let btn = document.getElementById('shopee-export-float-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'shopee-export-float-btn';
    btn.innerHTML = '💾 Tải File Đơn Hàng Shopee (.JSON)';
    btn.style.position = 'fixed';
    btn.style.bottom = '20px';
    btn.style.right = '20px';
    btn.style.zIndex = '999999';
    btn.style.padding = '12px 20px';
    btn.style.backgroundColor = '#ee4d2d';
    btn.style.color = '#fff';
    btn.style.fontWeight = 'bold';
    btn.style.fontSize = '14px';
    btn.style.borderRadius = '30px';
    btn.style.border = '2px solid #fff';
    btn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
    btn.style.cursor = 'pointer';
    
    btn.onclick = function() {
      const orders = Array.from(window.__CAPTURED_SHOPEE_ORDERS__.values());
      if (orders.length === 0) {
        alert('⚠️ Chưa có đơn hàng nào được bắt. Hãy bấm chuyển qua tab "Đã hủy" hoặc "Trả hàng" trên Shopee rồi bấm lại nút này.');
        return;
      }
      const blob = new Blob([JSON.stringify(orders, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `shopee_orders_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      alert(`🎉 Đã tải file chứa ${orders.length} đơn hàng! Hãy nạp vào Sổ Kế Toán.`);
    };

    document.body.appendChild(btn);
  }
})();
