# 🤝 KTX Share Hub

**KTX Share Hub** là một nền tảng web hiện đại giúp sinh viên trong Ký túc xá dễ dàng chia sẻ, cho thuê và mượn đồ dùng cá nhân (như nồi lẩu, máy sấy, sách vở, v.v.). Dự án hướng tới việc xây dựng một cộng đồng sinh viên gắn kết, tiết kiệm chi phí và tối ưu hóa tài nguyên sẵn có.

---

##  Tính năng nổi bật

###  Dành cho Sinh viên (Người dùng)
* **Xác thực an toàn:** Đăng nhập/Đăng ký nhanh chóng bằng Số điện thoại (10 số) hoặc Email nội bộ trường (`@dau.edu.vn`).
* **Khám phá đồ dùng:** Tìm kiếm và lọc sản phẩm theo danh mục (Gia dụng, Học tập, Giải trí).
* **Giỏ hàng & Thuê đồ:** Thêm đồ vào giỏ, xem tổng chi phí (tiền thuê + tiền cọc) và gửi yêu cầu thuê trực tiếp đến chủ đồ.
* **Quản lý đơn hàng:** Theo dõi trạng thái đơn thuê (Chờ duyệt, Đang thuê, Đã trả đồ).
* **Đánh giá & Báo cáo:** Hệ thống đánh giá sao (Rating) cho chủ đồ sau khi giao dịch hoàn tất và tính năng báo cáo vi phạm (Report) để bảo vệ quyền lợi.
* **Thông báo Real-time:** Nhận thông báo đẩy (chuông) ngay khi đơn hàng chuyển trạng thái.

###  Dành cho Chủ đồ (Seller)
* **Đăng tin cho thuê:** Tự do đăng tải hình ảnh, mô tả, giá thuê và tiền cọc cho các món đồ không dùng đến.
* **Ghim bài (Promote):** Tính năng trả phí để ghim bài lên top, tăng độ hiển thị.
* **Quản lý kho đồ:** Theo dõi tình trạng các món đồ (Đang rảnh, Đang cho thuê, Chờ duyệt).

### Dành cho Ban quản lý (Admin)
* **Bảng điều khiển (Dashboard):** Thống kê trực quan số lượng người dùng, bài đăng, giao dịch và doanh thu sàn.
* **Kiểm duyệt nội dung:** Duyệt hoặc từ chối các bài đăng mới để tránh lừa đảo.
* **Quản lý giao dịch & Giải quyết khiếu nại:** Cập nhật trạng thái đơn hàng và xử lý các báo cáo vi phạm từ sinh viên.
* **Quản lý thành viên:** Theo dõi độ uy tín (đánh giá sao) và khóa tài khoản các cá nhân vi phạm.
* **Kế toán:** Xuất dữ liệu doanh thu, giao dịch ra file Excel (.csv) chỉ với 1 cú click.

---

## Công nghệ sử dụng

* **Giao diện (Frontend):** HTML5, CSS3 (Thiết kế Flexbox/Grid, phong cách Glassmorphism UI hiện đại, đáp ứng tốt trên cả Mobile và PC), Vanilla JavaScript.
* **Cơ sở dữ liệu (Backend/BaaS):** Firebase Realtime Database (Xử lý lưu trữ dữ liệu, quản lý trạng thái đồng bộ theo thời gian thực).
* **Icon & Font:** Font Awesome, Google Fonts (Segoe UI / System UI).

---

##  Hướng dẫn cài đặt & Chạy dự án

Vì dự án sử dụng Firebase làm Backend-as-a-Service, bạn không cần cài đặt server cục bộ phức tạp.

1. **Clone repository này về máy:**
   ```bash
   git clone [https://github.com/nguyenvanan13122006-arch/ktx-share-hub.git](https://github.com/nguyenvanan13122006-arch/ktx-share-hub.git)
