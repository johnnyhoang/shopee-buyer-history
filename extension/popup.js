/**
 * Script quét đơn hàng Shopee từ Extension (Hỗ trợ nhiều endpoint fallback)
 */

document.addEventListener('DOMContentLoaded', () => {
  const btnSync = document.getElementById('btn-sync');
  const btnDownload = document.getElementById('btn-download');
  const limitSelect = document.getElementById('limit-select');
  const progressContainer = document.getElementById('progress-container');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressStatus = document.getElementById('progress-status');
  const progressCount = document.getElementById('progress-count');
  const resultActions = document.getElementById('result-actions');
  const totalScannedEl = document.getElementById('total-scanned');
  const statusCard = document.getElementById('status-card');
  const statusText = document.getElementById('status-text');
  const statusIcon = document.getElementById('status-icon');

  let extractedOrders = [];

  btnSync.addEventListener('click', async () => {
    const maxLimit = parseInt(limitSelect.value, 10) || 100;
    
    // Kiểm tra tab hiện tại
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!activeTab || !activeTab.url || !activeTab.url.includes('shopee.vn')) {
      statusCard.className = 'status-card error';
      statusIcon.textContent = '⚠️';
      statusText.textContent = 'Vui lòng mở tab shopee.vn đã đăng nhập để quét!';
      return;
    }

    btnSync.disabled = true;
    progressContainer.classList.remove('hidden');
    resultActions.classList.add('hidden');
    statusCard.className = 'status-card working';
    statusIcon.textContent = '⏳';
    statusText.textContent = 'Đang kết nối phiên đăng nhập Shopee...';

    try {
      extractedOrders = await crawlOrdersFromTab(activeTab.id, maxLimit, (currentCount, max) => {
        const percent = Math.min(Math.round((currentCount / max) * 100), 100);
        progressBarFill.style.width = `${percent}%`;
        progressCount.textContent = `${currentCount}/${max} đơn`;
        progressStatus.textContent = `Đang tải trang đơn hàng...`;
      });

      progressContainer.classList.add('hidden');

      if (extractedOrders.length > 0) {
        resultActions.classList.remove('hidden');
        totalScannedEl.textContent = extractedOrders.length;
        statusCard.className = 'status-card ready';
        statusIcon.textContent = '✅';
        statusText.textContent = `Đã trích xuất thành công ${extractedOrders.length} đơn!`;
      } else {
        statusCard.className = 'status-card error';
        statusIcon.textContent = '⚠️';
        statusText.textContent = 'Không tìm thấy đơn hàng nào. Hãy chắc chắn bạn đang ở trang Đơn mua.';
      }
      btnSync.disabled = false;

    } catch (err) {
      console.error(err);
      progressContainer.classList.add('hidden');
      statusCard.className = 'status-card error';
      statusIcon.textContent = '❌';
      statusText.textContent = 'Lỗi khi trích xuất dữ liệu.';
      btnSync.disabled = false;
    }
  });

  btnDownload.addEventListener('click', () => {
    if (!extractedOrders.length) return;
    const blob = new Blob([JSON.stringify(extractedOrders, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopee_orders_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
});

async function crawlOrdersFromTab(tabId, maxLimit) {
  const result = await chrome.scripting.executeScript({
    target: { tabId },
    func: async (maxLimit) => {
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
      if (csrfToken) headers['x-csrftoken'] = csrfToken;

      const endpoints = [
        (offset, limit) => `/api/v4/order/get_all_order_and_item_list?limit=${limit}&offset=${offset}`,
        (offset, limit) => `/api/v4/order/get_order_list?limit=${limit}&offset=${offset}`,
        (offset, limit) => `/api/v4/order/get_all_order_and_item_list?order_type=1&limit=${limit}&offset=${offset}`,
        (offset, limit) => `/api/v2/order/get_all_orders?limit=${limit}&offset=${offset}`
      ];

      let workingIndex = 0;
      for (let i = 0; i < endpoints.length; i++) {
        try {
          const res = await fetch(endpoints[i](0, 5), { headers, credentials: 'include' });
          if (res.ok) {
            const j = await res.json();
            if (j?.data || j?.orders) {
              workingIndex = i;
              break;
            }
          }
        } catch(e) {}
      }

      const orders = [];
      let offset = 0;
      const limit = 20;
      let hasMore = true;

      while (hasMore && orders.length < maxLimit) {
        try {
          const res = await fetch(endpoints[workingIndex](offset, limit), { headers, credentials: 'include' });
          if (!res.ok) break;
          const data = await res.json();
          const list = data?.data?.order_data?.details_list || 
                       data?.data?.details_list || 
                       data?.data?.orders || 
                       data?.orders || 
                       [];

          if (!list.length) break;

          list.forEach(item => {
            if (orders.length >= maxLimit) return;
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
          if (list.length < limit) hasMore = false;
          await new Promise(r => setTimeout(r, 400));
        } catch (e) {
          break;
        }
      }

      return orders;
    },
    args: [maxLimit]
  });

  return result?.[0]?.result || [];
}
