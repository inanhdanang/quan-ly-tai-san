# Quản lý tài sản & vật tư — V2

Ứng dụng cho hộ kinh doanh in ảnh, chạy bằng **Gmail thường + Google Sheets + Google Apps Script**. Không cần mua Google Workspace. Giao diện V2 được dựng lại theo các màn hình nhìn thấy trong video tham khảo: bố cục gọn, dashboard có biểu đồ trạng thái, trang tài sản hai cột, lịch sử dòng thời gian, biểu mẫu bên phải, kiểm kê điện thoại và các tab báo cáo.

**Bản vá 2.0.2 cho lỗi “Invalid or unexpected token”:** nếu `diagnose` đã đọc dữ liệu thành công, chỉ cần thay **Index.html** rồi triển khai **Phiên bản mới**. Không chạy lại demo. Xem mục cuối [CAP-NHAT-V2.md](CAP-NHAT-V2.md).

**Tải:** bấm **Code → Download ZIP** ở đầu trang GitHub. Giải nén, mở **`Bat-dau.html`** bằng Chrome để sao chép từng file.

Đây là bộ mã độc lập, không phải mã nguồn hay file thương mại của tác giả video. Các phần văn bản bị che/không xuất hiện trong video được dựng lại thành mẫu dùng thử; cần kiểm tra trước khi sử dụng biên bản thật.

## Nếu bạn đã cài bản trước: nâng cấp, không tạo lại dữ liệu

Xem hướng dẫn chi tiết [CAP-NHAT-V2.md](CAP-NHAT-V2.md).

1. Sao lưu Google Sheets bằng **Tệp → Tạo bản sao**. Giữ bản cũ để đối chiếu.
2. Trong dự án Apps Script **đang gắn với Sheets đang dùng**, thay toàn bộ nội dung 5 file bằng bản V2:

   | File GitHub | File trong Apps Script |
   |---|---|
   | `Code.gs` | Script `Code.gs` |
   | `Domain.js` | Script `Domain.gs` |
   | `Seed.gs` | Script `Seed.gs` |
   | `Index.html` | HTML `Index.html` |
   | `QR.html` | HTML `QR.html` |

3. Giữ/cập nhật manifest theo `appsscript.json`. Không dán JSON vào `Code.gs`.
4. Lưu → chọn **`setup` → Chạy**. V2 kiểm tra cấu trúc, thêm cột ở cuối và các tab mới, giữ tài sản/nhân viên/phiếu cũ. Nếu tiêu đề khác dự kiến, dừng và báo lỗi, không xóa tab để xử lý.
5. **Không chạy `seedDemo` trên dữ liệu đang dùng.**
6. **Triển khai → Quản lý bản triển khai → bút chì → Phiên bản mới → Triển khai.** Giữ URL `/exec` đang dùng.
7. Mở lại URL, tải lại trang. Trong **Cài đặt**, kiểm tra tên cơ sở và URL `/exec` để QR mở đúng tài sản. Kiểm tra một tài sản cũ và một phiếu cũ trước khi tiếp tục ghi dữ liệu thật.

## Nếu cài lần đầu

1. Tạo Google Sheets trống. Mở **Tiện ích mở rộng → Apps Script**.
2. Tạo 5 file như bảng trên. `Domain.js` trong GitHub được dán vào file Script tên **Domain** — Google tự đặt đuôi `.gs`. Dùng `Bat-dau.html` để sao chép.
3. Trong **Cài đặt dự án**, bật **Hiển thị tệp kê khai appsscript.json trong trình chỉnh sửa**; quay về trình chỉnh sửa, thay nội dung manifest bằng file cung cấp. Múi giờ là `Asia/Ho_Chi_Minh`, runtime V8.
4. Chạy **`setup`**, cấp quyền cho dự án chính bạn tạo.
5. Muốn dữ liệu mẫu: chạy **`seedDemo`** một lần khi dữ liệu còn trống. Có 30 mục (20 sản phẩm vật tư, 6 máy in, 4 tài sản khác), 4 nhân viên, lịch sử bảo trì mẫu. Giá chỉ để thử, không phải báo giá thị trường.
6. **Triển khai → Triển khai mới → Ứng dụng web**. Thực thi: **Tôi**. Quyền truy cập: **Chỉ mình tôi**.
7. Mở URL `/exec`. Không chạy `doGet` từ nút Chạy để sử dụng ứng dụng.

