import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { storageService } from '../services/storage';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [accounts, setAccounts] = useState(() => storageService.getAccounts());
  const [orders, setOrders] = useState(() => storageService.getOrders());
  const [activeAccountId, setActiveAccountId] = useState(() => storageService.getActiveAccountId());
  
  // Navigation & Tabs: 'refunds' | 'all-orders' | 'analytics' | 'sync'
  const [activeTab, setActiveTab] = useState('refunds');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refundFilter, setRefundFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL'); // 'ALL' | '7_DAYS' | '30_DAYS' | 'THIS_YEAR'
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleSelectAccount = (id) => {
    setActiveAccountId(id);
    storageService.setActiveAccountId(id);
  };

  // Cập nhật trạng thái đối soát hoàn tiền
  const confirmRefundReceived = (orderId, note) => {
    const updated = storageService.updateRefundStatus(orderId, 'CONFIRMED_RECEIVED', note);
    setOrders(updated);
    showNotification('Đã xác nhận nhận đủ tiền! Kết thúc theo dõi đơn hàng.', 'success');
  };

  const markRefundDisputed = (orderId, note) => {
    const updated = storageService.updateRefundStatus(orderId, 'DISPUTED', note);
    setOrders(updated);
    showNotification('Đã gắn cờ đơn hàng Quá hạn / Cần khiếu nại!', 'warning');
  };

  const resetRefundTracking = (orderId) => {
    const updated = storageService.updateRefundStatus(orderId, 'SHOPEE_REFUNDED');
    setOrders(updated);
    showNotification('Đã đưa đơn hàng về trạng thái tiếp tục theo dõi tiền hoàn.', 'info');
  };

  const saveOrderNote = (orderId, note) => {
    const updated = storageService.updateOrderNote(orderId, note);
    setOrders(updated);
    showNotification('Đã lưu ghi chú cho đơn hàng!', 'success');
  };

  // Nhập dữ liệu đơn hàng
  const importOrders = (incomingOrders, targetAccountId, accountName) => {
    const result = storageService.mergeImportedOrders(incomingOrders, targetAccountId, accountName);
    setOrders(result.allOrders);
    setAccounts(result.allAccounts);
    showNotification(`Đã đồng bộ thành công! (+${result.newCount} đơn mới, cập nhật ${result.updatedCount} đơn)`, 'success');
    return result;
  };

  // Khôi phục dữ liệu mẫu
  const resetSampleData = () => {
    const result = storageService.resetToSampleData();
    setAccounts(result.accounts);
    setOrders(result.orders);
    setActiveAccountId('ALL');
    showNotification('Đã khôi phục lại dữ liệu mẫu Shopee ban đầu!', 'info');
  };

  // Quản lý tài khoản
  const addAccount = (name, username, phone, color = 'indigo') => {
    const newAcc = {
      id: `acc_${Date.now()}`,
      name: name || 'Tài khoản Shopee mới',
      username: username || '',
      phone: phone || '',
      color,
      createdAt: new Date().toISOString(),
    };
    const updated = [...accounts, newAcc];
    setAccounts(updated);
    storageService.saveAccounts(updated);
    showNotification(`Đã thêm tài khoản: ${newAcc.name}`, 'success');
    return newAcc;
  };

  const updateAccount = (id, fields) => {
    const updated = accounts.map(a => a.id === id ? { ...a, ...fields } : a);
    setAccounts(updated);
    storageService.saveAccounts(updated);
    showNotification('Đã cập nhật thông tin tài khoản!', 'success');
  };

  const deleteAccount = (id) => {
    const updated = accounts.filter(a => a.id !== id);
    setAccounts(updated);
    storageService.saveAccounts(updated);
    if (activeAccountId === id) {
      handleSelectAccount('ALL');
    }
    showNotification('Đã xóa tài khoản!', 'info');
  };

  // Danh sách đơn hàng được lọc theo Tài khoản
  const accountOrders = useMemo(() => {
    if (activeAccountId === 'ALL') return orders;
    return orders.filter(o => o.accountId === activeAccountId);
  }, [orders, activeAccountId]);

  // Danh sách đơn hàng Trả/Hủy để theo dõi Hoàn tiền
  const refundOrders = useMemo(() => {
    return accountOrders.filter(o => {
      const isRefundOrCancel = o.status === 'CANCELLED' || o.status === 'REFUNDED' || o.status === 'REFUNDING';
      if (!isRefundOrCancel) return false;

      // Filter theo trạng thái hoàn tiền
      if (refundFilter === 'PENDING_OR_REFUNDED') {
        return o.refundStatus === 'PENDING' || o.refundStatus === 'SHOPEE_REFUNDED';
      }
      if (refundFilter !== 'ALL' && o.refundStatus !== refundFilter) {
        return false;
      }

      // Filter search
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
  }, [accountOrders, refundFilter, searchQuery]);

  // Thống kê tổng quan
  const stats = useMemo(() => {
    let totalSpend = 0;
    let totalOrdersCount = accountOrders.length;
    let completedCount = 0;
    let shippingCount = 0;
    let cancelRefundCount = 0;
    
    let totalRefundAmount = 0;
    let pendingRefundAmount = 0;
    let confirmedRefundAmount = 0;
    let disputedRefundAmount = 0;

    accountOrders.forEach(o => {
      if (o.status === 'COMPLETED') {
        totalSpend += (o.totalAmount || 0);
        completedCount++;
      } else if (o.status === 'SHIPPING' || o.status === 'PROCESSING') {
        shippingCount++;
        totalSpend += (o.totalAmount || 0);
      } else if (o.status === 'CANCELLED' || o.status === 'REFUNDED' || o.status === 'REFUNDING') {
        cancelRefundCount++;
        const refAmt = o.refundAmount || o.totalAmount || 0;
        totalRefundAmount += refAmt;

        if (o.refundStatus === 'CONFIRMED_RECEIVED') {
          confirmedRefundAmount += refAmt;
        } else if (o.refundStatus === 'DISPUTED') {
          disputedRefundAmount += refAmt;
        } else {
          // PENDING hoặc SHOPEE_REFUNDED
          pendingRefundAmount += refAmt;
        }
      }
    });

    return {
      totalSpend,
      totalOrdersCount,
      completedCount,
      shippingCount,
      cancelRefundCount,
      totalRefundAmount,
      pendingRefundAmount,
      confirmedRefundAmount,
      disputedRefundAmount,
      unresolvedRefundsCount: accountOrders.filter(
        o => (o.status === 'CANCELLED' || o.status === 'REFUNDED' || o.status === 'REFUNDING') &&
             o.refundStatus !== 'CONFIRMED_RECEIVED'
      ).length,
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
        statusFilter,
        setStatusFilter,
        refundFilter,
        setRefundFilter,
        dateRange,
        setDateRange,
        accountOrders,
        refundOrders,
        stats,
        selectedOrder,
        setSelectedOrder,
        isAccountModalOpen,
        setIsAccountModalOpen,
        isSyncModalOpen,
        setIsSyncModalOpen,
        notification,
        showNotification,
        confirmRefundReceived,
        markRefundDisputed,
        resetRefundTracking,
        saveOrderNote,
        importOrders,
        resetSampleData,
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
