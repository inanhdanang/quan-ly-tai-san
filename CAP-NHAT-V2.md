# Cập nhật ứng dụng đang dùng lên V2 — giữ dữ liệu

Bạn không cần tạo lại Google Sheets hoặc nhập lại tài sản. Cập nhật phải được thực hiện trên dự án Apps Script đang gắn với file Sheets hiện tại.

## A. Sao lưu trước khi cập nhật

1. Mở Google Sheets đang lưu tài sản.
2. Chọn **Tệp → Tạo bản sao**. Đặt tên “Sao lưu trước V2”.
3. Tiếp tục thao tác trên **file gốc**, giữ bản sao để đối chiếu. Tạm ngưng lập phiếu trong lúc cập nhật.

## B. Lấy và thay mã

1. Trên GitHub bấm **Code → Download ZIP**, giải nén bản mới.
2. Mở **Bat-dau.html** bằng Chrome. Trong danh sách chọn lần lượt từng file → **Sao chép nội dung**.
3. Trên Sheets gốc chọn **Tiện ích mở rộng → Apps Script**.
4. Thay **toàn bộ** nội dung các file sau, không dán nối mã cũ:

   - `Code.gs` ← nội dung Code.gs mới.
   - `Domain.gs` ← nội dung Domain.js mới (đuôi khác là bình thường).
   - `Seed.gs` ← nội dung Seed.gs mới. Chỉ thay file, **không chạy seedDemo**.
   - `Index.html` ← nội dung Index.html mới.
   - `QR.html` ← nội dung QR.html mới (thư viện QR đã đóng gói).

5. Manifest `appsscript.json` vẫn dùng cấu hình cung cấp. Nếu chưa thấy: bấm bánh răng **Cài đặt dự án** → tích **Hiển thị tệp kê khai appsscript.json trong trình chỉnh sửa** → quay về trình chỉnh sửa → thay bằng manifest trong bộ mã.
6. Lưu toàn bộ. Đảm bảo không còn dấu báo lỗi cú pháp.

## C. Nâng cấp cấu trúc dữ liệu

1. Ở ô chọn hàm trên thanh công cụ, chọn **setup**.
2. Bấm **Chạy**. Nếu Google hỏi quyền, kiểm tra đúng dự án của bạn rồi cấp quyền phù hợp.
3. Chờ **Đã hoàn tất quá trình thực thi**.
4. `setup` kiểm tra tiêu đề cũ, thêm cột ở cuối và tab mới; không xóa tài sản/nhân viên/phiếu hiện có.
5. **Không chạy seedDemo.** Dữ liệu mẫu chỉ được nạp ở file còn trống.

Nếu báo “Tab ... có cấu trúc khác”, dừng ở đây và gửi nguyên thông báo lỗi. **Không xóa tab, không đổi tiêu đề mò để ép chạy.**

## D. Cập nhật bản triển khai đang dùng

1. Bấm **Triển khai → Quản lý bản triển khai**.
2. Chọn bản ứng dụng web đang dùng.
3. Bấm biểu tượng **bút chì**.
4. Mục **Phiên bản**, chọn **Phiên bản mới**.
5. Ghi mô tả “V2 — giao diện và vòng đời tài sản”.
6. Giữ **Thực thi: Tôi**, **Ai có quyền truy cập: Chỉ mình tôi**.
7. Bấm **Triển khai**.
8. Mở lại URL `/exec` hiện có. Dùng **Ctrl + Shift + R** nếu trình duyệt còn giữ trang cũ.

Không cần tạo bản triển khai mới nếu muốn giữ URL/QR hiện tại. Lưu mã mà không tạo phiên bản triển khai mới thì URL `/exec` có thể vẫn chạy bản cũ.

## E. Kiểm tra sau nâng cấp

1. Dashboard có biểu đồ tròn và danh sách việc cần xử lý.
2. Bấm tên một tài sản cũ: trang hai cột, QR, lịch sử và các thao tác theo trạng thái.
3. Đối chiếu mã, tên, giá, ngày giờ mua, người giữ và một phiếu cũ với bản sao.
4. Mở Cài đặt: kiểm tra tên cơ sở và điền URL `/exec` đang dùng. Lưu để QR mở đúng trang tài sản.
5. Mở link QR trên điện thoại đăng nhập cùng Gmail. Không đổi quyền truy cập thành công khai để sửa lỗi đăng nhập.
6. Dùng tài sản thử kiểm tra cấp phát → thu hồi, hoặc cho mượn → trả. Kiểm tra dòng ghi trong Google Sheets.
7. Thử lưu một biên bản PDF trên Drive và một bản xuất Excel. Đây là bước xác minh dịch vụ Google thật; kiểm thử tự động trước đó dùng giả lập.
8. Muốn bật email, vào Cài đặt → chọn email/giờ → bật gửi hằng ngày → Lưu. Chỉ bật khi địa chỉ nhận đã đúng. Trigger của Google gửi trong khoảng giờ chọn, không đúng từng phút.

Bạn có thể tắt email trong Cài đặt. Mọi file PDF/ảnh và báo cáo xuất ra Drive mặc định không được ứng dụng chia sẻ công khai.

## Nếu ứng dụng kẹt ở “Đang tải dữ liệu…”

Bản vá sau V2 tải dữ liệu ngay, không chờ bước đọc tham số URL; có thông báo lỗi khởi động và thời gian chờ. Bản vá không đổi cấu trúc dữ liệu.

