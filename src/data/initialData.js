/**
 * Dữ liệu mẫu ban đầu mô phỏng đơn hàng Shopee thực tế
 */

export const INITIAL_ACCOUNTS = [
  {
    id: 'acc_1',
    name: 'Tài khoản Johnny',
    username: 'johnnyhoang_buyer',
    phone: '098****321',
    color: 'orange',
    isDefault: true,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'acc_2',
    name: 'Tài khoản Vợ (Thảo)',
    username: 'thaovtt_94',
    phone: '090****888',
    color: 'pink',
    isDefault: false,
    createdAt: '2026-02-15T09:30:00Z',
  },
  {
    id: 'acc_3',
    name: 'Tài khoản Em trai',
    username: 'hoang_tech_review',
    phone: '097****654',
    color: 'blue',
    isDefault: false,
    createdAt: '2026-03-01T14:20:00Z',
  }
];

export const INITIAL_ORDERS = [
  {
    id: 'ord_101',
    orderCode: '260815AKKO892',
    accountId: 'acc_1',
    shopName: 'AKKO Official Store VN',
    status: 'CANCELLED',
    statusText: 'Đã hủy',
    orderTime: '2026-08-15T10:30:00+07:00',
    cancelTime: '2026-08-15T11:05:00+07:00',
    totalAmount: 1250000,
    refundAmount: 1250000,
    paymentMethod: 'Thẻ tín dụng (Techcombank Visa)',
    refundStatus: 'SHOPEE_REFUNDED',
    refundConfirmedAt: null,
    userNote: 'Shopee báo hoàn từ 15/08, theo dõi sao kê thẻ kỳ tới (dự kiến 7-14 ngày).',
    cancelReason: 'Thay đổi ý định mua hàng / Đặt nhầm phiên bản switch',
    shippingFee: 30000,
    voucherDiscount: 50000,
    items: [
      {
        id: 'item_1',
        name: 'Bàn phím cơ không dây AKKO 5075B Plus - Dragon Ball Edition (Switch Cream Yellow)',
        imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&q=80',
        quantity: 1,
        price: 1270000,
        modelName: 'Yellow Switch / Wireless'
      }
    ]
  },
  {
    id: 'ord_102',
    orderCode: '260810SNY7311',
    accountId: 'acc_1',
    shopName: 'Sony Audio Official Flagship',
    status: 'REFUNDED',
    statusText: 'Trả hàng / Hoàn tiền thành công',
    orderTime: '2026-08-10T14:20:00+07:00',
    cancelTime: '2026-08-14T09:15:00+07:00',
    totalAmount: 850000,
    refundAmount: 850000,
    paymentMethod: 'Ví ShopeePay',
    refundStatus: 'CONFIRMED_RECEIVED',
    refundConfirmedAt: '2026-08-16T16:45:00+07:00',
    userNote: 'Tiền đã cộng vào số dư Ví ShopeePay lúc 16:40 ngày 16/08. Đã kiểm tra đủ.',
    refundReason: 'Sản phẩm lỗi âm thanh rè bên tai trái khi bật chống ồn',
    shippingFee: 25000,
    voucherDiscount: 40000,
    items: [
      {
        id: 'item_2',
        name: 'Tai nghe chụp tai Bluetooth Sony WH-CH520 - Âm thanh chất lượng cao',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80',
        quantity: 1,
        price: 865000,
        modelName: 'Màu Đen / Bản Quốc Tế'
      }
    ]
  },
  {
    id: 'ord_103',
    orderCode: '260801NKE4412',
    accountId: 'acc_2',
    shopName: 'Sneaker World Vietnam',
    status: 'REFUNDED',
    statusText: 'Trả hàng / Hoàn tiền',
    orderTime: '2026-08-01T08:12:00+07:00',
    cancelTime: '2026-08-06T15:30:00+07:00',
    totalAmount: 680000,
    refundAmount: 680000,
    paymentMethod: 'Thẻ ATM Nội địa (Vietcombank)',
    refundStatus: 'DISPUTED',
    refundConfirmedAt: null,
    userNote: 'Đã hơn 18 ngày chưa nhận được tiền vào tài khoản Vietcombank. Cần gửi email khiếu nại Shopee kèm sao kê.',
    refundReason: 'Giao nhầm size giày (đặt 42 giao 39) và trầy xước đế',
    shippingFee: 35000,
    voucherDiscount: 35000,
    items: [
      {
        id: 'item_3',
        name: 'Giày Thể Thao Sneaker Nam Cổ Thấp Phong Cách Năng Động',
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80',
        quantity: 1,
        price: 680000,
        modelName: 'Size 42 / Màu Trắng Đỏ'
      }
    ]
  },
  {
    id: 'ord_104',
    orderCode: '260822BAS9011',
    accountId: 'acc_1',
    shopName: 'Baseus Official Mall',
    status: 'CANCELLED',
    statusText: 'Đã hủy',
    orderTime: '2026-08-22T21:40:00+07:00',
    cancelTime: '2026-08-22T21:45:00+07:00',
    totalAmount: 1450000,
    refundAmount: 1450000,
    paymentMethod: 'Ví ShopeePay',
    refundStatus: 'PENDING',
    refundConfirmedAt: null,
    userNote: 'Vừa hủy đơn do chọn nhầm cổng sạc. Đang chờ hệ thống Shopee xử lý hoàn tiền.',
    cancelReason: 'Người mua hủy đơn trước khi người bán chuẩn bị hàng',
    shippingFee: 15000,
    voucherDiscount: 30000,
    items: [
      {
        id: 'item_4',
        name: 'Trạm Sạc Nhanh Đa Năng Baseus GaN5 Pro 140W Type-C Laptop & Điện Thoại',
        imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&q=80',
        quantity: 1,
        price: 1465000,
        modelName: '140W GaN5 Pro - Đen'
      }
    ]
  },
  {
    id: 'ord_105',
    orderCode: '260818LOG5520',
    accountId: 'acc_3',
    shopName: 'Logitech G Flagship Store',
    status: 'COMPLETED',
    statusText: 'Giao hàng thành công',
    orderTime: '2026-08-18T11:15:00+07:00',
    totalAmount: 1690000,
    refundAmount: 0,
    paymentMethod: 'Thẻ tín dụng (VPBank Visa)',
    refundStatus: 'NOT_APPLICABLE',
    refundConfirmedAt: null,
    userNote: '',
    shippingFee: 0,
    voucherDiscount: 120000,
    items: [
      {
        id: 'item_5',
        name: 'Chuột Không Dây Gaming Logitech G Pro X Superlight Wireless 63g',
        imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=300&q=80',
        quantity: 1,
        price: 1810000,
        modelName: 'Màu Trắng (White Hero 25K)'
      }
    ]
  },
  {
    id: 'ord_106',
    orderCode: '260820NES6611',
    accountId: 'acc_2',
    shopName: 'Nespresso Boutique VN',
    status: 'SHIPPING',
    statusText: 'Đang vận chuyển',
    orderTime: '2026-08-20T09:00:00+07:00',
    totalAmount: 450000,
    refundAmount: 0,
    paymentMethod: 'Thanh toán khi nhận hàng (COD)',
    refundStatus: 'NOT_APPLICABLE',
    refundConfirmedAt: null,
    userNote: '',
    shippingFee: 20000,
    voucherDiscount: 30000,
    items: [
      {
        id: 'item_6',
        name: 'Set 5 Hộp Viên Nén Cà Phê Nespresso Ispirazione Italiana Đậm Đà',
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80',
        quantity: 1,
        price: 460000,
        modelName: 'Hộp 50 viên mix vị'
      }
    ]
  }
];