Không cần thêm Thư viện hoặc Dịch vụ nâng cao. Từ 2.0.2, mã giao diện **App.js** được tải qua HTTPS từ jsDelivr, khóa ở một commit GitHub cố định và kiểm tra toàn vẹn SHA-384. Không cần tạo file App.js trong Apps Script. Thư viện MIT **qrcode-generator 1.4.4** cũng tải qua jsDelivr; QR được tính trong trình duyệt, không gửi thông tin tài sản đến dịch vụ tạo QR. `QR.html` giữ lại để tương thích bản cũ, không còn được nhúng vào Index.html mới. Trình duyệt cần truy cập được `cdn.jsdelivr.net`. Không gửi mật khẩu, mã xác minh hoặc token vào chat.

## Các màn hình và nghiệp vụ V2

| Màn hình | Chức năng |
|---|---|
| Bảng điều khiển | Thẻ thống kê gọn, việc cần xử lý, biểu đồ tròn trạng thái, chi phí bảo trì 12 tháng, hoạt động gần đây |
| Tài sản | Tìm kiếm, lọc trạng thái/loại/bộ phận/vị trí, xuất Excel hoặc CSV, thêm/sửa thông tin |
| Chi tiết tài sản | Hai cột, thông tin + khấu hao + lịch sử; bên phải nơi để, QR mở trang, thao tác vòng đời, ảnh riêng tư trên Drive |
| Cấp phát & Mượn trả | Cấp phát nhiều món, điều chuyển, cho mượn/hạn trả, trả tài sản, thu hồi, lập biên bản |
| Sửa chữa & Tình trạng | Báo hỏng, báo thất lạc, gửi sửa và hoàn tất sửa; ghi bảo trì/chi phí/lịch tiếp theo |
| Thanh lý | Ngày/hình thức/lý do, giá thu hồi **mỗi tài sản**, tổng giá trị còn lại và lãi/lỗ ngay trong biểu mẫu; người duyệt/quyết định |
| Kiểm kê | Phạm vi bộ phận/vị trí, số liệu chụp lúc mở đợt, lọc Chưa kiểm/Có vấn đề/Tất cả; ghi nhận Có mặt/Thiếu/Hỏng/Sai vị trí; chốt đợt, biên bản, Excel/CSV |
| Kho vật tư | Khai báo từng sản phẩm/quy cách, nhập/xuất dùng/tồn; giá bình quân di động; chặn xuất âm; tồn tối thiểu |
| Báo cáo | Theo bộ phận, theo loại, khấu hao theo tháng + lịch theo năm, chi phí bảo trì, bảo hành; bộ lọc; Excel/CSV |
| Nhân viên & Danh mục | Nhân viên, loại tài sản, nhóm vật tư, bộ phận, vị trí và nhà cung cấp; tự thêm loại/tiền tố |
| Cài đặt | Nhiều email nhận, giờ gửi, thời gian nhắc, gửi riêng người giữ tài sản, bản sao cho chủ; tự lưu PDF và cấu hình URL QR |

Các thao tác không phù hợp trạng thái không được cho phép: không cấp phát trùng, không trả một tài sản chưa mượn, không cấp phát tài sản đã thanh lý. Khi cho mượn phải có hạn trả hợp lệ. Có thể giao cho **người nhận hoặc bộ phận**; chọn người nhận sẽ tự điền bộ phận/vị trí.

## Cách dùng sáu bước

### 1. Nhập kho

Tài sản → Thêm tài sản. Chọn loại, tên, thương hiệu/model/serial, giá mua, ngày **và giờ mua**, số tháng khấu hao, bảo hành, lịch bảo trì, nơi để. Mã được gợi ý theo loại/nhóm và cấp chính thức khi lưu, không trùng.