1. Thay **Index.html** và **Code.gs** bằng bản mới nhất trên GitHub. Lưu.
2. Chọn hàm **diagnose → Chạy**. Hàm này chỉ đọc dữ liệu, không tạo mẫu hoặc xóa dữ liệu. Nhật ký sẽ ghi số lượng tài sản/nhân viên/giao dịch và thời gian đọc, không in nội dung riêng tư.
3. Nếu báo thiếu tab/cột, chạy **setup** để nâng cấp cấu trúc, rồi chạy diagnose lại. Không chạy seedDemo.
4. Nếu diagnose báo kết nối thành công, cập nhật **Quản lý bản triển khai → bút chì → Phiên bản mới → Triển khai**. Mở lại URL /exec, Ctrl+Shift+R.
5. Nếu vẫn không tải được, chụp thông báo mới trên trang và mục **Lần thực thi** của Apps Script (biểu tượng đồng hồ bên trái), mở lượt gọi getData/diagnose mới nhất. Không gửi mật khẩu/token hoặc toàn bộ dữ liệu tài sản.

Thông báo mới giúp phân biệt lỗi giao diện, thiếu cấu trúc, quyền truy cập và Google xử lý chậm. Chưa thể kết luận nguyên nhân trên tài khoản thật chỉ từ vòng quay tải ban đầu.


## Bản vá 2.0.2: diagnose thành công nhưng giao diện báo SyntaxError

Nếu nhật ký đã ghi kết nối thành công (có số lượng tài sản/nhân viên), dữ liệu phía máy chủ đọc được. Lỗi “Invalid or unexpected token” thuộc mã JavaScript phía trình duyệt; dòng trong trang xuất ra có thể không cùng số dòng với file Index.html trong trình soạn thảo.

Bản 2.0.2 tách toàn bộ mã giao diện khỏi HTML dài. Trình duyệt tải App.js từ một commit cố định trên jsDelivr, kiểm tra SHA-384; HTML mới không có scriptlet nhúng QR và không có các chuỗi HTML dài bên trong JavaScript. Nội dung trên CDN đã được đối chiếu byte với mã nguồn. Kiểm thử trình duyệt dùng cùng nội dung script và kiểm tra integrity; vẫn cần xác minh kết quả trong Web App Google thật.

**Bạn đã chạy diagnose thành công thì chỉ thay một file:**

1. Tải bản GitHub mới nhất, mở Bat-dau.html, chọn **Index.html → Sao chép nội dung**. Hoặc mở Index.html trên GitHub và sao chép toàn bộ file.
2. Trong Apps Script đang dùng, mở **Index.html**, Ctrl+A trong vùng mã rồi dán thay toàn bộ; không dán nối phần cuối. Bản mới khoảng 29 dòng (một số dòng CSS dài), có tên phiên bản **v2.0.2 hoặc mới hơn** ở chân menu.
3. Lưu. **Không cần chạy setup, không chạy seedDemo, không sửa các tab dữ liệu** cho bản vá này. Giữ Code.gs, Domain.gs và dữ liệu đang đọc tốt.
4. **Triển khai → Quản lý bản triển khai → bút chì → Phiên bản mới → Triển khai**. Giữ quyền thực thi Tôi / Chỉ mình tôi và URL hiện có.
5. Mở lại /exec, Ctrl+Shift+R. Kiểm tra chân menu có v2.0.2 hoặc mới hơn. Nếu vẫn thấy lỗi cũ mà chưa có dấu phiên bản này, kiểm tra đã cập nhật đúng bản triển khai.
6. Nếu báo không tải được tệp giao diện, kiểm tra trình duyệt có truy cập được cdn.jsdelivr.net không; không tắt kiểm tra TLS/integrity. Nếu có lỗi mới, chụp nguyên thông báo.

Không cần dán App.js vào Apps Script hoặc thay appsscript.json. Mã trên CDN là mã giao diện công khai, không chứa dữ liệu/khóa tài khoản của bạn. Dữ liệu vẫn được lấy từ Apps Script của bạn qua google.script.run.


## Giao diện 2.0.3: tăng cỡ chữ, không đổi dữ liệu

1. Mở Index.html mới nhất trên GitHub (hoặc chọn Index.html trong Bat-dau.html mới).
2. Trong Apps Script đang dùng, thay toàn bộ nội dung Index.html rồi Lưu.
3. Triển khai → Quản lý bản triển khai → bút chì → Phiên bản mới → Triển khai.
4. Mở lại /exec, Ctrl+Shift+R. Chân menu có **v2.0.3**.

Không chạy setup, seedDemo hoặc thay các tab dữ liệu cho riêng bản cập nhật cỡ chữ này. Chữ ô nhập 15 px trên máy tính và 16 px trên điện thoại; nhãn 14 px; chữ phụ được làm rõ màu, biểu mẫu máy tính rộng 640 px, điện thoại xếp ô nhập thành một cột. Bộ JavaScript khóa ở bản đã kiểm tra trước đó, không thay đổi nghiệp vụ hay quyền Google.


## Cỡ chữ tùy chọn — 2.0.4

Thay toàn bộ **Index.html** bằng bản mới, lưu rồi vào **Triển khai → Quản lý các bản triển khai → Chỉnh sửa → Phiên bản mới → Triển khai**. Mở lại đường dẫn ứng dụng. Chọn **Cỡ chữ** ở thanh đầu trang: Nhỏ, Vừa, Lớn hoặc Rất lớn. Lựa chọn áp dụng cả biểu mẫu và được lưu riêng trên trình duyệt nếu cho phép lưu trữ. Không cần chạy setup hoặc seedDemo.
