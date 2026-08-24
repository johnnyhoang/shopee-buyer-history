/**
 * Tiện ích định dạng dữ liệu thân thiện với người dùng
 */

export const formatCurrency = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getStatusBadge = (status) => {
  switch (status) {
    case 'COMPLETED':
      return { label: 'Hoàn thành', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'SHIPPING':
      return { label: 'Đang vận chuyển', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'PROCESSING':
      return { label: 'Chờ lấy hàng', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'PENDING_PAYMENT':
      return { label: 'Chờ thanh toán', color: 'bg-orange-50 text-orange-700 border-orange-200' };
    case 'CANCELLED':
      return { label: 'Đã hủy', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'REFUNDING':
    case 'REFUNDED':
      return { label: 'Trả hàng / Hoàn tiền', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    default:
      return { label: status || 'Không xác định', color: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
};

export const getRefundStatusInfo = (status) => {
  switch (status) {
    case 'CONFIRMED_RECEIVED':
      return {
        label: 'Đã nhận đủ tiền (Kết thúc)',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-medium',
        icon: 'CheckCircle2',
        description: 'Bạn đã kiểm tra và xác nhận tiền đã hoàn về tài khoản/thẻ/ví.',
      };
    case 'SHOPEE_REFUNDED':
      return {
        label: 'Shopee đã hoàn (Chờ tiền về)',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-medium animate-pulse',
        icon: 'Clock',
        description: 'Shopee đã duyệt hoàn tiền. Vui lòng kiểm tra sao kê thẻ/ví trong 3-7 ngày làm việc.',
      };
    case 'PENDING':
      return {
        label: 'Đang xử lý hoàn tiền',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 font-medium',
        icon: 'Hourglass',
        description: 'Đơn hàng đang trong quy trình xử lý hủy hoặc thẩm định trả hàng.',
      };
    case 'DISPUTED':
      return {
        label: 'Quá hạn / Cần khiếu nại',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-medium',
        icon: 'AlertTriangle',
        description: 'Đã quá hạn hoàn tiền thông thường nhưng chưa nhận được tiền. Cần liên hệ Shopee hoặc ngân hàng.',
      };
    default:
      return {
        label: 'Chưa có thông tin hoàn tiền',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: 'HelpCircle',
        description: '',
      };
  }
};

/**
 * Chuẩn hóa phương thức thanh toán để đồng bộ 100% giữa Bộ lọc và Bảng hiển thị
 */
export const normalizePaymentMethod = (pm) => {
  if (!pm) return 'SHOPEEPAY';
  const str = String(pm).trim().toLowerCase();
  
  // Nếu là raw string từ script cũ "Ví ShopeePay / Thẻ / Ngân hàng" -> mặc định về SHOPEEPAY
  if (str.includes('ví shopeepay') && str.includes('thẻ') && str.includes('ngân hàng')) {
    return 'SHOPEEPAY';
  }

  if (str === 'card' || str.includes('thẻ') || str.includes('credit') || str.includes('visa') || str.includes('master') || str.includes('ghi nợ')) {
    return 'CARD';
  }
  if (str === 'bank' || str.includes('ngân hàng') || str.includes('atm') || str.includes('chuyển khoản') || str.includes('ibanking') || str.includes('vcb') || str.includes('tcb')) {
    return 'BANK';
  }
  if (str === 'spaylater' || str.includes('trả sau')) {
    return 'SPAYLATER';
  }
  if (str === 'cod' || str.includes('tiền mặt') || str.includes('nhận hàng')) {
    return 'COD';
  }
  return 'SHOPEEPAY';
};

export const PAYMENT_METHODS = [
  { key: 'SHOPEEPAY', label: 'Ví ShopeePay', icon: '👛' },
  { key: 'CARD', label: 'Thẻ tín dụng / Ghi nợ', icon: '💳' },
  { key: 'BANK', label: 'Tài khoản Ngân hàng / ATM', icon: '🏦' },
  { key: 'SPAYLATER', label: 'SPayLater', icon: '⚡' },
  { key: 'COD', label: 'Tiền mặt (COD)', icon: '📦' },
];