- Loại ban đầu: Vật tư `VT`, Máy in `MI`, Khác `KH`.
- Vật tư: nhóm Giấy `GI`, Mực `MU`, Màng mờ `MM`, Viền ảnh `VA`, Ván `VN`, Khung `KG`, Vít `VI`, Móc treo `MT`, Hộp `HO`, Túi zip `TZ`, Túi ni lông `TN`, Vật tư khác `VK`.
- Ví dụ: `VT-GI-0001`, `MI-0001`. Một quy cách/khổ/định lượng là một sản phẩm riêng. Loại thêm mới quản lý theo từng chiếc; sản phẩm tiêu hao đặt trong Vật tư.
- Vật tư sau khi khai báo cần lập phiếu **Nhập kho** để có số lượng. Trường giá mua trên sản phẩm là tham khảo; giá trị tồn lấy từ phiếu nhập/xuất.

### 2. Cấp phát

Mở chi tiết tài sản → Cấp phát, hoặc dùng mục Cấp phát & Mượn trả. Có tìm kiếm, Chọn hết/Bỏ chọn. Chọn nhân viên/bộ phận, vị trí, ngày, tình trạng, người giao và ghi chú. Có thể mở biên bản ngay sau lưu và lưu PDF trên Drive.

### 3. Theo dõi

Mở tên tài sản. Thông tin/khấu hao/lịch sử bên trái, QR và thao tác bên phải. Ngày giờ mua và giá mua **chỉnh sửa được**, lưu lịch sử trước/sau. Mượn có hạn trả, quá hạn vào dashboard và email khi đã bật lịch.

QR chứa URL `/exec?asset=...`, mở đúng trang tài sản trên điện thoại. Web App ở chế độ Chỉ mình tôi thì điện thoại phải đăng nhập đúng Gmail của chủ; QR không công khai thông tin.

Ảnh JPG/PNG/WebP tối đa 5 MB lưu trong Drive chủ sở hữu, không tự chia sẻ. Đổi ảnh giữ file cũ trên Drive để tránh xóa nhầm; có thể dọn thủ công sau khi sao lưu.

### 4. Kiểm kê

Tạo đợt, chọn phạm vi. Số lượng/người giữ/vị trí được chụp tại lúc tạo. Nên tạm ngưng di chuyển tài sản trong khi kiểm.

- Trên điện thoại: bấm Có mặt/Thiếu/Hỏng/Sai vị trí sẽ lưu nhanh. Thiếu mặc định 0 nếu số thực tế vẫn bằng sổ; chỉnh số thực tế và ghi chú rồi bấm **Lưu** để đối chiếu chính xác.
- Trên máy tính: có tùy chọn **Áp dụng ngay khi chọn**; nếu chưa bật, chọn kết quả rồi bấm Lưu.
- “Đánh dấu chưa kiểm là Có mặt” chỉ tác động danh sách đang lọc, tối đa 200 mục/lần, có xác nhận đã kiểm thực tế.
- Chỉ chốt khi đã kiểm hết. Sau chốt không sửa trên giao diện. Lệch số lượng không tự tạo phiếu tăng/giảm kho; chủ hộ đối chiếu trước khi xử lý riêng.

### 5. Thu hồi / Thanh lý

Từ chi tiết tài sản hoặc Cấp phát & Mượn trả. Thu hồi về kho; tài sản đang mượn dùng **Trả tài sản**. Thanh lý chọn hình thức bán lại/hủy/cho tặng, nhập lý do và giá thu hồi mỗi món. Biểu mẫu tính tổng còn lại và lãi/lỗ theo tháng thanh lý. Tài sản đã thanh lý không được cấp phát lại.

### 6. Báo cáo

Chọn tháng. Các tab: Theo bộ phận, Theo loại, Khấu hao, Chi phí bảo trì, Bảo hành.

**Xuất Excel** tạo một bản báo cáo Google Sheets riêng tư trong Drive rồi cung cấp link tải `.xlsx` và link mở bản Sheets. Nếu trình duyệt chặn tải, mở bản Sheets rồi Tệp → Tải xuống → Microsoft Excel. Mỗi lần xuất tạo một bản báo cáo mới; bạn có thể dọn các bản cũ trong Drive. **CSV** tải trực tiếp, có BOM UTF-8 để Excel đọc tiếng Việt.

Báo cáo khấu hao có thể ghi vào tab `KhauHaoThang` để thao tác trên Sheets. Thao tác này thay bảng xuất gần nhất, không xóa dữ liệu nghiệp vụ.

## Khấu hao đã chốt

