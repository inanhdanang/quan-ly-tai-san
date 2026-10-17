function seedDemo() {
  const lock=LockService.getScriptLock(); lock.waitLock(30000);
  try {
    if(rows('TaiSan').length||rows('NhanVien').length||rows('GiaoDich').length) throw Error('Chỉ nạp mẫu vào bộ dữ liệu trống để tránh trùng hoặc ảnh hưởng dữ liệu thật.');
    const employees=[['Nguyễn Minh An','In ảnh','Khu máy in'],['Trần Thu Hà','Hoàn thiện','Bàn thành phẩm'],['Lê Quốc Bình','Kho','Kho chính'],['Phạm Ngọc Lan','Bán hàng','Quầy nhận ảnh']].map((x,i)=>({id:'NV00'+(i+1),name:x[0],department:x[1],location:x[2],email:'',active:'true',sample:'true'}));
    append('NhanVien',employees);
    const products=[['GI','Giấy ảnh bóng A4','Tờ',1800],['GI','Giấy ảnh lụa A3','Tờ',4500],['GI','Giấy ảnh cuộn 610 mm','Cuộn',750000],['MU','Mực Epson đen 1 lít','Chai',420000],['MU','Mực Epson cyan 1 lít','Chai',420000],['MU','Mực Epson magenta 1 lít','Chai',420000],['MU','Mực Epson yellow 1 lít','Chai',420000],['MM','Màng mờ 330 mm','Cuộn',260000],['MM','Màng mờ 635 mm','Cuộn',480000],['VA','Viền ảnh trắng','Mét',18000],['VA','Viền ảnh đen','Mét',18000],['VN','Ván MDF 30 × 40 cm','Tấm',24000],['VN','Ván MDF 40 × 60 cm','Tấm',45000],['KG','Khung ảnh 20 × 30 cm','Cái',38000],['KG','Khung ảnh 30 × 40 cm','Cái',65000],['VI','Vít bắt khung','Cái',200],['MT','Móc treo ảnh','Cái',1200],['HO','Hộp đựng ảnh 10 × 15 cm','Cái',4500],['TZ','Túi zip đựng ảnh','Cái',800],['TN','Túi ni lông giao hàng','Cái',500]];
    const seq={}, assets=[], transactions=[];
    products.forEach((p,i)=>{
      seq[p[0]]=(seq[p[0]]||0)+1; const id=uid(), q=i<2?200:i===15?500:20;
      const a={id,code:'VT-'+p[0]+'-'+String(seq[p[0]]).padStart(4,'0'),name:p[1],kind:'VT',group:p[0],unit:p[2],price:p[3],purchaseDate:today(),purchaseTime:'09:00',months:'',supplier:'Nhà cung cấp mẫu',location:'Kho chính',status:'TRONG_KHO',condition:'Mới',sample:'true',createdAt:now(),updatedAt:now()}; assets.push(a);
      transactions.push({id:uid(),type:'NHAP_VT',assetId:id,assetCode:a.code,assetName:a.name,date:today(),quantity:q,unitPrice:p[3],amount:q*p[3],location:'Kho chính',note:'Dữ liệu thử',createdAt:now(),actor:actor(),requestId:'DEMO_'+id,sample:'true'});
    });
    [['Máy in Epson L18050',18000000],['Máy in Epson L8050',8500000],['Máy in Canon PRO-200',14500000],['Máy in Epson SureColor P700',22000000],['Máy in nhiệt ảnh mẫu',6000000],['Máy in khổ lớn mẫu',48000000],['Máy cán màng',5500000],['Máy cắt giấy',2800000],['Máy tính thiết kế',16000000],['Bàn đóng khung',2400000]].forEach((p,i)=>{
      const kind=i<6?'MI':'KH', code=kind+'-'+String(i<6?i+1:i-5).padStart(4,'0');
      assets.push({id:uid(),code,name:p[0],kind,group:'',unit:'Cái',price:p[1],purchaseDate:today(),purchaseTime:'09:30',months:36,supplier:'Nhà cung cấp mẫu',serial:'DEMO-'+(i+1),location:i<4?employees[i].location:'Kho chính',employeeId:i<4?employees[i].id:'',department:i<4?employees[i].department:'',status:i<4?'DANG_DUNG':'TRONG_KHO',condition:'Mới',note:'Dữ liệu thử — không phải giá thị trường',sample:'true',createdAt:now(),updatedAt:now()});
    });
    append('TaiSan',assets); append('GiaoDich',transactions);
    assets.filter(a=>a.employeeId).forEach(a=>{const e=employees.find(e=>e.id===a.employeeId);append('GiaoDich',[{id:uid(),type:'CAP_PHAT',assetId:a.id,assetCode:a.code,assetName:a.name,date:today(),quantity:1,unitPrice:a.price,amount:a.price,employeeId:e.id,employeeName:e.name,department:e.department,location:e.location,condition:'Mới',createdAt:now(),actor:actor(),sample:'true'}]);});
    return 'Đã nạp 30 mục: 20 sản phẩm vật tư, 6 máy in, 4 tài sản khác và 4 nhân viên.';
  } finally { lock.releaseLock(); }
}
