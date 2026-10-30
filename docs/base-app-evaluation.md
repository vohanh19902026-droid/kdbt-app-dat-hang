# Đánh giá nền và lựa chọn tái sử dụng

## Nền runtime được chọn

`zexahq/better-auth-starter` (MIT) làm tham khảo/nền cho xác thực, quản lý tài khoản, Drizzle/PostgreSQL và Next.js. Những thành phần nghiệp vụ chung này phù hợp với Vercel + Neon. Giữ thông báo MIT trong `LICENSE-ZEXA`; phần ứng dụng hiện tại đã được tinh gọn thành cấu trúc Next.js app router.

## Nghiệp vụ RMC được đối chiếu

`jajulasandeep583/midhuna-rmc` (MIT) mô tả các khái niệm RMC hữu ích như đơn bê tông, kế hoạch đổ, phân xe trộn, điều phối và khách hàng. Dự án chạy Frappe/ERPNext nên không đưa nguyên runtime vào app này vì không tương thích triển khai Next.js serverless + Neon. Chỉ dùng để đối chiếu các bước nghiệp vụ; không sao chép mã nguồn của nó.

Một số repository RMC khác được xem xét nhưng không dùng vì không thấy license cho phép tái sử dụng. Tham khảo là dùng đúng phạm vi, không đưa code không rõ quyền vào sản phẩm.

## Vì sao giữ nền nhỏ và viết riêng nghiệp vụ

- Auth, role, Postgres adapter và ORM là phần phổ thông: dựa vào starter MIT thay vì tự xây.
- Mã booking tăng tự động, trạng thái duyệt, phân quyền sales chỉ xem đơn của mình, nhật ký chỉnh sửa, lưới Tabulator theo mẫu vận hành và workbook ExcelJS là đặc thù CENCOM: triển khai riêng trong `src/`.
- Không đưa module kho, công thức phối liệu, vận đơn, thu tiền, nhà cung cấp hoặc quản lý nhà máy từ ERPNext/RMC vào bản thử vì hiện chưa nằm trong luồng đã yêu cầu.
- Công nợ kế toán chỉ được giữ vai trò và vị trí menu; chưa có nghiệp vụ giả lập để tránh lưu số liệu tài chính sai.

## Tài liệu nguồn

- [Better Auth Starter (MIT)](https://github.com/zexahq/better-auth-starter)
- [Midhuna RMC (MIT)](https://github.com/jajulasandeep583/midhuna-rmc)
- [Next.js authentication](https://nextjs.org/docs/app/guides/authentication)
- [Drizzle ORM: Neon/PostgreSQL](https://orm.drizzle.team/docs/connect-neon)
- [Tabulator](https://www.tabulator.info/docs/6.x/react/)
- [ExcelJS](https://github.com/exceljs/exceljs)