- Đường thẳng theo tháng, tính **đủ tháng mua**, không chia theo số ngày; giờ mua chỉ để lưu thông tin.
- Ví dụ: giá 24 triệu, 24 tháng, mua 20/10 thì tháng 10 khấu hao 1 triệu, còn 23 triệu.
- Không vượt nguyên giá; tháng cuối bù sai số làm tròn. Giá/ngày mua/số tháng sửa được và tính lại các kỳ trước.
- Tháng thanh lý vẫn tính đủ; sau đó không tăng. Tài sản thanh lý loại khỏi thẻ tổng đang quản lý, vẫn có trong bảng chi tiết.
- Vật tư tiêu hao không khấu hao. Toàn bộ khấu hao là quản lý nội bộ, chưa xác lập chế độ kế toán/thuế áp dụng cho cơ sở.

## Email và PDF

Trong **Cài đặt**, nhập email nhận bằng dấu phẩy/chấm phẩy, chọn giờ Việt Nam, số ngày nhắc. Có thể bật gửi riêng cho người giữ và bản sao cho chủ sở hữu. Khi bật/tắt lịch hoặc đổi giờ rồi bấm Lưu, ứng dụng cập nhật trigger, có thể cần cấp quyền Google lần đầu.

Lịch gửi khoảng giờ đã chọn theo hạn mức Google, không cam kết đúng từng phút. Không có việc thì không gửi; mỗi địa chỉ tối đa một lần/ngày. Nhân viên chỉ nhận các việc của tài sản họ giữ. Báo cáo nhận chung chỉ gửi đến danh sách cấu hình/chủ sở hữu. Trigger chạy trên Google, không cần mở ứng dụng liên tục.

PDF lưu riêng tư, link ghi cùng phiếu. Tùy chọn tự lưu có thể bật chung và thay đổi ở từng phiếu. Nếu Drive lỗi, giao dịch đã ghi vẫn giữ và ứng dụng báo chưa lưu PDF; mở biên bản rồi bấm Lưu vào Drive để thử lại. Bản in có vùng ký tay hai bên, **không phải chữ ký số**.

## Dữ liệu và quyền truy cập

Các tab cũ giữ nguyên; V2 chỉ thêm cột và các tab mới:

`TaiSan`, `LoaiTaiSan`, `NhomSanPham`, `NhanVien`, `GiaoDich`, `DotKiemKe`, `ChiTietKiemKe`, `LichSu`, `BaoTriBaoHanh`, `CauHinh`, `KhauHaoThang`, `MauBieu`, `PhongBan`, `ViTri`, `NhaCungCap`, `YeuCau`, `ThuNhac`.

`GiaoDich` lưu mỗi tài sản là một dòng, chung `requestId` là cùng phiếu. `YeuCau` lưu mã chống trùng và kế hoạch khôi phục phiếu nếu dịch vụ bị gián đoạn. `ThuNhac` ghi ngày/địa chỉ đã nhận để hạn chế gửi trùng. Không xóa/chỉnh các tab này thủ công. Nếu đang có phiếu lỗi, nên thử lại hoặc làm mới, đối chiếu dữ liệu trước khi lập phiếu mới.

Ứng dụng dùng một tài khoản chủ sở hữu. Danh sách 4 nhân viên là người giữ tài sản, chưa phải 4 tài khoản đăng nhập/phân quyền. Không chia sẻ mật khẩu Gmail hay triển khai công khai để thay cho phân quyền.

Các giới hạn còn lại:

- Tồn kho là số hiện tại, chưa có đóng sổ/tồn lịch sử; xuất theo bình quân tại lúc ghi. Không có sửa/xóa phiếu kho, nhập trả hoặc tự điều chỉnh theo kiểm kê.
- Không ghi lùi phiếu trước lần biến động gần nhất; không dùng phiếu tương lai làm dự trù vì trạng thái đổi ngay khi ghi.
- Bộ phận trong báo cáo là phân công **hiện tại**, không tái dựng lịch sử cơ cấu bộ phận tại từng kỳ. Bảo hành/nhắc việc tính theo ngày hiện tại.
- Chỉ cập nhật qua ứng dụng; chỉnh trực tiếp Sheets không có lịch sử ứng dụng và có thể làm sai cấu trúc.
- Gmail/Apps Script/Drive có hạn mức, cần cấp quyền Google; chưa đo tải lớn hay nhiều người đồng thời.
- Google Sheets không là cơ sở dữ liệu giao dịch đầy đủ. Phiếu tài sản có kế hoạch phục hồi khi ghi gián đoạn; sao lưu vẫn cần thiết, nhất là khi chỉnh trực tiếp dữ liệu hoặc gặp lỗi dịch vụ kéo dài.

