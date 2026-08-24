# 🛍️ Shopee Buyer History & Refund Tracker

Ứng dụng quản lý lịch sử đơn mua Shopee đa tài khoản và theo dõi đối soát tiền hoàn trả (đơn hủy / trả hàng hoàn tiền) tự động, an toàn và trực quan.

---

## 🌟 Tính Năng Nổi Bật

1. **Theo Dõi Đơn Trả Hàng & Đã Hủy (Refund Tracker - Trọng tâm):**
   - Tự động tách riêng toàn bộ đơn hủy hoặc trả hàng để đối soát.
   - Thể hiện rõ: Số tiền cần hoàn, phương thức thanh toán ban đầu (Thẻ tín dụng / Ví ShopeePay / Ngân hàng ATM).
   - Nút **"Đã nhận đủ tiền (Kết thúc)"** để đóng đối soát kèm hiệu ứng chúc mừng.
   - Gắn cờ **"Quá hạn / Cần khiếu nại"** khi đơn hàng vượt quá thời gian hoàn tiền thông thường.
   - Ghi chú riêng cho từng đơn hàng (ví dụ: *Đã nhận vào Techcombank ngày 16/08*).

2. **Quản Lý Đa Tài Khoản Người Mua:**
   - Quản lý đồng thời nhiều tài khoản Shopee (của bạn, vợ/chồng, người thân trong gia đình).
   - Bộ lọc nhanh theo từng tài khoản hoặc xem tổng hợp tất cả.
   - Tên hiển thị người dùng thân thiện, trực quan.

3. **Lịch Sử Mua Sắm & Thống Kê Toàn Diện:**
   - Tìm kiếm nhanh theo tên sản phẩm, tên Shop hoặc mã đơn hàng.
   - Lọc theo trạng thái: Hoàn thành, Đang vận chuyển, Chờ thanh toán, Đã hủy, Trả hàng.
   - Báo cáo tổng chi tiêu, tổng tiền hoàn trả và phân tích dòng tiền.

4. **Tự Động Lấy Dữ Liệu Từ Shopee (Không Cần Nhập Tay):**
   - **Cách 1 - Chrome Extension:** Tiện ích mở rộng nằm trong thư mục `extension/`, cài vào Chrome/Edge/Cốc Cốc để quét 1-click.
   - **Cách 2 - Script DevTools Console:** Dán trực tiếp vào Console của trang Shopee đã đăng nhập để tải file JSON tự động.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Khởi chạy Mini App Dashboard:
```bash
# Cài đặt thư viện (nếu chưa cài)
npm install

# Khởi chạy máy chủ phát triển
npm run dev
```
Truy cập địa chỉ hiển thị trên terminal (mặc định: `http://localhost:5173`).

---

### 2. Hướng Dẫn Cài Đặt Chrome Extension Tự Động Lấy Đơn:
1. Mở trình duyệt Google Chrome, Edge hoặc Cốc Cốc.
2. Truy cập: `chrome://extensions/`
3. Bật **Developer mode** (Chế độ dành cho nhà phát triển) ở góc phải phía trên.
4. Bấm nút **Load unpacked** (Tải tiện ích đã giải nén) và chọn thư mục `extension` trong mã nguồn này.
5. Truy cập [shopee.vn](https://shopee.vn) và đăng nhập tài khoản của bạn hoặc người thân.
6. Click vào icon tiện ích trên thanh công cụ trình duyệt -> Bấm **"Bắt đầu quét & Trích xuất"**.
7. Sau khi quét xong, bấm **"Tải file JSON về máy"** -> Kéo thả file này vào Mini App để tự động cập nhật!

---

## 🔒 Cam Kết Bảo Mật & Riêng Tư
- Không yêu cầu mật khẩu Shopee.
- Không gửi bất kỳ dữ liệu nào ra ngoài máy tính của bạn.
- Mọi dữ liệu được xử lý và lưu trữ cục bộ (Local Storage).
