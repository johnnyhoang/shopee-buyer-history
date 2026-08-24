(async function crawlShopeeOrdersPro() {
  console.log("%c🚀 Bắt đầu quét đơn hàng Shopee...", "color: #ee4d2d; font-size: 14px; font-weight: bold;");

  // Lấy CSRF Token từ Cookie nếu có
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
  };
  const csrfToken = getCookie('csrftoken');

  const headers = {
    'Accept': 'application/json',
    'x-shopee-language': 'vi',
    'x-requested-with': 'XMLHttpRequest',
  };
  if (csrfToken) {
    headers['x-csrftoken'] = csrfToken;
  }

  // Danh sách các endpoint API lấy đơn hàng của Shopee
  const endpoints = [
    (offset, limit) => `/api/v4/order/get_all_order_and_item_list?limit=${limit}&offset=${offset}`,
    (offset, limit) => `/api/v4/order/get_order_list?limit=${limit}&offset=${offset}`,
    (offset, limit) => `/api/v4/order/get_all_order_and_item_list?order_type=1&limit=${limit}&offset=${offset}`,
    (offset, limit) => `/api/v2/order/get_all_orders?limit=${limit}&offset=${offset}`
  ];

  let orders = [];
  let workingEndpointIndex = -1;

  // Thử tìm endpoint hoạt động
  for (let i = 0; i < endpoints.length; i++) {
    try {
      const url = endpoints[i](0, 10);
      console.log(`🔍 Thử kết nối API (${i + 1}/${endpoints.length}): ${url}`);
      const res = await fetch(url, { headers, credentials: 'include' });
      if (!res.ok) continue;
      const json = await res.json();
      console.log("Phản hồi mẫu:", json);

      const list = json?.data?.order_data?.details_list || 
                   json?.data?.details_list || 
                   json?.data?.orders || 
                   json?.orders || 
                   [];

      if (json?.data || json?.orders) {
        workingEndpointIndex = i;
        console.log(`✅ Kết nối thành công qua API ${i + 1}! Số đơn đợt đầu: ${list.length}`);
        break;
      }
    } catch (err) {
      console.warn("Thử endpoint thất bại:", err);
    }
  }

  if (workingEndpointIndex === -1) {
    // Nếu cả 4 endpoint trên bị chặn, thử đọc trực tiếp từ State/Cache của trang web
    console.log("⚠️ Đang thử trích xuất từ dữ liệu bộ nhớ trang Shopee...");
    try {
      if (window.__INITIAL_STATE__?.order) {
        console.log("Tìm thấy Initial State!");
      }
    } catch(e) {}
    alert("❌ Không lấy được danh sách đơn. Vui lòng kiểm tra tab Console để xem thông báo lỗi chi tiết.");
    return;
  }

  // Bắt đầu duyệt toàn bộ danh sách đơn
  let offset = 0;
  const limit = 20;
  let hasMore = true;

  while (hasMore) {
    try {
      const url = endpoints[workingEndpointIndex](offset, limit);
      const res = await fetch(url, { headers, credentials: 'include' });
      const data = await res.json();

      const list = data?.data?.order_data?.details_list || 
                   data?.data?.details_list || 
                   data?.data?.orders || 
                   data?.orders || 
                   [];

      if (!list || list.length === 0) {
        hasMore = false;
        break;
      }

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
        else if (st.includes('chờ lấy hàng') || st.includes('đang xử lý')) status = 'PROCESSING';

        const orderId = item.order_id || item.order_sn || item.id || Date.now();
        const total = (info.subtotal_price || info.total_price || item.final_total || 0) > 10000000 
          ? (info.subtotal_price || info.total_price || item.final_total || 0) / 100000 
          : (info.subtotal_price || info.total_price || item.final_total || 0);

        orders.push({
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
          shippingFee: (info.shipping_fee || 0) / 100000,
          voucherDiscount: (info.voucher_price || 0) / 100000,
          items: items
        });
      });

      offset += limit;
      console.log(`📦 Đang tải: ${orders.length} đơn hàng...`);
      if (list.length < limit) hasMore = false;
      await new Promise(r => setTimeout(r, 400));
    } catch (err) {
      console.error("Lỗi khi tải trang:", err);
      hasMore = false;
    }
  }

  console.log(`🎉 Tổng số đơn trích xuất được: ${orders.length}`);
  
  if (orders.length === 0) {
    alert("⚠️ Chưa lấy được đơn nào. Vui lòng chụp ảnh màn hình tab Console và gửi cho tôi để kiểm tra.");
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
  alert(`🎉 Thành công! Đã trích xuất ${orders.length} đơn hàng. File JSON đã được tải về máy của bạn.`);
})();
