# Kế hoạch đóng gói Android cho CENCOM

Ngày cập nhật: 03/11/2026

## Kết luận kiến trúc

Ưu tiên tạo **Trusted Web Activity (TWA) bằng Bubblewrap** để đóng gói PWA hiện hữu thành APK. Ứng dụng tiếp tục tải giao diện và nghiệp vụ từ domain HTTPS hiện tại, dùng chung backend, đăng nhập, dữ liệu và Service Worker. Cách này giữ một bộ giao diện cần vận hành, phù hợp khi nhu cầu native hiện tại chủ yếu là cài như ứng dụng và nhận thông báo.

TWA yêu cầu xác minh domain giữa app và website bằng Digital Asset Links. Bubblewrap tạo project Android từ Web Manifest và build APK/AAB. Nếu sau này cần API native sâu (định vị nền liên tục, Bluetooth, quét mã vạch chuyên dụng, tích hợp thiết bị cân qua USB/serial), chuyển sang Capacitor hoặc Android native; không làm hai shell song song ngay từ đầu.

## Trạng thái kiểm tra 04/11/2026

- Web Manifest trên domain Production trả `name` CENCOM, `start_url: /`, `display: standalone`, màu giao diện và icon PNG 192/512; PWA asset test cũng đạt.
- `/.well-known/assetlinks.json` hiện chưa có trong repo và request Production bị chuyển về `/login`, nên Digital Asset Links chưa sẵn sàng cho full-screen TWA. `src/proxy.ts` đã được sửa local để công khai đúng endpoint này; khi chạy build local, URL hiện trả 404 (không redirect) vì file chưa được tạo. Chỉ thêm JSON có `package_name` và SHA-256 fingerprint sau khi chốt applicationId và certificate ký.
- Bubblewrap 1.27.0 `doctor` đạt với JDK 17, Android SDK Platform 36 và Build Tools 36.1.0. Ngày 04/11/2026 đã chấp nhận các SDK package licenses đang chờ bằng prompt tương tác sau khi chủ dự án cho phép. SDK/JDK nằm tại `E:\dev\cencom-android-toolchain`; cấu hình Bubblewrap ở `%USERPROFILE%\.bubblewrap\config.json`. Biến môi trường `ANDROID_HOME`, `ANDROID_SDK_ROOT` và `JAVA_HOME` hiện trỏ tới các đường dẫn không tồn tại, nên lệnh SDK cần thiết lập biến theo phạm vi tiến trình từ cấu hình Bubblewrap; chưa thay đổi biến toàn hệ thống. `adb devices -l` hiện không có thiết bị Android kết nối. Chưa tạo APK hoặc keystore phát hành; giai đoạn Preview/recovery/push và kiểm tra thiết bị vẫn là cổng trước khi đóng gói.

## Giai đoạn thực hiện

| Giai đoạn | Việc cần làm | Điều kiện hoàn tất |
| --- | --- | --- |
| 0. Khóa phát hành web | Đưa code đã kiểm tra lên nhánh Preview; gắn Preview DB riêng, chạy migration/UAT; xác minh Production backup/restore và rollback | Preview độc lập Production; luồng sales → planner đã đạt; rollback có thể thực hiện |
| 1. Kiểm tra PWA | Xác minh manifest, icon 192/512, start URL, scope, HTTPS, Service Worker, offline fallback, login và responsive | Lighthouse/PWA checks đạt trên domain Production; không có redirect ra ngoài scope ngoài ý muốn |
| 2. Định danh Android | Chọn `applicationId` ổn định (đề xuất `vn.cencom.dispatch` sau khi kiểm tra chưa bị dùng), tên hiển thị CENCOM, icon/splash, màu thanh hệ thống, versionCode/versionName | Các định danh được chủ sản phẩm duyệt và ghi vào `twa-manifest.json` |
| 3. Sinh TWA | Cài Bubblewrap/Android SDK, khởi tạo từ Web Manifest Production, cấu hình Digital Asset Links, build debug APK | APK cài được trên Android; domain mở full-screen khi xác minh DAL thành công |
| 4. Thông báo | Dùng Web Push hiện tại với VAPID; kiểm tra permission, lưu subscription theo user/device, nội dung không chứa dữ liệu nhạy cảm; kiểm thử khi foreground/background/app đóng | Thiết bị thật nhận đúng thông báo booking mới và booking được duyệt; click mở đúng booking sau login |
| 5. Ký và phân phối | Tạo keystore phát hành, lưu ngoài Git trong kho bí mật có backup; ký APK; tạo AAB nếu phát hành Play; tạo track nội bộ/closed test | Cài/cập nhật được từ đúng nguồn; mất keystore không xảy ra; quyền truy cập bản thử được giới hạn |
| 6. Vận hành | Versioning, release notes, CI build artifact, kiểm tra crash/analytics, quy trình cập nhật và rollback web/API | Mỗi bản Android trỏ tới web release tương thích và có người chịu trách nhiệm phát hành |

