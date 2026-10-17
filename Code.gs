/* V2 — append-only schema migration; never replaces user data. */
const TABLES = {
  TaiSan: ['id','code','name','kind','group','unit','price','purchaseDate','purchaseTime','months','supplier','serial','warrantyDate','location','status','employeeId','department','condition','note','sample','createdAt','updatedAt','brand','model','nextMaintenance','loanDueDate','imageFileId','minStock'],
  LoaiTaiSan: ['id','name','prefix','consumable'],
  NhomSanPham: ['id','name','prefix'],
  NhanVien: ['id','name','department','location','email','active','sample'],
  GiaoDich: ['id','type','assetId','assetCode','assetName','date','quantity','unitPrice','amount','employeeId','employeeName','department','location','condition','reason','approver','decision','note','oldEmployee','oldLocation','createdAt','actor','requestId','sample','dueDate','method','giver','bookValue','gainLoss','afterState','documentUrl'],
  DotKiemKe: ['id','name','date','status','createdAt'],
  ChiTietKiemKe: ['id','auditId','assetId','assetCode','assetName','expected','actual','result','note','employeeName','location','updatedAt'],
  LichSu: ['id','assetId','action','before','after','createdAt','actor'],
  BaoTriBaoHanh: ['id','assetId','date','content','cost','nextDate','createdAt','requestId','documentUrl'],
  CauHinh: ['key','value'],
  KhauHaoThang: ['month','assetCode','assetName','price','monthly','accumulated','remaining'],
  MauBieu: ['key','value'],
  PhongBan: ['id','name'], ViTri: ['id','name'], NhaCungCap: ['id','name'],
  YeuCau: ['id','status','payload','createdAt'],
  ThuNhac: ['id','date','recipient','count','createdAt']
};
const DEFAULTS = {businessName:'Hộ kinh doanh in ảnh',address:'',reminderEmail:'',reminderDays:'30',remindersEnabled:'false',reminderHour:'8',notifyAssignees:'false',copyOwner:'false',autoSavePdf:'false',webAppUrl:''};
function onOpen() { SpreadsheetApp.getUi().createMenu('Quản lý tài sản').addItem('Khởi tạo / Nâng cấp giữ dữ liệu','setup').addItem('Thêm dữ liệu mẫu','seedDemo').addItem('Áp dụng lịch email đã cài đặt','enableReminders').addToUi(); }
function setup() {
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try {
    const ss=SpreadsheetApp.getActiveSpreadsheet();if(!ss)throw Error('Mở Apps Script từ Google Sheets rồi chạy setup.');
    PropertiesService.getScriptProperties().setProperty('SHEET_ID',ss.getId());ss.setSpreadsheetTimeZone('Asia/Ho_Chi_Minh');
    // Preflight all headers before writing anything. Accept only a prefix of this schema.
    Object.keys(TABLES).forEach(name=>{const s=ss.getSheetByName(name);if(!s||!s.getLastRow())return;
      const current=s.getRange(1,1,1,s.getLastColumn()).getDisplayValues()[0];
      if(current.length>TABLES[name].length||current.some((h,i)=>h!==TABLES[name][i]))throw Error('Tab '+name+' có cấu trúc khác. Dừng nâng cấp để bảo vệ dữ liệu; không xóa tab.');
    });
    Object.keys(TABLES).forEach(name=>{
      let s=ss.getSheetByName(name);if(!s)s=ss.insertSheet(name);
      const h=TABLES[name]; if(s.getMaxColumns()<h.length)s.insertColumnsAfter(s.getMaxColumns(),h.length-s.getMaxColumns());
      const oldWidth=s.getLastRow()?s.getLastColumn():0;
      if(s.getFilter()&&oldWidth<h.length)s.getFilter().remove();
      s.getRange(1,1,1,h.length).setValues([h]).setBackground('#7656d5').setFontColor('#ffffff').setFontWeight('bold');s.setFrozenRows(1);
      if(!s.getFilter())s.getRange(1,1,Math.max(2,s.getLastRow()),h.length).createFilter();
      if(s.getMaxRows()>1)s.getRange(2,1,s.getMaxRows()-1,h.length).setNumberFormat('@');
    });
    if(!rows('LoaiTaiSan').length)append('LoaiTaiSan',[{id:'VT',name:'Vật tư',prefix:'VT',consumable:'true'},{id:'MI',name:'Máy in',prefix:'MI',consumable:'false'},{id:'KH',name:'Khác',prefix:'KH',consumable:'false'}]);
    if(!rows('NhomSanPham').length)append('NhomSanPham',[['GI','Giấy in'],['MU','Mực in'],['MM','Cuộn màng mờ'],['VA','Viền ảnh'],['VN','Ván'],['KG','Khung'],['VI','Vít'],['MT','Móc treo'],['HO','Hộp'],['TZ','Túi zip'],['TN','Túi ni lông'],['VK','Vật tư khác']].map(x=>({id:x[0],prefix:x[0],name:x[1]})));
    const c=config();const legacyReminder=c.remindersEnabled===undefined&&Domain.emails(c.reminderEmail).length>0&&ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='sendReminders');append('CauHinh',Object.keys(DEFAULTS).filter(k=>c[k]===undefined).map(k=>({key:k,value:k==='remindersEnabled'&&legacyReminder?'true':DEFAULTS[k]})));
    if(!rows('MauBieu').length)append('MauBieu',[{key:'handoverTerms',value:'Bên nhận đã kiểm tra, xác nhận số lượng và tình trạng tài sản. Sử dụng đúng mục đích, bảo quản và bàn giao khi có yêu cầu. Biên bản lập thành hai bản, mỗi bên giữ một bản.'}]);
    syncCatalogs_();return 'Đã nâng cấp V2, giữ nguyên dữ liệu. Không chạy seedDemo trên dữ liệu đang dùng.';
  } finally {lock.releaseLock();}
}
function db(){const id=PropertiesService.getScriptProperties().getProperty('SHEET_ID');if(!id)throw Error('Chạy setup để khởi tạo hoặc nâng cấp trước.');return SpreadsheetApp.openById(id);}
function sheet(name){if(!TABLES[name])throw Error('Tab không hợp lệ');const s=db().getSheetByName(name);if(!s)throw Error('Thiếu tab '+name+'. Chạy setup để nâng cấp giữ dữ liệu.');return s;}
function rows(name){const s=sheet(name);if(s.getLastRow()<2)return [];return s.getRange(2,1,s.getLastRow()-1,TABLES[name].length).getDisplayValues().filter(v=>v[0]).map(v=>Object.fromEntries(TABLES[name].map((h,i)=>[h,v[i]])));}
function safe(v){const s=String(v===undefined||v===null?'':v);return /^[=+@-]/.test(s)?"'"+s:s;}
function append(name,data){if(!data.length)return;const s=sheet(name),end=s.getLastRow()+data.length;if(end>s.getMaxRows())s.insertRowsAfter(s.getMaxRows(),end-s.getMaxRows());s.getRange(s.getLastRow()+1,1,data.length,TABLES[name].length).setValues(data.map(o=>TABLES[name].map(h=>safe(o[h]))));}
function replaceRow(name,id,value){const index=rows(name).findIndex(r=>r.id===id);if(index<0)throw Error('Không tìm thấy bản ghi');sheet(name).getRange(index+2,1,1,TABLES[name].length).setValues([TABLES[name].map(h=>safe(value[h]))]);}
function uid(){return Utilities.getUuid();}
function now(){return Utilities.formatDate(new Date(),'Asia/Ho_Chi_Minh',"yyyy-MM-dd'T'HH:mm:ss");}
function today(){return now().slice(0,10);}
function actor(){return Session.getEffectiveUser().getEmail()||'Chủ sở hữu';}
function config(){return Object.fromEntries(rows('CauHinh').map(r=>[r.key,r.value]));}
function doGet(){return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('Quản lý tài sản').addMetaTag('viewport','width=device-width, initial-scale=1');}
function syncCatalogs_(){const a=rows('TaiSan'),e=rows('NhanVien');[['PhongBan',[...a.map(x=>x.department),...e.map(x=>x.department)]],['ViTri',['Kho chính',...a.map(x=>x.location),...e.map(x=>x.location)]],['NhaCungCap',a.map(x=>x.supplier)]].forEach(([table,names])=>{const known=rows(table).map(x=>x.name);append(table,[...new Set(names.filter(Boolean))].filter(n=>!known.includes(n)).map(name=>({id:uid(),name})));});}
function getData(){
  const assets=rows('TaiSan'),transactions=rows('GiaoDich'),maintenance=rows('BaoTriBaoHanh'),settings=config();
  let appUrl=settings.webAppUrl||'';if(!appUrl&&typeof ScriptApp!=='undefined'&&ScriptApp.getService)appUrl=ScriptApp.getService().getUrl()||'';
  return {version:2,assets,transactions,maintenance,stock:Domain.stock(assets,transactions),employees:rows('NhanVien'),types:rows('LoaiTaiSan'),groups:rows('NhomSanPham'),departments:rows('PhongBan'),locations:rows('ViTri'),suppliers:rows('NhaCungCap'),audits:rows('DotKiemKe'),auditLines:rows('ChiTietKiemKe'),history:rows('LichSu'),settings,terms:rows('MauBieu'),month:today().slice(0,7),today:today(),report:getReport(today().slice(0,7)),analytics:reportAnalytics_(today().slice(0,7)),alerts:Domain.alerts({assets,maintenance},today(),settings.reminderDays),appUrl};
}
function getReport(month){Domain.date(month+'-01');const transactions=rows('GiaoDich');return rows('TaiSan').filter(a=>a.kind!=='VT'&&a.purchaseDate.slice(0,7)<=month).map(a=>{const sale=transactions.find(t=>t.assetId===a.id&&t.type==='THANH_LY');const cutoff=sale&&sale.date.slice(0,7)<month?sale.date.slice(0,7):month;return Object.assign({},a,Domain.depreciation(a,cutoff),{disposed:!!(sale&&sale.date.slice(0,7)<=month)});});}
function reportAnalytics_(month){
  const year=Number(month.slice(0,4)),assets=rows('TaiSan').filter(a=>a.kind!=='VT'),tx=rows('GiaoDich');
  const annual=Array.from({length:5},(_,i)=>{const y=year-1+i;let value=0;assets.forEach(a=>{const sale=tx.find(t=>t.assetId===a.id&&t.type==='THANH_LY');const end=sale&&sale.date.slice(0,7)<y+'-12'?sale.date.slice(0,7):y+'-12';const start=sale&&sale.date.slice(0,7)<(y-1)+'-12'?sale.date.slice(0,7):(y-1)+'-12';value+=Domain.depreciation(a,end).accumulated-Domain.depreciation(a,start).accumulated;});return {label:String(y),value};});
  const monthly=Array.from({length:12},(_,i)=>{const dt=new Date(Date.UTC(year,Number(month.slice(5))-12+i,1)),m=dt.toISOString().slice(0,7);return {label:m,value:assets.filter(a=>a.purchaseDate.startsWith(m)).reduce((s,a)=>s+Number(a.price),0)+tx.filter(t=>t.type==='NHAP_VT'&&t.date.startsWith(m)).reduce((s,t)=>s+Number(t.amount),0)};});
  return {annual,monthly};
}
function getReportBundle(month){return {report:getReport(month),analytics:reportAnalytics_(month)};}
function getSalePreview(ids,date,amount){Domain.date(date);const assets=rows('TaiSan');const lines=(ids||[]).map(id=>{const a=assets.find(a=>a.id===id);if(!a||a.kind==='VT')throw Error('Tài sản không hợp lệ');const d=Domain.depreciation(a,date.slice(0,7));return {id:a.id,code:a.code,remaining:d.remaining};});const value=lines.reduce((s,a)=>s+a.remaining,0);return {lines,bookValue:value,proceeds:Number(amount||0)*lines.length,gainLoss:Number(amount||0)*lines.length-value};}
function mutate(action,p){
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    p=p||{};if(!Object.prototype.hasOwnProperty.call(handlers,action))throw Error('Thao tác không hợp lệ');if(!/^[a-zA-Z0-9_-]{8,100}$/.test(p.requestId||''))throw Error('Thiếu mã yêu cầu');
    recoverPending_();
    const existing=rows('YeuCau').find(r=>r.id===p.requestId);
    if(existing&&existing.status==='DONE')return {message:'Yêu cầu đã được xử lý',data:getData(),documentId:p.requestId};
    const result=handlers[action](p)||'Đã lưu';SpreadsheetApp.flush();
    const record=rows('YeuCau').find(r=>r.id===p.requestId);
    if(record)replaceRow('YeuCau',record.id,Object.assign(record,{status:'DONE'}));else append('YeuCau',[{id:p.requestId,status:'DONE',payload:'',createdAt:now()}]);
    let warning='';
    if((p.savePdf===undefined?config().autoSavePdf==='true':p.savePdf==='true')&&['transaction','maintenance'].includes(action)){
      try{createDocument(p.requestId,true);}catch(e){warning=' Phiếu đã ghi; chưa lưu PDF: '+e.message;}
    }
    return {message:result+warning,data:getData(),documentId:['transaction','maintenance'].includes(action)?p.requestId:''};
  }finally{lock.releaseLock();}
}
function recoverPending_(){
  rows('YeuCau').filter(r=>r.status==='PENDING').forEach(r=>{
    const plan=JSON.parse(r.payload),known=rows('GiaoDich').filter(t=>t.requestId===r.id).map(t=>t.id);
    append('GiaoDich',plan.tx.filter(t=>!known.includes(t.id)));
    plan.updates.forEach(a=>replaceRow('TaiSan',a.id,a));
    replaceRow('YeuCau',r.id,Object.assign(r,{status:'DONE'}));
  });
}
const handlers={
  saveAsset(p){
    const list=rows('TaiSan'),old=p.id?list.find(a=>a.id===p.id):null;if(p.id&&!old)throw Error('Tài sản không tồn tại');const type=rows('LoaiTaiSan').find(t=>t.id===p.kind);if(!type)throw Error('Loại không tồn tại');if(old&&old.kind!==p.kind)throw Error('Không đổi loại của mã đã cấp');
    const fields=['name','kind','group','unit','price','purchaseDate','purchaseTime','months','supplier','serial','warrantyDate','location','note','brand','model','nextMaintenance','minStock'];
    const a=Object.assign({},old||{},...fields.map(k=>({[k]:p[k]===undefined?(old?old[k]:''):String(p[k]).trim()})));Domain.validateAsset(a);if(a.warrantyDate)Domain.date(a.warrantyDate);if(a.nextMaintenance)Domain.date(a.nextMaintenance);if(a.minStock!=='')Domain.number(a.minStock,'Tồn tối thiểu',0);
    if(a.kind==='VT'&&!rows('NhomSanPham').some(g=>g.id===a.group))throw Error('Chọn nhóm vật tư');a.updatedAt=now();
    if(old){replaceRow('TaiSan',a.id,a);append('LichSu',[{id:uid(),assetId:a.id,action:'SUA',before:JSON.stringify(old),after:JSON.stringify(a),createdAt:now(),actor:actor()}]);}
    else {const prefix=type.prefix+(a.kind==='VT'?'-'+rows('NhomSanPham').find(g=>g.id===a.group).prefix:'');const n=Math.max(0,...list.filter(x=>x.code.startsWith(prefix+'-')).map(x=>Number(x.code.slice(prefix.length+1))||0))+1;Object.assign(a,{id:uid(),code:prefix+'-'+String(n).padStart(4,'0'),status:'TRONG_KHO',employeeId:'',department:'',condition:'Mới',sample:'false',createdAt:now()});append('TaiSan',[a]);}
    syncCatalogs_();return 'Đã lưu '+a.code;
  },
  transaction(p){
    if(rows('GiaoDich').some(t=>t.requestId===p.requestId))return 'Phiếu đã được ghi';
    Domain.date(p.date);const assets=rows('TaiSan'),allTx=rows('GiaoDich'),stock=Domain.stock(assets,allTx),ids=[...new Set(p.assetIds||[])];if(!ids.length)throw Error('Chọn ít nhất một tài sản');
    const employee=rows('NhanVien').find(e=>e.id===p.employeeId&&e.active==='true');
    if(p.employeeId&&!employee)throw Error('Nhân viên không tồn tại hoặc đã ngừng làm');
    if(['CAP_PHAT','DIEU_CHUYEN','CHO_MUON'].includes(p.type)&&!employee&&!String(p.department||'').trim())throw Error('Chọn người nhận hoặc bộ phận nhận');
    if(p.type==='CHO_MUON'){Domain.date(p.dueDate);if(p.dueDate<p.date)throw Error('Hạn trả không được trước ngày mượn');}
    if(p.type==='THANH_LY'&&!['BAN_LAI','HUY','CHO_TANG'].includes(p.method||'BAN_LAI'))throw Error('Hình thức thanh lý không hợp lệ');
    const tx=[],updates=[];
    ids.forEach(id=>{
      const original=assets.find(a=>a.id===id);if(!original)throw Error('Không tìm thấy tài sản');const a=Object.assign({},original);
      if(p.date<a.purchaseDate)throw Error('Ngày phiếu trước ngày mua');const previous=allTx.filter(t=>t.assetId===id).reduce((d,t)=>t.date>d?t.date:d,'');if(p.date<previous)throw Error('Không ghi lùi trước phiếu gần nhất');
      let q=1,unitPrice=Number(a.price),amount=unitPrice,bookValue='',gainLoss='';
      if(['NHAP_VT','XUAT_VT'].includes(p.type)){
        if(a.kind!=='VT'||ids.length!==1)throw Error('Mỗi phiếu vật tư chọn một sản phẩm');q=Domain.number(p.quantity,'Số lượng',0.000001);
        if(p.type==='XUAT_VT'){if(q>stock[id].quantity+1e-9)throw Error('Không đủ tồn kho');unitPrice=stock[id].average;}else unitPrice=Domain.number(p.unitPrice,'Đơn giá nhập',0);amount=q*unitPrice;
      }else{
        a.status=Domain.transition(a,p.type);
        if(p.type==='THANH_LY'){if(!String(p.reason||'').trim())throw Error('Nhập lý do thanh lý');amount=Domain.number(p.amount,'Giá thu hồi',0);bookValue=Domain.depreciation(a,p.date.slice(0,7)).remaining;gainLoss=amount-bookValue;}
        if(['CAP_PHAT','DIEU_CHUYEN','CHO_MUON'].includes(p.type)){a.employeeId=employee?employee.id:'';a.department=p.department||(employee?employee.department:'');a.location=p.location||(employee?employee.location:a.location);}
        if(['THU_HOI','TRA_MUON','THANH_LY'].includes(p.type)){a.employeeId='';a.department='';a.location=p.location||'Kho chính';a.loanDueDate='';}
        if(p.type==='CHO_MUON')a.loanDueDate=p.dueDate;
        if(p.type==='BAO_HONG')a.condition='Hỏng';else if(p.type==='BAO_MAT')a.condition='Thất lạc';else a.condition=p.condition||a.condition;
        a.updatedAt=now();updates.push(a);
      }
      tx.push({id:uid(),type:p.type,assetId:id,assetCode:a.code,assetName:a.name,date:p.date,quantity:q,unitPrice,amount,employeeId:employee?employee.id:original.employeeId,employeeName:employee?employee.name:(rows('NhanVien').find(e=>e.id===original.employeeId)||{}).name||'',department:p.department||(employee?employee.department:original.department),location:a.location,condition:a.condition,reason:p.reason,approver:p.approver,decision:p.decision,note:p.note,oldEmployee:original.employeeId,oldLocation:original.location,createdAt:now(),actor:actor(),requestId:p.requestId,sample:'false',dueDate:p.dueDate,method:p.method||'',giver:p.giver,bookValue,gainLoss,afterState:JSON.stringify(a)});
    });
    // Durable write-ahead plan: retries repair a partial service failure, without duplicate rows.
    const payload=JSON.stringify({tx,updates});if(payload.length>48000)throw Error('Phiếu quá lớn. Chia thành các phiếu ít tài sản hơn.');
    append('YeuCau',[{id:p.requestId,status:'PENDING',payload,createdAt:now()}]);recoverPending_();syncCatalogs_();return 'Đã ghi phiếu';
  },
  addCategory(p){
    const table=['NhomSanPham','LoaiTaiSan','PhongBan','ViTri','NhaCungCap'].includes(p.table)?p.table:'LoaiTaiSan';if(!String(p.name||'').trim())throw Error('Nhập tên');
    if(['PhongBan','ViTri','NhaCungCap'].includes(table)){if(rows(table).some(r=>r.name===p.name.trim()))throw Error('Tên đã tồn tại');append(table,[{id:uid(),name:p.name.trim()}]);}
    else{const prefix=String(p.prefix||'').toUpperCase().trim();if(!/^[A-Z][A-Z0-9]{1,7}$/.test(prefix))throw Error('Tiền tố 2–8 chữ/số, bắt đầu bằng chữ');if(rows(table).some(r=>r.prefix===prefix||r.id===prefix))throw Error('Tiền tố đã tồn tại');append(table,[{id:prefix,name:p.name,prefix,consumable:'false'}]);}return 'Đã thêm danh mục';
  },
  saveEmployee(p){if(!String(p.name||'').trim())throw Error('Nhập họ tên');Domain.emails(p.email);if(p.email&&Domain.emails(p.email).length!==1)throw Error('Mỗi nhân viên một email');const e={id:p.id||uid(),name:p.name,department:p.department,location:p.location,email:p.email,active:p.active==='false'?'false':'true',sample:'false'};p.id?replaceRow('NhanVien',p.id,e):append('NhanVien',[e]);syncCatalogs_();return 'Đã lưu nhân viên';},
  createAudit(p){if(!String(p.name||'').trim())throw Error('Nhập tên đợt');Domain.date(p.date);const id=uid(),assets=rows('TaiSan').filter(a=>a.status!=='THANH_LY'&&(!p.department||a.department===p.department)&&(!p.location||a.location===p.location)),stock=Domain.stock(assets,rows('GiaoDich')),employees=rows('NhanVien');if(!assets.length)throw Error('Không có tài sản trong phạm vi đã chọn');append('DotKiemKe',[{id,name:p.name,date:p.date,status:'MO',createdAt:now()}]);append('ChiTietKiemKe',assets.map(a=>({id:uid(),auditId:id,assetId:a.id,assetCode:a.code,assetName:a.name,expected:a.kind==='VT'?stock[a.id].quantity:1,actual:'',result:'CHUA_KIEM',note:'',employeeName:(employees.find(e=>e.id===a.employeeId)||{}).name||'',location:a.location,updatedAt:now()})));return 'Đã tạo đợt kiểm kê';},
  saveAuditLine(p){const l=rows('ChiTietKiemKe').find(l=>l.id===p.id);if(!l)throw Error('Không tìm thấy dòng kiểm kê');if(!rows('DotKiemKe').some(a=>a.id===l.auditId&&a.status==='MO'))throw Error('Đợt đã chốt');if(!['CO_MAT','THIEU','HONG','SAI_VI_TRI'].includes(p.result))throw Error('Kết quả không hợp lệ');const actual=Domain.number(p.actual,'Số lượng thực tế',0);if(p.result==='CO_MAT'&&actual!==Number(l.expected))throw Error('Số lượng khác sổ; chọn Thiếu/lệch số lượng');replaceRow('ChiTietKiemKe',l.id,Object.assign(l,{actual,result:p.result,note:p.note||'',updatedAt:now()}));return 'Đã ghi nhận, không tự điều chỉnh tồn';},
  closeAudit(p){const a=rows('DotKiemKe').find(a=>a.id===p.id);if(!a)throw Error('Không tìm thấy đợt');if(rows('ChiTietKiemKe').some(l=>l.auditId===a.id&&l.result==='CHUA_KIEM'))throw Error('Còn mục chưa kiểm kê');replaceRow('DotKiemKe',a.id,Object.assign(a,{status:'DONG'}));return 'Đã chốt đợt';},
  maintenance(p){const a=rows('TaiSan').find(a=>a.id===p.assetId&&a.kind!=='VT'&&a.status!=='THANH_LY');if(!a)throw Error('Chọn tài sản chưa thanh lý');Domain.date(p.date);if(p.date<a.purchaseDate)throw Error('Ngày bảo trì trước ngày mua');if(p.nextDate){Domain.date(p.nextDate);if(p.nextDate<=p.date)throw Error('Lịch tiếp theo phải sau ngày thực hiện');}if(!String(p.content||'').trim())throw Error('Nhập nội dung');append('BaoTriBaoHanh',[{id:uid(),assetId:a.id,date:p.date,content:p.content,cost:Domain.number(p.cost,'Chi phí',0),nextDate:p.nextDate,createdAt:now(),requestId:p.requestId}]);return 'Đã ghi bảo trì / sửa chữa';},
  settings(p){const old=config(),c=Object.assign({},DEFAULTS,old);Object.keys(DEFAULTS).forEach(k=>{if(p[k]!==undefined)c[k]=String(p[k]);});Domain.emails(c.reminderEmail);const days=Domain.number(c.reminderDays,'Số ngày nhắc',0),hour=Domain.number(c.reminderHour,'Giờ gửi',0);if(!Number.isInteger(hour)||hour>23||!Number.isInteger(days)||days>365)throw Error('Giờ gửi 0–23; số ngày nhắc 0–365');if(c.webAppUrl&&!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(c.webAppUrl))throw Error('URL phải là đường dẫn Web App Google kết thúc /exec');
    ['remindersEnabled','notifyAssignees','copyOwner','autoSavePdf'].forEach(k=>{if(!['true','false'].includes(c[k]))throw Error('Cài đặt không hợp lệ');});
    if(c.remindersEnabled==='true'&&!Domain.emails(c.reminderEmail).length&&! (c.copyOwner==='true'))throw Error('Điền email nhận hoặc bật gửi cho chủ sở hữu');
    // Upsert individual keys; preserve unknown settings and existing values.
    Object.keys(c).forEach(k=>{const s=sheet('CauHinh'),index=rows('CauHinh').findIndex(r=>r.key===k);if(index<0)append('CauHinh',[{key:k,value:c[k]}]);else s.getRange(index+2,1,1,2).setValues([[k,safe(c[k])]]);});
    const changed=['remindersEnabled','reminderHour'].some(k=>c[k]!==old[k]);if(changed)enableReminders();return 'Đã lưu cài đặt'+(changed?' và cập nhật lịch nhắc':'');},
  exportDepreciation(p){const data=getReport(p.month).map(a=>({month:p.month,assetCode:a.code,assetName:a.name,price:a.price,monthly:a.monthly,accumulated:a.accumulated,remaining:a.remaining}));const s=sheet('KhauHaoThang');if(s.getLastRow()>1)s.getRange(2,1,s.getLastRow()-1,7).clearContent();append('KhauHaoThang',data);return 'Đã xuất bảng khấu hao tháng '+p.month;}
};
function enableReminders(){const c=config();ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='sendReminders').forEach(t=>ScriptApp.deleteTrigger(t));if(c.remindersEnabled!=='true')return 'Đã tắt lịch nhắc';ScriptApp.newTrigger('sendReminders').timeBased().everyDays(1).atHour(Number(c.reminderHour||8)).inTimezone('Asia/Ho_Chi_Minh').create();return 'Đã áp dụng lịch gửi khoảng '+c.reminderHour+' giờ';}
function sendReminders(){
  const lock=LockService.getScriptLock();lock.waitLock(30000);try{
    const c=config();if(c.remindersEnabled!=='true')return;const assets=rows('TaiSan'),employees=rows('NhanVien'),alerts=Domain.alerts({assets,maintenance:rows('BaoTriBaoHanh')},today(),c.reminderDays),recipients={};
    const line=a=>{const asset=assets.find(x=>x.id===a.assetId);return a.title+': '+asset.code+' — '+asset.name+(a.date?' ('+a.date+')':'');};
    const owners=Domain.emails(c.reminderEmail);if(c.copyOwner==='true')owners.push(...Domain.emails(actor()));[...new Set(owners)].forEach(email=>recipients[email]=alerts.map(line));
    if(c.notifyAssignees==='true')employees.filter(e=>e.email&&e.active==='true').forEach(e=>{const own=alerts.filter(a=>a.employeeId===e.id).map(line);Domain.emails(e.email).forEach(email=>recipients[email]=[...new Set([...(recipients[email]||[]),...own])]);});
    const sent=rows('ThuNhac');Object.keys(recipients).forEach(email=>{const messages=recipients[email];if(!messages.length||sent.some(r=>r.date===today()&&r.recipient===email)||MailApp.getRemainingDailyQuota()<1)return;MailApp.sendEmail(email,'Nhắc tài sản — '+c.businessName,messages.join('\n'));append('ThuNhac',[{id:uid(),date:today(),recipient:email,count:messages.length,createdAt:now()}]);});
  }finally{lock.releaseLock();}
}
function html_(v){return String(v===undefined||v===null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function vnd_(v){return Number(v||0).toLocaleString('vi-VN')+' đ';}
function documentContent_(id){
  const c=config(),tx=rows('GiaoDich').filter(t=>(t.requestId||t.id)===id),m=rows('BaoTriBaoHanh').find(m=>(m.requestId||m.id)===id),audit=rows('DotKiemKe').find(a=>a.id===id);
  const titles={CAP_PHAT:'BÀN GIAO TÀI SẢN',DIEU_CHUYEN:'ĐIỀU CHUYỂN TÀI SẢN',THU_HOI:'THU HỒI TÀI SẢN',THANH_LY:'THANH LÝ TÀI SẢN',CHO_MUON:'CHO MƯỢN TÀI SẢN',TRA_MUON:'TRẢ TÀI SẢN',NHAP_VT:'NHẬP KHO VẬT TƯ',XUAT_VT:'XUẤT DÙNG VẬT TƯ',BAO_HONG:'GHI NHẬN TÀI SẢN HỎNG',BAO_MAT:'GHI NHẬN THẤT LẠC',SUA_CHUA:'BÀN GIAO SỬA CHỮA',HOAN_TAT_SUA:'HOÀN TẤT SỬA CHỮA'};
  let title='',body='',date='',url='';
  if(tx.length){const t=tx[0];title='BIÊN BẢN '+(titles[t.type]||'TÀI SẢN');date=t.date;url=t.documentUrl;body='<p>Người giao: '+html_(t.giver||t.actor)+'<br>Người nhận: '+html_(t.employeeName)+'<br>Bộ phận: '+html_(t.department)+'<br>Vị trí: '+html_(t.location)+(t.dueDate?'<br>Hạn trả: '+html_(t.dueDate):'')+'</p><table><thead><tr><th>STT</th><th>Mã tài sản</th><th>Tên tài sản</th><th>SL</th><th>Tình trạng</th><th>Giá trị / thu hồi</th></tr></thead><tbody>'+tx.map((x,i)=>'<tr><td>'+(i+1)+'</td><td>'+html_(x.assetCode)+'</td><td>'+html_(x.assetName)+'</td><td>'+html_(x.quantity)+'</td><td>'+html_(x.condition)+'</td><td>'+vnd_(x.amount)+'</td></tr>').join('')+'</tbody></table><p>Lý do: '+html_(t.reason)+'<br>Ghi chú: '+html_(t.note)+'</p>';
    if(t.type==='THANH_LY')body+='<p>Hình thức: '+html_(({BAN_LAI:'Bán lại',HUY:'Hủy',CHO_TANG:'Cho tặng'})[t.method]||t.method)+'<br>Giá trị còn lại: '+vnd_(tx.reduce((s,x)=>s+Number(x.bookValue),0))+'<br>Lãi / lỗ: '+vnd_(tx.reduce((s,x)=>s+Number(x.gainLoss),0))+'<br>Người duyệt: '+html_(t.approver)+' — Quyết định: '+html_(t.decision)+'</p>';
  }else if(m){const a=rows('TaiSan').find(a=>a.id===m.assetId)||{};title='BIÊN BẢN BẢO TRÌ / SỬA CHỮA';date=m.date;url=m.documentUrl;body='<p>Tài sản: '+html_(a.code)+' — '+html_(a.name)+'</p><p>Nội dung: '+html_(m.content)+'</p><p>Chi phí: '+vnd_(m.cost)+'<br>Lịch tiếp theo: '+html_(m.nextDate)+'</p>';
  }else if(audit){title='BIÊN BẢN KIỂM KÊ';date=audit.date;body='<p>'+html_(audit.name)+' — '+(audit.status==='MO'?'Đang thực hiện':'Đã chốt')+'</p><table><tr><th>Mã</th><th>Tên</th><th>Theo sổ</th><th>Thực tế</th><th>Kết quả</th><th>Ghi chú</th></tr>'+rows('ChiTietKiemKe').filter(l=>l.auditId===id).map(l=>'<tr><td>'+html_(l.assetCode)+'</td><td>'+html_(l.assetName)+'</td><td>'+html_(l.expected)+'</td><td>'+html_(l.actual)+'</td><td>'+html_(({CHUA_KIEM:'Chưa kiểm',CO_MAT:'Có mặt',THIEU:'Lệch số lượng',HONG:'Hỏng',SAI_VI_TRI:'Sai vị trí'})[l.result])+'</td><td>'+html_(l.note)+'</td></tr>').join('')+'</table>';
  }else throw Error('Không tìm thấy phiếu');
  const terms=(rows('MauBieu').find(t=>t.key==='handoverTerms')||{}).value||'';
  const html='<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>body{font:14px "Times New Roman",serif;color:#111;padding:24px;line-height:1.6}h2{text-align:center;font-size:19px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #555;padding:7px;text-align:left}.sign{width:100%;border:0;margin-top:24px}.sign td{border:0;width:50%;text-align:center;height:130px;vertical-align:top}small{font-size:12px}</style></head><body><b>'+html_(c.businessName)+'</b><div>'+html_(c.address)+'</div><h2>'+html_(title)+'</h2><p>Số: '+html_(id)+'<br>Ngày: '+html_(date)+'</p>'+body+'<p>'+html_(terms)+'</p><table class="sign"><tr><td><b>BÊN GIAO / NGƯỜI LẬP</b><br><small>(Ký, ghi rõ họ tên)</small></td><td><b>BÊN NHẬN / NGƯỜI DUYỆT</b><br><small>(Ký, ghi rõ họ tên)</small></td></tr></table></body></html>';
  return {html,title,url:url||''};
}
function createDocument(id,save){
  const d=documentContent_(id);if(!save||d.url)return d;
  const props=PropertiesService.getScriptProperties();let folder;const fid=props.getProperty('DOCUMENT_FOLDER');if(fid)folder=DriveApp.getFolderById(fid);else{folder=DriveApp.createFolder('Quản lý tài sản — Biên bản');props.setProperty('DOCUMENT_FOLDER',folder.getId());}
  const blob=Utilities.newBlob(d.html,'text/html',d.title+'-'+id+'.html').getAs('application/pdf');d.url=folder.createFile(blob).getUrl();
  rows('GiaoDich').filter(t=>(t.requestId||t.id)===id).forEach(t=>replaceRow('GiaoDich',t.id,Object.assign(t,{documentUrl:d.url})));
  const m=rows('BaoTriBaoHanh').find(m=>(m.requestId||m.id)===id);if(m)replaceRow('BaoTriBaoHanh',m.id,Object.assign(m,{documentUrl:d.url}));return d;
}
function uploadPhoto(assetId,base64,mime){
  const lock=LockService.getScriptLock();lock.waitLock(30000);try{
    const a=rows('TaiSan').find(a=>a.id===assetId);if(!a)throw Error('Tài sản không tồn tại');if(!['image/jpeg','image/png','image/webp'].includes(mime)||typeof base64!=='string'||base64.length>7000000)throw Error('Chọn ảnh JPG/PNG/WebP dưới 5 MB');
    const bytes=Utilities.base64Decode(base64);if(bytes.length>5*1024*1024)throw Error('Ảnh tối đa 5 MB');
    const sig=bytes.slice(0,12).map(b=>(b+256)%256),valid=mime==='image/png'?sig.slice(0,8).join(',')==='137,80,78,71,13,10,26,10':mime==='image/jpeg'?sig[0]===255&&sig[1]===216&&sig[2]===255:String.fromCharCode(...sig.slice(0,4))==='RIFF'&&String.fromCharCode(...sig.slice(8,12))==='WEBP';if(!valid)throw Error('Nội dung không phải định dạng ảnh đã chọn');
    const props=PropertiesService.getScriptProperties();let f;const id=props.getProperty('PHOTO_FOLDER');if(id)f=DriveApp.getFolderById(id);else{f=DriveApp.createFolder('Quản lý tài sản — Ảnh');props.setProperty('PHOTO_FOLDER',f.getId());}
    const file=f.createFile(Utilities.newBlob(bytes,mime,a.code+'.'+mime.split('/')[1]));a.imageFileId=file.getId();a.updatedAt=now();replaceRow('TaiSan',a.id,a);append('LichSu',[{id:uid(),assetId:a.id,action:'ANH',before:'',after:'Cập nhật ảnh tài sản',createdAt:now(),actor:actor()}]);return {message:'Đã lưu ảnh riêng tư trên Drive',data:getData()};
  }finally{lock.releaseLock();}
}
function getAssetPhoto(assetId){const a=rows('TaiSan').find(a=>a.id===assetId);if(!a||!a.imageFileId)return '';const blob=DriveApp.getFileById(a.imageFileId).getBlob();if(!/^image\/(jpeg|png|webp)$/.test(blob.getContentType()))throw Error('Tệp không phải ảnh');return 'data:'+blob.getContentType()+';base64,'+Utilities.base64Encode(blob.getBytes());}
function nextAssetCode(kind,group){const type=rows('LoaiTaiSan').find(t=>t.id===kind);if(!type)throw Error('Loại không tồn tại');const g=rows('NhomSanPham').find(g=>g.id===group);if(kind==='VT'&&!g)throw Error('Chọn nhóm vật tư');const prefix=type.prefix+(kind==='VT'?'-'+g.prefix:'');const n=Math.max(0,...rows('TaiSan').filter(a=>a.code.startsWith(prefix+'-')).map(a=>Number(a.code.slice(prefix.length+1))||0))+1;return prefix+'-'+String(n).padStart(4,'0');}
function exportExcel(title,data){
  if(!Array.isArray(data)||!data.length||data.length>5001||!Array.isArray(data[0])||!data[0].length||data[0].length>50||data.length*data[0].length>50000)throw Error('Báo cáo quá lớn hoặc không hợp lệ');
  const columns=data[0].length;if(data.some(r=>!Array.isArray(r)||r.length!==columns))throw Error('Báo cáo không cùng số cột');
  const ss=SpreadsheetApp.create('Báo cáo — '+String(title||'Tài sản').slice(0,80)+' — '+today()),s=ss.getSheets()[0];
  if(s.getMaxRows()<data.length)s.insertRowsAfter(s.getMaxRows(),data.length-s.getMaxRows());if(s.getMaxColumns()<columns)s.insertColumnsAfter(s.getMaxColumns(),columns-s.getMaxColumns());
  s.getRange(1,1,data.length,columns).setValues(data.map(r=>r.map(v=>typeof v==='number'&&Number.isFinite(v)?v:safe(v))));s.getRange(1,1,1,columns).setBackground('#7656d5').setFontColor('#ffffff').setFontWeight('bold');s.setFrozenRows(1);SpreadsheetApp.flush();
  return {url:'https://docs.google.com/spreadsheets/d/'+ss.getId()+'/export?format=xlsx',sheetUrl:'https://docs.google.com/spreadsheets/d/'+ss.getId()+'/edit'};
}
handlers.markAuditPresent=function(p){
  const audit=rows('DotKiemKe').find(a=>a.id===p.auditId&&a.status==='MO');if(!audit)throw Error('Đợt kiểm kê không còn mở');
  const ids=[...new Set(p.ids||[])];if(!ids.length||ids.length>200)throw Error('Chọn từ 1 đến 200 mục mỗi lần');
  const all=rows('ChiTietKiemKe'),lines=ids.map(id=>all.find(l=>l.id===id&&l.auditId===p.auditId));if(lines.some(l=>!l))throw Error('Có mục không thuộc đợt kiểm kê');
  lines.filter(l=>l.result==='CHUA_KIEM').forEach(l=>replaceRow('ChiTietKiemKe',l.id,Object.assign(l,{result:'CO_MAT',actual:l.expected,updatedAt:now()})));return 'Đã ghi nhận các mục chưa kiểm trong danh sách đã chọn';
};