## Sao lưu và kiểm chứng

Sao lưu Sheets: **Tệp → Tạo bản sao**. PDF/ảnh nằm trong các thư mục Drive “Quản lý tài sản — Biên bản”, “Quản lý tài sản — Ảnh”, không được gói trong bản sao Sheets. Nếu khôi phục trên bản sao, mở dự án gắn bản sao, chạy `setup` để cập nhật `SHEET_ID`, kiểm tra URL Web App và các thư mục Drive rồi triển khai mới. Trigger phải áp dụng lại trên dự án mới.

Kiểm thử cục bộ:

```bash
node --test tests/*.test.cjs
```

**33 kiểm thử**: nghiệp vụ cũ, nâng cấp V1→V2 giữ dữ liệu, mượn/trả, cấp phát bộ phận, báo hỏng/sửa chữa, thanh lý/lãi lỗ, khôi phục phiếu bị lỗi ghi, email nhiều người và đúng phạm vi, chống gửi lặp, PDF, ảnh, phạm vi kiểm kê, ghi nhận hàng loạt, link xuất XLSX và gợi ý mã.

Kiểm tra trình duyệt Chromium với backend Google giả lập:

```bash
npm install --prefix /tmp/asset-browser playwright-core
node tests/browser.cjs
```

Có kiểm tra thêm/sửa giao diện, cấp phát, tìm kiếm/chọn nhiều, thanh lý/preview/biên bản, 5 tab báo cáo, CSV và liên kết Excel, kiểm kê nhanh/ghi chú/lọc trên điện thoại, menu mobile và QR mở trực tiếp đúng tài sản.

**Chưa kiểm chứng trên tài khoản Google của bạn:** OAuth/triển khai `/exec`, ghi Sheets thật, lịch Gmail thật, PDF/ảnh trên Drive và tải XLSX thật. Kiểm thử dịch vụ dùng mô phỏng; sau khi nâng cấp cần thử một phiếu mẫu và đối chiếu trên Sheets. Không có quyền truy cập trực tiếp tài khoản của bạn trong phiên này.

## Ảnh giao diện V2

Ảnh chụp từ Chromium với dữ liệu mẫu và các thao tác kiểm thử, không phải ảnh tài khoản Google của người dùng.

- [Dashboard](Giao-dien-may-tinh.png)
- [Chi tiết tài sản](Giao-dien-chi-tiet.png)
- [Cấp phát](Giao-dien-cap-phat.png)
- [Thanh lý](Giao-dien-thanh-ly.png)
- [Báo cáo khấu hao](Giao-dien-bao-cao.png)
- [Kiểm kê điện thoại](Giao-dien-dien-thoai.png)

Bản vá tải dữ liệu: bỏ phụ thuộc bước đọc tham số URL khi khởi động, hiển thị lỗi JavaScript/kết nối và giảm đọc Sheets lặp lại trong mỗi lần thực thi. Khi cần chẩn đoán, chạy hàm `diagnose` (chỉ đọc). Xem mục xử lý “Đang tải dữ liệu…” trong CAP-NHAT-V2.md.

## Bảo trì mã giao diện (dành cho người sửa mã)

Logic trình duyệt ở `App.js`; `Index.html` chỉ chứa bố cục, CSS, bộ báo lỗi ngắn và thẻ tải script. Không dán lại App.js vào Index.html vì bản vá này chủ động tách JavaScript khỏi quá trình xuất HTML. Khi sửa App.js, commit/push file đó trước; chạy `python scripts/pin-client.py <commit-chứa-App.js>`, rồi `python scripts/build-installer.py`, kiểm thử và commit/push Index.html cùng client-build.json và Bat-dau.html. Công cụ pin từ chối nếu byte của App.js không đúng commit. Không bỏ kiểm tra integrity để ép một bản không khớp chạy.
