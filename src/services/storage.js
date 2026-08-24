import { INITIAL_ACCOUNTS, INITIAL_ORDERS } from '../data/initialData';

const STORAGE_KEYS = {
  ACCOUNTS: 'shopee_buyer_accounts_v2',
  ORDERS: 'shopee_buyer_orders_v2',
  ACTIVE_ACCOUNT: 'shopee_buyer_active_account_v2',
};

// Tự động xóa sạch dữ liệu mẫu v1 cũ trong localStorage của trình duyệt
try {
  localStorage.removeItem('shopee_buyer_orders_v1');
  localStorage.removeItem('shopee_buyer_accounts_v1');
  localStorage.removeItem('shopee_buyer_active_account_v1');
} catch (e) {
  console.warn('Lỗi khi xóa key v1 cũ:', e);
}

export const storageService = {
  // --- TÀI KHOẢN ---
  getAccounts: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(INITIAL_ACCOUNTS));
        return INITIAL_ACCOUNTS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Lỗi khi đọc danh sách tài khoản:', e);
      return INITIAL_ACCOUNTS;
    }
  },

  saveAccounts: (accounts) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.error('Lỗi khi lưu danh sách tài khoản:', e);
    }
  },

  getActiveAccountId: () => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT) || 'ALL';
  },

  setActiveAccountId: (id) => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT, id);
  },

  // --- ĐƠN HÀNG ---
  getOrders: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
        return [];
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Lỗi khi đọc danh sách đơn hàng:', e);
      return [];
    }
  },

  saveOrders: (orders) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error('Lỗi khi lưu danh sách đơn hàng:', e);
    }
  },

  // --- THAO TÁC CẬP NHẬT ĐỐI SOÁT HOÀN TIỀN ---
  updateRefundStatus: (orderId, newRefundStatus, userNote) => {
    const orders = storageService.getOrders();
    const updatedOrders = orders.map((ord) => {
      if (ord.id === orderId || ord.orderCode === orderId) {
        return {
          ...ord,
          refundStatus: newRefundStatus,
          refundConfirmedAt: newRefundStatus === 'CONFIRMED_RECEIVED' ? new Date().toISOString() : ord.refundConfirmedAt,
          userNote: userNote !== undefined ? userNote : ord.userNote,
        };
      }
      return ord;
    });
    storageService.saveOrders(updatedOrders);
    return updatedOrders;
  },

  updateOrderNote: (orderId, note) => {
    const orders = storageService.getOrders();
    const updatedOrders = orders.map((ord) => {
      if (ord.id === orderId || ord.orderCode === orderId) {
        return {
          ...ord,
          userNote: note,
        };
      }
      return ord;
    });
    storageService.saveOrders(updatedOrders);
    return updatedOrders;
  },

  // --- NHẬP VÀ ĐỒNG BỘ DỮ LIỆU ĐƠN HÀNG MỚI ---
  mergeImportedOrders: (incomingOrders, targetAccountId, accountName) => {
    const currentOrders = storageService.getOrders();
    const currentAccounts = storageService.getAccounts();

    // Kiểm tra xem tài khoản đã tồn tại chưa, nếu chưa thì thêm mới
    let account = currentAccounts.find(a => a.id === targetAccountId || a.username === targetAccountId);
    let finalAccountId = targetAccountId;

    if (!account) {
      finalAccountId = `acc_${Date.now()}`;
      const newAccount = {
        id: finalAccountId,
        name: accountName || 'Tài khoản Shopee mới',
        username: targetAccountId || 'shopee_user',
        color: 'emerald',
        createdAt: new Date().toISOString(),
      };
      currentAccounts.push(newAccount);
      storageService.saveAccounts(currentAccounts);
    } else {
      finalAccountId = account.id;
    }

    const orderMap = new Map();
    // Đưa đơn cũ vào map
    currentOrders.forEach((ord) => {
      orderMap.set(ord.orderCode || ord.id, ord);
    });

    let newCount = 0;
    let updatedCount = 0;

    // Merge đơn mới vào map
    incomingOrders.forEach((incoming) => {
      const code = incoming.orderCode || incoming.id;
      if (!code) return;

      const existing = orderMap.get(code);
      if (existing) {
        // Giữ lại trạng thái đối soát của người dùng nếu đã chỉnh sửa trước đó
        orderMap.set(code, {
          ...incoming,
          id: existing.id,
          orderCode: code,
          accountId: existing.accountId || finalAccountId,
          refundStatus: existing.refundStatus !== 'PENDING' && existing.refundStatus !== 'SHOPEE_REFUNDED' ? existing.refundStatus : (incoming.refundStatus || existing.refundStatus),
          refundConfirmedAt: existing.refundConfirmedAt || incoming.refundConfirmedAt,
          userNote: existing.userNote || incoming.userNote || '',
        });
        updatedCount++;
      } else {
        // Đơn mới
        const isRefundOrCancel = incoming.status === 'CANCELLED' || incoming.status === 'REFUNDED' || incoming.status === 'REFUNDING';
        orderMap.set(code, {
          ...incoming,
          id: incoming.id || `ord_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          orderCode: code,
          accountId: finalAccountId,
          refundStatus: incoming.refundStatus || (isRefundOrCancel ? 'SHOPEE_REFUNDED' : 'NOT_APPLICABLE'),
          refundConfirmedAt: incoming.refundConfirmedAt || null,
          userNote: incoming.userNote || '',
        });
        newCount++;
      }
    });

    const mergedList = Array.from(orderMap.values());
    // Sắp xếp đơn mới nhất lên đầu
    mergedList.sort((a, b) => new Date(b.orderTime || 0) - new Date(a.orderTime || 0));

    storageService.saveOrders(mergedList);
    return {
      allOrders: mergedList,
      newCount,
      updatedCount,
      allAccounts: currentAccounts,
    };
  },

  // Xóa sạch toàn bộ dữ liệu (bắt đầu mới)
  clearAllData: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ACCOUNT);
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(INITIAL_ACCOUNTS));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT, 'ALL');
    return {
      accounts: INITIAL_ACCOUNTS,
      orders: [],
    };
  },

  // Dọn dẹp dòng rác và loại bỏ đơn trùng lặp
  cleanAndDeduplicateOrders: (ordersList) => {
    // 1. Loại bỏ các dòng rác (Tên sản phẩm là "Tổng tiền hoàn", "Xem Shop", hoặc tiền <= 1000đ)
    const validOrders = ordersList.filter(ord => {
      const firstItemName = (ord.items?.[0]?.name || '').trim().toLowerCase();
      const isJunkName = firstItemName === 'tổng tiền hoàn' || 
                         firstItemName === 'thành tiền' || 
                         firstItemName === 'xem shop';
      const isZeroOrOneDong = Number(ord.refundAmount || ord.totalAmount || 0) <= 1000;
      return !isJunkName && !isZeroOrOneDong;
    });

    // 2. Gom nhóm chống trùng lặp theo Shop + Số tiền
    const uniqueMap = new Map();
    validOrders.forEach(ord => {
      const isGenKey = String(ord.orderCode).startsWith('SP');
      const uniqueKey = isGenKey 
        ? `${ord.shopName}_${Math.round(ord.refundAmount || ord.totalAmount)}`
        : String(ord.orderCode || ord.id);

      if (!uniqueMap.has(uniqueKey)) {
        uniqueMap.set(uniqueKey, ord);
      } else {
        const existing = uniqueMap.get(uniqueKey);
        const existingName = existing.items?.[0]?.name || '';
        const currentName = ord.items?.[0]?.name || '';
        if (currentName.length > existingName.length && currentName !== 'Sản phẩm Shopee') {
          uniqueMap.set(uniqueKey, { ...existing, ...ord, id: existing.id });
        }
      }
    });

    const cleaned = Array.from(uniqueMap.values());
    cleaned.sort((a, b) => new Date(b.orderTime || 0) - new Date(a.orderTime || 0));
    storageService.saveOrders(cleaned);
    return cleaned;
  },

  // Xuất toàn bộ dữ liệu ra JSON
  exportDataJSON: () => {
    const data = {
      accounts: storageService.getAccounts(),
      orders: storageService.getOrders(),
      exportedAt: new Date().toISOString(),
      version: '2.0',
    };
    return JSON.stringify(data, null, 2);
  }
};
