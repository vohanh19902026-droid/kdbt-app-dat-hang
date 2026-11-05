# Hướng dẫn sử dụng CENCOM

Tài liệu dành cho người dùng CENCOM Đặt hàng và Điều phối bê tông. Hệ thống tự hiển thị menu theo vai trò được Admin cấp.

## 1. Bắt đầu

1. Mở [CENCOM Production](https://kdbt-app-dat-hang-five.vercel.app) bằng trình duyệt; đăng nhập bằng email và mật khẩu công ty do Admin cấp.
2. Khi đăng nhập lần đầu, đổi mật khẩu tạm bằng nút **Đổi mật khẩu** ở cuối menu bên trái. Trên điện thoại, mở menu tên tài khoản. Mật khẩu mới cần ít nhất 10 ký tự. Đổi mật khẩu sẽ đăng xuất các thiết bị khác.
3. Để kết thúc phiên làm việc, chọn **Đăng xuất**.

Chỉ dùng tài khoản cá nhân. Nếu quên mật khẩu hoặc không thấy chức năng cần thiết, liên hệ Admin; không dùng chung tài khoản giữa nhiều người.

### Vai trò và phạm vi

| Vai trò | Công việc chính |
| --- | --- |
| **Kinh doanh (NVKD)** | Tạo booking, xem booking của mình, theo dõi lịch cấp và công nợ khách hàng được giao; ghi nhận tiền đã thu. |
| **Kế hoạch** | Tiếp nhận booking, xác nhận, xếp lịch và phương tiện, cập nhật cấp hàng; xem báo cáo và danh mục khách hàng. |
| **Kế toán** | Theo dõi sổ công nợ, ghi phải thu/đã thu, phân công NVKD phụ trách và bổ sung hạng mục đổ cho booking. |
| **Kỹ thuật** | Quản lý các lựa chọn kỹ thuật: mác bê tông, cát, đá và loại xe bơm. |
| **Admin** | Quản trị tài khoản, dữ liệu khách hàng, cài đặt và danh mục; có quyền điều phối, xem báo cáo và làm nghiệp vụ công nợ. |

## 2. Quy trình booking từ đầu đến cuối

### NVKD: tạo booking

1. Mở **Đơn đặt bê tông** → **Tạo booking**.
2. Chọn khách hàng có sẵn. Nếu là khách mới, chọn **Tạo khách hàng mới** rồi nhập tên. Khách mới được gắn với tài khoản NVKD tạo booking.
3. Điền địa chỉ công trình, khối lượng, mác bê tông, ngày/giờ cần cấp, loại cát và loại đá. Các trường có dấu * là bắt buộc. Có thể bổ sung người/điện thoại liên hệ, xe bơm, sức chở, hạng mục đổ, hình thức đổ, loại công trình và ghi chú.
4. Chọn **Gửi lệnh đặt hàng**. Hệ thống cấp mã booking; booking mới ở trạng thái **Chờ duyệt**.
5. Tìm booking bằng ô tìm kiếm hoặc lọc ngày/trạng thái. NVKD chỉ xem booking do mình tạo. Nhấn mã booking để xem lịch sử thay đổi.

Kiểm tra ngày, giờ, địa chỉ và khối lượng trước khi gửi. Nếu gửi xong mà chưa thấy thông báo thành công, tải lại danh sách và kiểm tra mã booking trước khi tạo lại để tránh trùng đơn.

### Kế hoạch/Admin: tiếp nhận và xác nhận

1. Mở **Nhận đơn hàng**, chọn ngày cần xử lý. Danh sách này chỉ hiện booking **Chờ duyệt** của ngày đã chọn.
2. Kiểm tra khách hàng, công trình, khối lượng và yêu cầu cấp. Có thể bấm mã booking để xem lịch sử.
3. Trong ô **Trạng thái**, chuyển **Chờ duyệt** sang **Đã xác nhận**. Thay đổi được lưu khi kết thúc chỉnh sửa ô; đợi thông báo đã lưu.
4. Booking đã xác nhận được chuyển sang **Bảng kế hoạch cấp hàng** để xếp lịch.

### Kế hoạch/Admin: xếp lịch và cập nhật cấp hàng

1. Mở **Bảng kế hoạch**, chọn ngày cấp. Booking đã duyệt sẽ hiển thị theo ngày kế hoạch (nếu chưa xếp thì theo ngày yêu cầu).
2. Bấm vào ô cần cập nhật để sửa trực tiếp. Có thể cập nhật giờ xuất phát, giờ đổ, phương tiện, xe/chuyến, khối lượng, vật liệu, bơm, người liên hệ, hạng mục đổ và ghi chú kế hoạch.
3. Trước khi chuyển sang **Đã xếp lịch**, nhập giờ xuất phát, giờ đổ và phương tiện. Giờ đổ phải bằng hoặc sau giờ xuất phát.
4. Khi xe bắt đầu cấp, chuyển trạng thái sang **Đang cấp**; sau khi hoàn tất, cập nhật **Khối lượng thực đổ** rồi chuyển sang **Hoàn thành**.
5. Dùng bộ lọc trạng thái, ô tìm kiếm và nút tải lại để rà danh sách. Chọn **Xuất XLSX** để tải kế hoạch của ngày đang xem.

Các trạng thái đi theo thứ tự: **Chờ duyệt → Đã xác nhận → Đã xếp lịch → Đang cấp → Hoàn thành**. Có thể hủy đơn trước khi bắt đầu cấp. Đơn **Hoàn thành** hoặc **Đã hủy** là trạng thái kết thúc. Mỗi lần sửa được ghi vào lịch sử booking.

Nếu hệ thống báo đơn vừa được người khác cập nhật, tải lại bảng, kiểm tra giá trị mới nhất rồi mới sửa tiếp; không nhập lại theo dữ liệu cũ.

## 3. Hướng dẫn theo vai trò

### Kinh doanh (NVKD)

- **Đơn đặt bê tông:** tạo booking, xem trạng thái và lịch sử của các booking do mình tạo.
- **Tin báo:** nhận thông báo booking được Kế hoạch/Admin xác nhận hoặc cập nhật. Mở booking từ liên kết trong tin.
- **Công nợ:** chỉ xem khách hàng được giao và ghi nhận khoản **đã thu**. Chọn khách hàng, có thể gắn với booking, nhập số tiền VND, ngày thu, số phiếu/chứng từ và diễn giải rồi chọn **Ghi sổ**. NVKD không ghi khoản phải thu và không tự đổi người phụ trách khách hàng; báo Kế toán/Admin nếu cần điều chỉnh.

### Kế hoạch

- **Nhận đơn hàng** để duyệt booking mới; **Bảng kế hoạch** để xếp lịch, phương tiện và theo dõi cấp hàng.
- Có thể tạo booking khi cần, xem **Tổng hợp sản lượng**, tra cứu danh mục khách hàng và xuất danh sách khách hàng XLSX. Kế hoạch không sửa hồ sơ khách hàng.
- Nhận tin booking mới do NVKD gửi; bật thông báo trong trang **Tin báo** nếu cần nhận tin ngoài ứng dụng trên thiết bị hiện tại.

### Kế toán

- **Công nợ:** chọn khoảng ngày rồi **Lọc**; có thể lọc theo NVKD. Thẻ tổng hợp cho biết phải thu, đã thu trong kỳ và số dư lũy kế.
- Ghi **Ghi tăng khoản phải thu** hoặc **Ghi nhận tiền đã thu** cho khách hàng; liên kết booking tùy chọn. Nhập số tiền nguyên VND, ngày phát sinh và thông tin chứng từ/diễn giải nếu có. Chọn **Ghi sổ** để lưu; **Xuất XLSX** để tải sổ theo khoảng lọc.
- Có thể phân công NVKD cho khách hàng ở bảng số dư và bổ sung **Hạng mục đổ / cấu kiện** cho booking.
- Có thể xem **Tổng hợp sản lượng**. Giao dịch công nợ đã ghi không có chức năng sửa/xóa; nếu ghi sai, tạo bút toán đối ứng đúng nghiệp vụ và báo người phụ trách kế toán.

### Kỹ thuật

- Mở **Danh mục kỹ thuật** để thêm lựa chọn mới cho mác bê tông, cát, đá hoặc loại xe bơm.
- Dùng **Ngừng sử dụng** để ẩn lựa chọn khỏi booking mới; dùng **Khôi phục** để mở lại. Đơn cũ giữ nguyên giá trị lịch sử. Vai trò Kỹ thuật không xóa hẳn mục.

### Admin

- **Tài khoản & phân quyền:** tạo tài khoản với họ tên, email, mật khẩu tạm (ít nhất 10 ký tự) và vai trò; gửi thông tin đăng nhập riêng cho nhân viên. Có thể cập nhật vai trò, hồ sơ, mã nhân viên, điện thoại, bộ phận, mục tiêu tháng; khóa/mở tài khoản; đặt lại mật khẩu. Đặt lại mật khẩu sẽ thu hồi các phiên đăng nhập hiện tại. Không thể khóa tài khoản đang dùng hoặc hạ cấp Admin cuối cùng.
- **Khách hàng:** thêm/sửa hồ sơ, gán NVKD và bật/ngừng hoạt động. Có thể nhập Excel bằng **Nhập XLSX**: tải mẫu, giữ tiêu đề cột, nhập dữ liệu từ dòng 5; mỗi lần tối đa 200 khách và tệp 2 MB. Cần tên khách hàng và email hoặc mã NVKD đang hoạt động. Xem trước lỗi/trùng trước khi nhập; dòng trùng được bỏ qua. Có thể xuất danh mục XLSX.
- **Cài đặt:** chỉnh thông tin doanh nghiệp và giao diện; xem tổng quan kinh doanh, tài khoản, cài đặt danh mục, giám sát hệ thống. Lưu các thay đổi bằng nút **Lưu cài đặt** khi xuất hiện.
- Admin cũng có quyền tiếp nhận/xếp lịch, xem báo cáo, quản lý kỹ thuật và ghi sổ công nợ. Thận trọng khi đổi vai trò hoặc khóa tài khoản vì thay đổi quyền truy cập ngay.

## 4. Tin báo và thông báo trên thiết bị

1. Mở **Tin báo** để xem tối đa 100 tin gần nhất. Số chưa đọc hiện cạnh mục menu.
2. Mở booking từ liên kết trong tin. Chọn **Đánh dấu đã đọc** cho từng tin hoặc **Đánh dấu tất cả đã đọc**.
3. Trong **Thiết lập nhận thông báo**, bật/tắt loại tin phù hợp với vai trò. Có thể chọn tài khoản gửi; để trống lựa chọn người gửi thì nhận từ tất cả tài khoản phù hợp.
   - Admin/Kế hoạch: booking mới cần duyệt từ NVKD.
   - NVKD: kế hoạch/Admin duyệt hoặc cập nhật booking của mình.
4. Để nhận push trên thiết bị đang dùng, chọn **Bật thông báo trên thiết bị này** và cho phép thông báo khi trình duyệt hỏi. Cài đặt push áp dụng riêng từng thiết bị. Muốn dừng, chọn **Tắt thông báo trên thiết bị này**.

Nếu trình duyệt đã chặn quyền thông báo, mở cài đặt quyền của trang trong trình duyệt, cho phép Notifications rồi thử bật lại. Hộp tin trong ứng dụng vẫn dùng được khi push tắt hoặc thiết bị không hỗ trợ.

## 5. Báo cáo và thao tác chung

- **Tổng hợp sản lượng:** Admin, Kế hoạch và Kế toán chọn ngày bắt đầu/kết thúc rồi **Lọc**. Báo cáo hiển thị khối lượng đặt, thực đổ, chênh lệch theo khách hàng và NVKD. Mỗi lần lọc tối đa 92 ngày.
- Trên điện thoại, dùng thanh tab dưới cùng để mở các mục chính theo vai trò. Một số trang quản trị/báo cáo không nằm trên thanh này; hãy mở trên màn hình máy tính hoặc máy tính bảng để dùng menu đầy đủ bên trái.
- Ngày/giờ hiển thị theo múi giờ Việt Nam. Chọn đúng ngày cấp khi xử lý bảng Nhận đơn hoặc Kế hoạch.
- Sau khi sửa bảng, chờ thông báo đã lưu rồi mới rời trang. Nếu mất mạng, tải lại và kiểm tra dữ liệu trước khi gửi lại.

## 6. Khi cần hỗ trợ

- Không đăng nhập được: kiểm tra email, mật khẩu và yêu cầu Admin xác nhận tài khoản còn hoạt động; Admin có thể đặt lại mật khẩu.
- Không thấy menu hoặc nhận thông báo không có quyền: kiểm tra vai trò đang hiển thị ở đầu trang, liên hệ Admin để kiểm tra phân quyền.
- Không lưu được booking/lịch: đọc nội dung báo lỗi. Nếu có thông báo cập nhật đồng thời, tải lại bảng trước khi thao tác tiếp.
- Sai nghiệp vụ khách hàng, công nợ hoặc trạng thái cấp hàng: dừng thao tác tiếp theo và báo Admin/Kế hoạch/Kế toán phụ trách; không tạo bản ghi bù tùy tiện.
