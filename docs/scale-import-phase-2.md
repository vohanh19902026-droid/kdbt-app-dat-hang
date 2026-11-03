# Kết nối dữ liệu phần mềm cân (giai đoạn sau)

Phần mềm cân hiện chạy offline và lưu dữ liệu trên máy tính cân. Giai đoạn này app đặt hàng không kết nối trực tiếp vào máy cân và không ghi ngược vào phần mềm cân.

## Phương án triển khai

1. Xác định phần mềm cân có thể xuất XLSX/CSV hay có cơ sở dữ liệu cục bộ (SQLite, SQL Server, Access hoặc định dạng riêng).
2. Ưu tiên một tiện ích đồng bộ cài trên máy cân, đọc bản ghi mới và gửi HTTPS tới API đồng bộ riêng của app khi máy có mạng. Nếu nhà cung cấp chỉ hỗ trợ xuất file, dùng luồng tải file cân lên app.
3. Ánh xạ booking, mã khách hàng, thời điểm cân, xe, khối lượng thực tế và số phiếu cân; lưu mã bản ghi nguồn cùng dấu thời gian để chống nhập lặp.
4. Đưa bản ghi vào hàng chờ đối soát. Kế toán/điều phối xem sai lệch, xác nhận rồi mới cập nhật khối lượng thực đổ và sổ liên quan.
5. Ghi nhật ký nguồn, người nhập, thời điểm, sửa sai bằng bút toán/bản ghi điều chỉnh; không sửa/xóa âm thầm dữ liệu cân gốc.

## Thông tin cần khảo sát trước khi bắt đầu

- Tên và phiên bản phần mềm cân, hệ điều hành máy cân.
- Dữ liệu được lưu ở dạng gì, vị trí file/database, cấu trúc cột và ví dụ đã ẩn thông tin nhạy cảm.
- Cách nhận diện một chuyến/phiếu duy nhất và booking tương ứng.
- Máy cân có mạng nội bộ/Internet ổn định không; có cho phép cài tiện ích hay chỉ được xuất file.
- Ai duyệt sai lệch giữa khối lượng đặt, cân xe vào/ra và khối lượng giao.
