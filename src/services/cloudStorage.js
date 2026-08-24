import { storageService } from './storage';

export const cloudStorage = {
  // 1. Tải toàn bộ đơn hàng từ Supabase
  fetchOrders: async () => {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const cloudOrders = await res.json();
      if (Array.isArray(cloudOrders)) {
        storageService.saveOrders(cloudOrders);
        return cloudOrders;
      }
      return storageService.getOrders();
    } catch (e) {
      console.warn('Không thể kết nối API Supabase, dùng cache cục bộ:', e.message);
      return storageService.getOrders();
    }
  },

  // 2. Tải toàn bộ danh sách tài khoản
  fetchAccounts: async () => {
    try {
      const res = await fetch('/api/accounts');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const cloudAccounts = await res.json();
      if (Array.isArray(cloudAccounts) && cloudAccounts.length > 0) {
        storageService.saveAccounts(cloudAccounts);
        return cloudAccounts;
      }
      return storageService.getAccounts();
    } catch (e) {
      return storageService.getAccounts();
    }
  },

  // 3. Lưu hoặc cập nhật 1 đơn hàng lên Supabase
  saveOrder: async (order) => {
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
    } catch (e) {
      console.warn('Lưu đơn lên Cloud lỗi:', e.message);
    }
  },

  // 4. Xóa 1 hoặc nhiều đơn trên Supabase
  deleteOrders: async (ids) => {
    try {
      await fetch('/api/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.isArray(ids) ? ids : [ids] }),
      });
    } catch (e) {
      console.warn('Xóa đơn trên Cloud lỗi:', e.message);
    }
  },

  // 5. Đồng bộ hàng loạt đơn hàng (Bulk Sync)
  syncBulkOrders: async (orders, accountId, accountName) => {
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders, accountId, accountName }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Bulk sync lên Cloud lỗi:', e.message);
    }
  },

  // 6. Lưu tài khoản mới lên Supabase
  saveAccount: async (account) => {
    try {
      await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      });
    } catch (e) {}
  },

  // 7. Xóa tài khoản trên Supabase
  deleteAccount: async (accountId) => {
    try {
      await fetch('/api/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: accountId }),
      });
    } catch (e) {}
  }
};
