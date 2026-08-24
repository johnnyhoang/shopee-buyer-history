/**
 * Tiện ích xuất dữ liệu ra file CSV tương thích Microsoft Excel
 */
export const exportToCSV = (orders, accounts, filename = 'so_doi_soat_hoan_tien_shopee.csv') => {
  const getAccountName = (id) => {
    const acc = accounts.find(a => a.id === id);
    return acc ? acc.name : 'Người mua';
  };

  const headers = [
    'STT',
    'Ngày hủy/trả hàng',
    'Tài khoản người mua',
    'Mã đơn hàng',
    'Tên Shop',
    'Nội dung sản phẩm',
    'Loại đơn',
    'Số tiền thanh toán (VNĐ)',
    'Số tiền hoàn lại (VNĐ)',
    'Phương thức hoàn tiền',
    'Trạng thái Shopee',
    'Đối soát nhận tiền',
    'Ngày nhận tiền',
    'Ghi chú đối soát'
  ];

  const rows = orders.map((ord, idx) => {
    const isFinished = ord.refundStatus === 'CONFIRMED_RECEIVED';
    const isDisputed = ord.refundStatus === 'DISPUTED';
    const statusText = isFinished ? 'ĐÃ NHẬN TIỀN' : (isDisputed ? 'QUÁ HẠN / CẦN KHIẾU NẠI' : 'CHƯA NHẬN TIỀN');
    const itemsText = (ord.items || []).map(i => `${i.name} (x${i.quantity})`).join('; ');

    return [
      idx + 1,
      ord.cancelTime ? ord.cancelTime.slice(0, 10) : (ord.orderTime ? ord.orderTime.slice(0, 10) : ''),
      `"${getAccountName(ord.accountId)}"`,
      `"${ord.orderCode}"`,
      `"${ord.shopName || ''}"`,
      `"${itemsText.replace(/"/g, '""')}"`,
      ord.status === 'CANCELLED' ? 'Đã hủy' : 'Trả hàng / Hoàn tiền',
      ord.totalAmount || 0,
      ord.refundAmount || ord.totalAmount || 0,
      `"${ord.paymentMethod || ''}"`,
      ord.refundStatus === 'PENDING' ? 'Đang xử lý' : 'Shopee đã hoàn',
      `"${statusText}"`,
      ord.refundConfirmedAt ? ord.refundConfirmedAt.slice(0, 10) : '',
      `"${(ord.userNote || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
