# Quản lý tài sản & vật tư cho hộ kinh doanh in ảnh

Bản đầu tiên theo phạm vi đã duyệt. Dùng Gmail cá nhân, Google Sheets và Apps Script V8; không cần Google Workspace trả phí hoặc máy chủ riêng. Mã nguồn được tạo riêng, không phải file thương mại của tác giả video.

## Những gì đã có

- Sáu bước: nhập tài sản, cấp phát/điều chuyển, theo dõi, kiểm kê, thu hồi/thanh lý, báo cáo.
- Vật tư tiêu hao theo số lượng và đơn vị tính: nhập, xuất dùng, tồn, bình quân di động; chặn xuất âm kho. Không khấu hao vật tư.
- Loại ban đầu Vật tư (`VT`), Máy in (`MI`), Khác (`KH`). Thêm loại mới hoặc nhóm vật tư trong Danh mục. Loại thêm mới mặc định quản lý theo từng chiếc.
- Mã vật tư có nhóm, ví dụ `VT-GI-0001`; tài sản `MI-0001`, `KH-0001`. Không đổi mã khi sửa tên/giá/ngày mua. Không xóa hoặc tái sử dụng mã.
- Sửa ngày **và giờ mua**, giá mua, thời gian khấu hao, bảo hành; lưu lịch sử trước/sau.
- Khấu hao đường thẳng theo tháng: tính đủ tháng mua; không vượt nguyên giá; dừng tích lũy sau tháng thanh lý. Giá trị khấu hao được tính lại khi sửa ngày/giá; không đóng sổ kế toán.
- Phiếu chọn nhiều tài sản; mỗi phiếu vật tư là một sản phẩm. Tự lấy bộ phận/vị trí theo người nhận. QR tạo ngay trong trình duyệt, không gửi thông tin tài sản ra dịch vụ QR bên ngoài.
- Kiểm kê chụp số lượng/người giữ/vị trí tại lúc mở đợt; ghi Có mặt, Thiếu/lệch số lượng, Hỏng, Sai vị trí. Không tự điều chỉnh tồn kho theo chênh lệch. Chốt sau khi kiểm hết.
- Ghi bảo trì/sửa chữa; email nhắc bảo hành/bảo trì (chủ sở hữu tự bật); in biên bản, lưu PDF trên Drive riêng; báo cáo khấu hao xuất CSV hoặc tab Sheets.
- 30 bản ghi mẫu: 20 sản phẩm vật tư, 6 máy in, 4 tài sản khác; 4 nhân viên. Số lượng ban đầu đi qua phiếu nhập. Giá mẫu không phải báo giá thị trường.

## Cài vào Gmail của bạn

**Tải bộ mã:** bấm nút **Code → Download ZIP** ở đầu trang GitHub, giải nén rồi mở `Bat-dau.html` để sao chép từng file.

**Chưa được triển khai vào tài khoản Google của bạn.** Bộ mã và kiểm thử cục bộ đã chuẩn bị; người sở hữu tài khoản cần thực hiện các bước dưới đây. Không gửi mật khẩu, mã xác minh hoặc token cho bất kỳ ai.

1. Dùng Gmail thường tạo một Google Sheets **trống**, đặt tên “Quản lý tài sản – In ảnh”. Nên tạo bản riêng để chạy thử trước.
2. Chọn **Tiện ích mở rộng → Apps Script**.
3. Tạo các file trong trình soạn thảo và chép nguyên nội dung:

   | File trong bộ bàn giao | File cần tạo trong Apps Script |
   |---|---|
   | `Code.gs` | Script tên `Code` |
   | `Domain.js` | Script tên `Domain` (Google hiển thị `.gs`, đây là bình thường) |
   | `Seed.gs` | Script tên `Seed` |
   | `Index.html` | HTML tên `Index` |
   | `QR.html` | HTML tên `QR` (thư viện QR có kèm giấy phép MIT trong file) |
   | `appsscript.json` | Manifest của dự án |

4. Để sửa manifest: vào **Cài đặt dự án → Hiển thị tệp kê khai appsscript.json**, rồi thay nội dung bằng file được cung cấp. Lưu tất cả.
5. Chọn hàm **`setup` → Chạy**. Google sẽ yêu cầu cấp quyền. Mã sử dụng Sheets để lưu dữ liệu; Drive để lưu PDF; gửi email và trigger cho nhắc hằng ngày; email tài khoản để ghi lịch sử. Chỉ cấp quyền cho dự án chính bạn vừa tạo và kiểm tra mã. Nếu tổ chức chặn ứng dụng hoặc Google không cho cấp quyền, dừng và ghi lại thông báo lỗi.
6. Chọn hàm **`seedDemo` → Chạy** để nạp dữ liệu mẫu. Chỉ chạy được khi chưa có tài sản, nhân viên hoặc giao dịch; không nạp chồng dữ liệu thật.
7. Chọn **Triển khai → Triển khai mới → Ứng dụng web**:
   - Thực thi với tư cách: **Tôi**.
   - Ai có quyền truy cập: **Chỉ mình tôi**.
   - Triển khai, cấp quyền nếu được hỏi, mở URL kết thúc bằng `/exec`.