## Phụ thuộc và quyết định

- Máy build TWA dùng Bubblewrap CLI 1.27.0; hướng dẫn Bubblewrap hiện yêu cầu JDK 17. Không dùng giả định JDK 21 từ ghi chú cũ cho đến khi phiên bản Bubblewrap mới xác nhận hỗ trợ. Android SDK cần cài platform và build-tools qua SDK Manager; phải hoàn tất giấy phép SDK theo quy trình máy build trước khi cài package.
- Nếu đổi sang Capacitor, Capacitor 8 có yêu cầu Android Studio/Node/SDK riêng; xác minh lại trong tài liệu Capacitor tại thời điểm bắt đầu thay vì áp yêu cầu đó cho TWA/Bubblewrap.
- TWA/Bubblewrap cần domain website do mình sở hữu, Web Manifest hợp lệ, Chrome/Android để test và file `/.well-known/assetlinks.json` chứa fingerprint chứng thư ký.
- Chứng thư ký APK phải được giữ bí mật và backup có kiểm soát. Không commit keystore, mật khẩu, `google-services.json`, private VAPID key hoặc dữ liệu tài khoản vào Git.
- TWA phù hợp với đăng nhập web và Web Push theo origin. Nếu phát hiện yêu cầu phải nhận FCM native độc lập với Chrome/TWA hoặc chạy tác vụ native nền, đánh giá lại Capacitor; lúc đó cần Firebase project, `google-services.json`, FCM token endpoint và quy trình thu hồi token.
- Android 13 trở lên cần xin quyền POST_NOTIFICATIONS; kiểm tra hành vi trên nhiều phiên bản Android và chính sách tiết kiệm pin của hãng máy.

## Ma trận nghiệm thu Android

1. Cài APK sạch và cập nhật từ APK cũ; xác nhận không mất dữ liệu server.
2. Đăng nhập NVKD, tạo booking; đăng xuất/đăng nhập kế hoạch và xác nhận booking.
3. Kiểm tra push khi app đang mở, chạy nền, đã đóng; kiểm tra từ chối/cấp lại quyền notification.
4. Chạm notification để mở đúng trang; session hết hạn phải dẫn về login rồi quay lại đúng booking.
5. Kiểm tra mạng yếu/mất mạng, chế độ xoay màn hình, bàn phím và form dài.
6. Cài trên ít nhất 2 thiết bị Android thật với phiên bản OS khác nhau; lưu log và kết quả.
7. Kiểm tra chữ ký, version, Digital Asset Links, không có secret trong APK/repo và link tải chỉ chia sẻ cho nhóm UAT.

## Ước lượng

Sau khi Preview, Production release gates, domain Digital Asset Links và thiết bị Android sẵn sàng: khoảng **2–4 ngày công** cho TWA/APK, kiểm thử và tài liệu cài đặt nội bộ. Phát hành Play Store cần thêm thời gian cho tài khoản nhà phát triển, metadata, chính sách và review; chưa tính vào ước lượng này.

## Nguồn kỹ thuật

- [Chrome Developers: TWA Quick Start](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start)
- [Chrome Developers: TWA overview](https://developer.chrome.com/docs/android/trusted-web-activity)
- [Capacitor: Android environment setup](https://capacitorjs.com/docs/getting-started/environment-setup)
- [Capacitor: Push notifications with Firebase](https://capacitorjs.com/docs/guides/push-notifications-firebase)
