import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { storageService } from '../services/storage';
import { normalizePaymentMethod } from '../utils/formatters';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [accounts, setAccounts] = useState(() => storageService.getAccounts());
  const [orders, setOrders] = useState(() => storageService.getOrders());
  const [activeAccountId, setActiveAccountId] = useState(() => storageService.getActiveAccountId());
  
  // Navigation: 'refund-ledger' (Mặc định: Sổ đối soát hoàn tiền) | 'all-ledger' (Sổ tất cả đơn) | 'sync-guide'
  const [activeTab, setActiveTab] = useState('refund-ledger');
  
  // Filters for Accounting Ledger
  const [searchQuery, setSearchQuery] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('ALL'); // 'ALL' | 'CANCELLED' | 'REFUNDED'
  const [reconciliationFilter, setReconciliationFilter] = useState('ALL'); // 'ALL' | 'UNRESOLVED' (Chưa nhận) | 'CONFIRMED' (Đã nhận) | 'DISPUTED' (Quá hạn)
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

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

  // Cập nhật trạng thái đối soát đơn lẻ
  const updateRefundField = (orderId, updates) => {
    const currentOrders = storageService.getOrders();
    const updatedOrders = currentOrders.map(ord => {
      if (ord.id === orderId || ord.orderCode === orderId) {
        return { ...ord, ...updates };
      }
      return ord;
    });
    storageService.saveOrders(updatedOrders);
    setOrders(updatedOrders);
  };

  // Đổi nhanh trạng thái nhận tiền
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

    const updated = currentOrders.map(ord => {
      if (ord.id === orderId || ord.orderCode === orderId) {
        return {
          ...ord,
          refundStatus: nextStatus,
          refundConfirmedAt: nextConfirmedAt,
        };
      }
      return ord;
    });

    storageService.saveOrders(updated);
    setOrders(updated);
  };

  // Xác nhận hàng loạt
  const batchConfirmRefunds = (orderIds) => {
    const currentOrders = storageService.getOrders();
    const now = new Date().toISOString();
    const updated = currentOrders.map(ord => {
      if (orderIds.includes(ord.id) || orderIds.includes(ord.orderCode)) {
        return {
          ...ord,
          refundStatus: 'CONFIRMED_RECEIVED',
          refundConfirmedAt: ord.refundConfirmedAt || now,
        };
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
        return {
          ...ord,
          refundStatus: 'DISPUTED',
        };
      }
      return ord;
    });
    storageService.saveOrders(updated);
    setOrders(updated);
    showNotification(`Đã gắn cờ Quá hạn / Cần khiếu nại cho ${orderIds.length} đơn!`, 'warning');
  };

  // Nhập dữ liệu
  const importOrders = (incomingOrders, targetAccountId, accountName) => {
    const result = storageService.mergeImportedOrders(incomingOrders, targetAccountId, accountName);
    setOrders(result.allOrders);
    setAccounts(result.allAccounts);
    showNotification(`Đã đồng bộ ${result.allOrders.length} đơn hàng (+${result.newCount} đơn mới)!`, 'success');
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
    showNotification(`Đã thêm người mua: ${newAcc.name}`, 'success');
    return newAcc;
  };

  const updateAccount = (id, fields) => {
    const updated = accounts.map(a => a.id === id ? { ...a, ...fields } : a);
    setAccounts(updated);
    storageService.saveAccounts(updated);
    showNotification('Đã cập nhật tên tài khoản!', 'success');
  };

  const deleteAccount = (id) => {
    const updated = accounts.filter(a => a.id !== id);
    setAccounts(updated);
    storageService.saveAccounts(updated);
    if (activeAccountId === id) setActiveAccountId('ALL');
    showNotification('Đã xóa tài khoản!', 'info');
  };

  // Lọc theo tài khoản người mua
  const accountOrders = useMemo(() => {
    if (activeAccountId === 'ALL') return orders;
    return orders.filter(o => o.accountId === activeAccountId);
  }, [orders, activeAccountId]);

  // SỔ ĐỐI SOÁT HOÀN TIỀN (Chỉ gồm các đơn Hủy và Trả hàng)
  const refundLedgerEntries = useMemo(() => {
    return accountOrders.filter(o => {
      const isRefundOrCancel = o.status === 'CANCELLED' || o.status === 'REFUNDED' || o.status === 'REFUNDING';
      if (!isRefundOrCancel) return false;

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
      o => o.status === 'CANCELLED' || o.status === 'REFUNDED' || o.status === 'REFUNDING'
    );

    let totalRefundDue = 0; // Tổng số tiền hoàn
    let totalReceived = 0;  // Đã nhận được
    let totalPending = 0;   // Còn phải thu hồi
    let totalDisputed = 0;  // Bị quá hạn/khiếu nại
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