8. Trong giao diện mở **Cài đặt**, sửa tên cơ sở và địa chỉ. Nếu cần nhắc việc, điền email nhận, số ngày báo trước. Quay lại Sheets, tải lại trang, chọn menu **Quản lý tài sản → Bật email nhắc hằng ngày**. Thao tác này mới tạo lịch gửi thật, khoảng 8 giờ theo giờ Việt Nam; không gửi trong quá trình kiểm thử cục bộ.

Không chọn truy cập công khai. Bản này dành cho chủ hộ dùng cùng tài khoản trên máy tính/điện thoại; chưa có phân quyền đăng nhập riêng cho 4 nhân viên. Danh sách nhân viên dùng để ghi nhận người giữ tài sản. Không tự ý chia sẻ mật khẩu Gmail để nhân viên truy cập.

Khi sửa mã, vào **Quản lý bản triển khai → Chỉnh sửa → Phiên bản mới → Triển khai** để cập nhật URL hiện có. Sửa dữ liệu không cần triển khai lại.

## Chạy thử theo thứ tự

1. Xem Tổng quan: 10 tài sản theo chiếc và 20 sản phẩm vật tư. Có 4 tài sản mẫu đã cấp phát.
2. Mở **Nhập kho/Tài sản**, thêm máy in giá 24.000.000 đồng, khấu hao 24 tháng. Chọn ngày mua trong tháng đang xem: mức tháng 1.000.000 đồng, lũy kế tháng đầu 1.000.000 đồng.
3. Sửa ngày giờ/giá mua, kiểm tra báo cáo và lịch sử sửa. Tài sản mới không cần nhập tồn số lượng; sản phẩm vật tư phải ghi phiếu nhập ở bước tiếp theo.
4. Vào **Nhập–Xuất–Tồn**: nhập 10 đơn vị giá 10.000 rồi 10 đơn vị giá 30.000 cho một sản phẩm mới. Tồn 20, bình quân 20.000. Xuất 5: tồn 15, giá trị 300.000. Xuất hơn tồn phải báo lỗi.
5. Cấp phát máy cho nhân viên; điều chuyển; xem biên bản; in hoặc lưu PDF. Thu hồi về Kho chính. Kiểm tra người giữ và lịch sử thay đổi.
6. Tạo đợt kiểm kê; ghi kết quả theo từng mục trên điện thoại. Chưa kiểm hết sẽ không chốt được. Chênh lệch cần được chủ hộ đối chiếu, không tự ghi tăng/giảm kho.
7. Thanh lý máy đã thu hồi: nhập lý do, giá thu hồi mỗi chiếc, người duyệt/số quyết định nếu có. Máy thanh lý không cấp phát lại được.
8. Chọn tháng ở Báo cáo, tải CSV và xuất tab `KhauHaoThang`. Kiểm tra in tem QR ở Chi tiết tài sản.

## Quy ước và giới hạn cần biết

