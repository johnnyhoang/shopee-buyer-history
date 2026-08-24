import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { storageService } from '../services/storage';
import { cloudStorage } from '../services/cloudStorage';
import { normalizePaymentMethod } from '../utils/formatters';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [accounts, setAccounts] = useState(() => storageService.getAccounts());
  const [orders, setOrders] = useState(() => storageService.getOrders());
  const [activeAccountId, setActiveAccountId] = useState(() => storageService.getActiveAccountId());
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  
  // Navigation: 'refund-ledger' | 'all-ledger' | 'sync-guide'
  const [activeTab, setActiveTab] = useState('refund-ledger');
  
  // Filters for Accounting Ledger
  const [searchQuery, setSearchQuery] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('ALL');
  const [reconciliationFilter, setReconciliationFilter] = useState('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Tự động kéo dữ liệu mới nhất từ Supabase Cloud khi mở ứng dụng
  useEffect(() => {
    let isMounted = true;
    const loadFromCloud = async () => {
      setIsCloudSyncing(true);
      try {
        const [cloudAccs, cloudOrds] = await Promise.all([
          cloudStorage.fetchAccounts(),
          cloudStorage.fetchOrders()
        ]);
        if (isMounted) {
          if (Array.isArray(cloudAccs) && cloudAccs.length > 0) setAccounts(cloudAccs);
          if (Array.isArray(cloudOrds)) setOrders(cloudOrds);
        }
      } catch (e) {
        console.warn('Lỗi khi tải từ Supabase:', e);
      } finally {
        if (isMounted) setIsCloudSyncing(false);
      }
    };

    loadFromCloud();
    return () => { isMounted = false; };
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const handleSelectAccount = (id) => {
    setActiveAccountId(id);
    storageService.setActiveAccountId(id);
  };

  // Cập nhật trạng thái đối soát đơn lẻ (Đồng bộ Cloud)
  const updateRefundField = (orderId, updates) => {
    const currentOrders = storageService.getOrders();
    let updatedTarget = null;
    const updatedOrders = currentOrders.map(ord => {
      if (ord.id === orderId || ord.orderCode === orderId) {
        updatedTarget = { ...ord, ...updates };
        return updatedTarget;
      }
      return ord;
    });
    storageService.saveOrders(updatedOrders);
    setOrders(updatedOrders);

    if (updatedTarget) {
      cloudStorage.saveOrder(updatedTarget);
    }
  };

  // Đổi nhanh trạng thái nhận tiền (Đồng bộ Cloud)
  const toggleRefundStatus = (orderId) => {
    const currentOrders = storageService.getOrders();
    const target = currentOrders.find(o => o.id === orderId || o.orderCode === orderId);
    if (!target) return;

    let nextStatus = 'CONFIRMED_RECEIVED';
    let nextConfirmedAt = new Date().toISOString();

    if (target.refundStatus === 'CONFIRMED_RECEIVED') {
      nextStatus = 'SHOPEE_REFUNDED';
      nextConfirmedAt = null;
      showNotification(`Đã chuyển đơn #${target.orderCode} về Chưa nhận tiền`, 'info');
    } else {
      nextStatus = 'CONFIRMED_RECEIVED';
      showNotification(`Đã xác nhận nhận đủ tiền đơn #${target.orderCode}!`, 'success');
    }

    let updatedTarget = null;
    const updated = currentOrders.map(ord => {
      if (ord.id === orderId || ord.orderCode === orderId) {
        updatedTarget = {
          ...ord,
          refundStatus: nextStatus,
          refundConfirmedAt: nextConfirmedAt,
        };
        return updatedTarget;
      }
      return ord;
    });

    storageService.saveOrders(updated);
    setOrders(updated);

    if (updatedTarget) {
      cloudStorage.saveOrder(updatedTarget);
    }
  };

  // Xác nhận hàng loạt
  const batchConfirmRefunds = (orderIds) => {
    const currentOrders = storageService.getOrders();
    const now = new Date().toISOString();
    const updated = currentOrders.map(ord => {
      if (orderIds.includes(ord.id) || orderIds.includes(ord.orderCode)) {
        const up = {
          ...ord,
          refundStatus: 'CONFIRMED_RECEIVED',
          refundConfirmedAt: ord.refundConfirmedAt || now,
        };
        cloudStorage.saveOrder(up);
        return up;
      }
      return ord;
    });
    storageService.saveOrders(updated);
    setOrders(updated);
    showNotification(`Đã xác nhận nhận tiền thành công cho ${orderIds.length} đơn hàng!`, 'success');
  };

  // Đánh dấu quá hạn hàng loạt
  const batchDisputeRefunds = (orderIds) => {
    const currentOrders = storageService.getOrders();
    const updated = currentOrders.map(ord => {
      if (orderIds.includes(ord.id) || orderIds.includes(ord.orderCode)) {
        const up = { ...ord, refundStatus: 'DISPUTED' };
        cloudStorage.saveOrder(up);
        return up;
      }
      return ord;
    });
    storageService.saveOrders(updated);
    setOrders(updated);
    showNotification(`Đã gắn cờ Quá hạn cho ${orderIds.length} đơn!`, 'warning');
  };

  // Nhập dữ liệu (Đồng bộ hàng loạt lên Supabase Cloud)
  const importOrders = async (incomingOrders, targetAccountId, accountName) => {
    const result = storageService.mergeImportedOrders(incomingOrders, targetAccountId, accountName);
    setOrders(result.allOrders);
    setAccounts(result.allAccounts);
    showNotification(`Đã đồng bộ ${result.allOrders.length} đơn hàng (+${result.newCount} đơn mới)!`, 'success');

    // Đồng bộ nền lên Supabase
    cloudStorage.syncBulkOrders(incomingOrders, targetAccountId, accountName);
    return result;
  };

  // Xóa sạch toàn bộ dữ liệu
  const clearAllData = () => {
    const result = storageService.clearAllData();
    setAccounts(result.accounts);
    setOrders(result.orders);
    setActiveAccountId('ALL');
    showNotification('Đã xóa sạch toàn bộ dữ liệu trên Sổ Kế Toán!', 'info');
  };

  // Quản lý tài khoản
  const addAccount = (name, username, phone) => {
    const newAcc = {
      id: `acc_${Date.now()}`,
      name: name || 'Người mua mới',
      username: username || '',
      phone: phone || '',
      color: 'slate',
      createdAt: new Date().toISOString(),
    };
    const updated = [...accounts, newAcc];
    setAccounts(updated);
    storageService.saveAccounts(updated);
    cloudStorage.saveAccount(newAcc);
    showNotification(`Đã thêm người mua: ${newAcc.name}`, 'success');
    return newAcc;
  };

  const updateAccount = (id, fields) => {
    const updated = accounts.map(a => a.id === id ? { ...a, ...fields } : a);
    setAccounts(updated);
    storageService.saveAccounts(updated);
    const target = updated.find(a => a.id === id);
    if (target) cloudStorage.saveAccount(target);
    showNotification('Đã cập nhật tên tài khoản!', 'success');
  };

  const deleteAccount = (id) => {
    const updated = accounts.filter(a => a.id !== id);
    setAccounts(updated);
    storageService.saveAccounts(updated);
    cloudStorage.deleteAccount(id);
    if (activeAccountId === id) setActiveAccountId('ALL');
    showNotification('Đã xóa tài khoản!', 'info');
  };

  // Xóa một đơn hàng khỏi hệ thống
  const deleteOrder = (orderId) => {
    const updated = orders.filter(o => o.id !== orderId && o.orderCode !== orderId);
    setOrders(updated);
    storageService.saveOrders(updated);
    cloudStorage.deleteOrders(orderId);
    showNotification('Đã xóa đơn hàng khỏi sổ!', 'info');
  };

  // Xóa nhiều đơn hàng
  const batchDeleteOrders = (orderIds) => {
    const set = new Set(orderIds);
    const updated = orders.filter(o => !set.has(o.id) && !set.has(o.orderCode));
    setOrders(updated);
    storageService.saveOrders(updated);
    cloudStorage.deleteOrders(orderIds);
    showNotification(`Đã xóa ${orderIds.length} đơn hàng khỏi sổ!`, 'info');
  };

  // Tự động dọn dẹp đơn trùng lặp và dòng rác
  const autoDeduplicateOrders = () => {
    const currentOrders = storageService.getOrders();
    const originalCount = currentOrders.length;
    const cleaned = storageService.cleanAndDeduplicateOrders(currentOrders);
    setOrders(cleaned);
    const removedCount = originalCount - cleaned.length;
    if (removedCount > 0) {
      showNotification(`Đã lọc sạch ${removedCount} đơn trùng lặp & dòng rác!`, 'success');
    } else {
      showNotification('Sổ sách đã sạch sẽ, không có đơn trùng lặp!', 'info');
    }
  };

  // Đánh dấu đơn hủy chưa thanh toán (không cần hoàn tiền)
  const markNoRefundNeeded = (orderId) => {
    updateRefundField(orderId, { refundStatus: 'NO_REFUND_NEEDED' });
    showNotification('Đã chuyển trạng thái: Chưa thanh toán (Không cần hoàn tiền)', 'info');
  };

  // Lọc theo tài khoản người mua
  const accountOrders = useMemo(() => {
    if (activeAccountId === 'ALL') return orders;
    return orders.filter(o => o.accountId === activeAccountId);
  }, [orders, activeAccountId]);

  // SỔ ĐỐI SOÁT HOÀN TIỀN (Chỉ gồm các đơn Hủy và Trả hàng ĐÃ THANH TOÁN CẦN HOÀN)
  const refundLedgerEntries = useMemo(() => {
    return accountOrders.filter(o => {
      const isRefundOrCancel = o.status === 'CANCELLED' || o.status === 'REFUNDED' || o.status === 'REFUNDING';
      if (!isRefundOrCancel) return false;

      // Loại bỏ các đơn đã đánh dấu là chưa thanh toán / không cần hoàn
      if (o.refundStatus === 'NO_REFUND_NEEDED' || o.refundStatus === 'NOT_APPLICABLE') return false;

      // Lọc theo loại đơn
      if (orderTypeFilter === 'CANCELLED' && o.status !== 'CANCELLED') return false;
      if (orderTypeFilter === 'REFUNDED' && (o.status !== 'REFUNDED' && o.status !== 'REFUNDING')) return false;

      // Lọc theo trạng thái đối soát nhận tiền
      if (reconciliationFilter === 'UNRESOLVED') {
        if (o.refundStatus === 'CONFIRMED_RECEIVED') return false;
      } else if (reconciliationFilter === 'CONFIRMED') {
        if (o.refundStatus !== 'CONFIRMED_RECEIVED') return false;
      } else if (reconciliationFilter === 'DISPUTED') {
        if (o.refundStatus !== 'DISPUTED') return false;
      }

      // Lọc theo phương thức hoàn tiền (chuẩn hóa 100%)
      if (paymentMethodFilter !== 'ALL') {
        const normPM = normalizePaymentMethod(o.paymentMethod);
        if (normPM !== paymentMethodFilter) {
          return false;
        }
      }

      // Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = (o.orderCode || '').toLowerCase().includes(q);
        const matchShop = (o.shopName || '').toLowerCase().includes(q);
        const matchItem = o.items?.some(i => (i.name || '').toLowerCase().includes(q));
        const matchNote = (o.userNote || '').toLowerCase().includes(q);
        if (!matchCode && !matchShop && !matchItem && !matchNote) return false;
      }

      return true;
    });
  }, [accountOrders, orderTypeFilter, reconciliationFilter, paymentMethodFilter, searchQuery]);

  // Thống kê tài chính sổ cái
  const ledgerTotals = useMemo(() => {
    const allRefundEntries = accountOrders.filter(
      o => (o.status === 'CANCELLED' || o.status === 'REFUNDED' || o.status === 'REFUNDING') &&
           o.refundStatus !== 'NO_REFUND_NEEDED' && o.refundStatus !== 'NOT_APPLICABLE'
    );

    let totalRefundDue = 0;
    let totalReceived = 0;
    let totalPending = 0;
    let totalDisputed = 0;
    let pendingCount = 0;
    let confirmedCount = 0;

    allRefundEntries.forEach(o => {
      const amt = o.refundAmount || o.totalAmount || 0;
      totalRefundDue += amt;

      if (o.refundStatus === 'CONFIRMED_RECEIVED') {
        totalReceived += amt;
        confirmedCount++;
      } else if (o.refundStatus === 'DISPUTED') {
        totalDisputed += amt;
        totalPending += amt;
        pendingCount++;
      } else {
        totalPending += amt;
        pendingCount++;
      }
    });

    return {
      totalEntries: allRefundEntries.length,
      totalRefundDue,
      totalReceived,
      totalPending,
      totalDisputed,
      pendingCount,
      confirmedCount,
    };
  }, [accountOrders]);

  return (
    <AppContext.Provider
      value={{
        accounts,
        orders,
        activeAccountId,
        handleSelectAccount,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        orderTypeFilter,
        setOrderTypeFilter,
        reconciliationFilter,
        setReconciliationFilter,
        paymentMethodFilter,
        setPaymentMethodFilter,
        accountOrders,
        refundLedgerEntries,
        ledgerTotals,
        selectedOrder,
        setSelectedOrder,
        isAccountModalOpen,
        setIsAccountModalOpen,
        isSyncModalOpen,
        setIsSyncModalOpen,
        notification,
        showNotification,
        updateRefundField,
        toggleRefundStatus,
        batchConfirmRefunds,
        batchDisputeRefunds,
        importOrders,
        clearAllData,
        addAccount,
        updateAccount,
        deleteAccount,
        deleteOrder,
        batchDeleteOrders,
        markNoRefundNeeded,
        autoDeduplicateOrders,
        isCloudSyncing,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