- Tiền VND; giờ Việt Nam. Khấu hao chỉ dùng **ngày** mua, giờ mua để lưu thông tin. Mức/lũy kế hiển thị làm tròn đồng; tháng cuối bù phần làm tròn để không vượt nguyên giá.
- Tồn kho là số hiện tại. Bộ báo cáo chưa dựng tồn lịch sử theo ngày. Xuất dùng theo bình quân tại thời điểm ghi; không ghi lùi trước phiếu vật tư gần nhất. Không có sửa/xóa phiếu kho đã ghi hoặc quy trình nhập trả; đối chiếu kỹ trước khi ghi.
- Sửa đơn giá tham khảo trên sản phẩm **không** sửa giá trị các phiếu vật tư cũ. Giá trị tồn lấy từ phiếu nhập/xuất, không lấy trường đơn giá tham khảo.
- Ngày phiếu không được trước ngày mua hoặc biến động trước đó. Không ghi phiếu tương lai để dự trù vì trạng thái cập nhật ngay khi lưu. Tài sản mua sau tháng báo cáo không vào báo cáo tháng đó.
- Tháng thanh lý vẫn tính đủ khấu hao; sau đó không tăng. Dòng thanh lý vẫn xuất trong bảng chi tiết, nhưng loại khỏi thẻ tổng tài sản đang quản lý.
- Kiểm kê là ảnh chụp lúc tạo đợt; nên tạm ngưng xuất/cấp phát khi đang kiểm. Lệch số lượng dùng lựa chọn “Thiếu/lệch số lượng”, kể cả thừa, và ghi rõ trong ghi chú.
- Biên bản có vùng ký tay, **không phải chữ ký số**. Mẫu dựng theo các trường nhìn thấy trong video, không cam kết giống nguyên văn các phần khuất. PDF lưu riêng tư; không tự gửi người nhận.
- Mã QR chứa mã tài sản, không phải URL công khai. Dùng camera quét rồi tìm mã trên giao diện.
- Có khóa khi ghi qua web app và mã chống gửi lại phiếu. Google Sheets không có giao dịch cơ sở dữ liệu nguyên khối: lỗi dịch vụ giữa lúc ghi có thể cần đối chiếu `GiaoDich` và `TaiSan`. Không sửa trực tiếp các tab nghiệp vụ hoặc cột tiêu đề; lịch sử ứng dụng không theo dõi chỉnh trực tiếp trên Sheets.
- Hạn mức Apps Script/Gmail/Drive của Google vẫn áp dụng. Không phù hợp cho lượng người đồng thời lớn. Chưa kiểm chứng hạn mức thực trên tài khoản của bạn.
- Email nhắc gửi lại mỗi ngày trong thời hạn nhắc; bản đầu chỉ gửi một địa chỉ cấu hình. Khi thêm dòng bảo trì mới với ngày thực hiện đạt lịch cũ, lịch cũ được coi là hoàn tất.
- Toàn bộ báo cáo khấu hao là quản lý nội bộ, chưa xác lập chế độ kế toán/thuế áp dụng cho cơ sở.

## Dữ liệu lưu ở đâu?

Đã gom các phiếu nhập/cấp phát/thu hồi/thanh lý vào **một tab GiaoDich**, mỗi dòng là một tài sản trong phiếu, cùng `requestId` là cùng phiếu. Cách này thay thế nhiều tab phiếu/chi tiết đã đề xuất, giao diện vẫn giữ đủ nghiệp vụ.

Các tab thực tế: `TaiSan`, `LoaiTaiSan`, `NhomSanPham`, `NhanVien`, `GiaoDich`, `DotKiemKe`, `ChiTietKiemKe`, `LichSu`, `BaoTriBaoHanh`, `CauHinh`, `KhauHaoThang`, `MauBieu`. Bộ phận, vị trí, nhà cung cấp nhập trong biểu mẫu, chưa có danh mục độc lập. Có thể chỉnh điều khoản biên bản tại cột value của dòng `handoverTerms` trong tab `MauBieu`.

Chạy `setup` lần nữa giữ dữ liệu hiện có và kiểm tra tiêu đề; không chạy nếu bạn đã đổi cấu trúc cột.

**Đổi từ dữ liệu thử sang dữ liệu thật:** nên tạo Sheets và dự án Apps Script mới, chạy `setup`, không chạy `seedDemo`. Giữ bản thử để học thao tác. Không có nút xóa toàn bộ nhằm tránh mất dữ liệu.

Sao lưu bằng Tệp → Tạo bản sao của Google Sheets. Nếu dùng bản sao để khôi phục, mở Apps Script của bản sao và chạy `setup` để cập nhật `SHEET_ID`, sau đó triển khai web app mới. PDF cũ nằm trong thư mục Drive “Biên bản quản lý tài sản”, không nằm trong file Sheets. Lịch trigger phải bật lại trong dự án mới.

## Kiểm thử đã thực hiện

Chạy `node --test tests/*.test.cjs`: 13 bài kiểm thử quy tắc và tích hợp dùng Google Sheets giả lập. Bao gồm khấu hao, chỉnh sửa ngày/giá, tồn bình quân, chặn xuất âm, cấp phát/điều chuyển/thu hồi/thanh lý, mã tự sinh, chống phiếu trùng, snapshot và chốt kiểm kê, dừng khấu hao khi thanh lý, kiểm tra toàn bộ phiếu nhiều tài sản trước khi ghi.

Kiểm tra trình duyệt Chromium qua backend giả lập: các màn hình, thêm tài sản, cấp phát, tạo QR, mở đợt kiểm kê và giao diện điện thoại. Ảnh giao diện được kèm trong bộ bàn giao.

Muốn chạy lại kiểm tra trình duyệt trên Linux có `/usr/bin/chromium`: `npm install --prefix /tmp/asset-browser playwright-core`, rồi `node tests/browser.cjs`. Các kiểm thử quy tắc không cần cài thêm dependency.

**Chưa xác minh trực tiếp trên Google:** cấp quyền OAuth, triển khai `/exec`, ghi Sheets thật, gửi Gmail, tạo trigger, chuyển PDF/lưu Drive và bản in giấy. Cần chạy checklist trên sau khi triển khai. Không có kết nối tài khoản Google trong phiên này để thực hiện thay bạn.
