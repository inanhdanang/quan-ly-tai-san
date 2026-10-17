/* Google Apps Script V8 — bound to the owner's Google Sheet. */
const TABLES = {
  TaiSan: ['id','code','name','kind','group','unit','price','purchaseDate','purchaseTime','months','supplier','serial','warrantyDate','location','status','employeeId','department','condition','note','sample','createdAt','updatedAt'],
  LoaiTaiSan: ['id','name','prefix','consumable'],
  NhomSanPham: ['id','name','prefix'],
  NhanVien: ['id','name','department','location','email','active','sample'],
  GiaoDich: ['id','type','assetId','assetCode','assetName','date','quantity','unitPrice','amount','employeeId','employeeName','department','location','condition','reason','approver','decision','note','oldEmployee','oldLocation','createdAt','actor','requestId','sample'],
  DotKiemKe: ['id','name','date','status','createdAt'],
  ChiTietKiemKe: ['id','auditId','assetId','assetCode','assetName','expected','actual','result','note','employeeName','location','updatedAt'],
  LichSu: ['id','assetId','action','before','after','createdAt','actor'],
  BaoTriBaoHanh: ['id','assetId','date','content','cost','nextDate','createdAt'],
  CauHinh: ['key','value'],
  KhauHaoThang: ['month','assetCode','assetName','price','monthly','accumulated','remaining'],
  MauBieu: ['key','value']
};
function onOpen() { SpreadsheetApp.getUi().createMenu('Quản lý tài sản').addItem('Khởi tạo cấu trúc', 'setup').addItem('Thêm dữ liệu mẫu', 'seedDemo').addItem('Bật email nhắc hằng ngày', 'enableReminders').addToUi(); }
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw Error('Mở Apps Script từ Google Sheets rồi chạy setup.');
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', ss.getId());
  ss.setSpreadsheetTimeZone('Asia/Ho_Chi_Minh');
  Object.keys(TABLES).forEach(name => {
    let s = ss.getSheetByName(name); if (!s) s = ss.insertSheet(name);
    const headers = TABLES[name];
    if (s.getLastRow() && JSON.stringify(s.getRange(1,1,1,headers.length).getValues()[0]) !== JSON.stringify(headers)) throw Error('Tab ' + name + ' đã có dữ liệu khác cấu trúc; không ghi đè.');
    s.getRange(1,1,1,headers.length).setValues([headers]).setBackground('#7354cf').setFontColor('#ffffff').setFontWeight('bold');
    s.setFrozenRows(1);
    if (!s.getFilter()) s.getRange(1,1,Math.max(2,s.getLastRow()),headers.length).createFilter();
    if (s.getMaxRows() > 1) s.getRange(2,1,s.getMaxRows()-1,headers.length).setNumberFormat('@');
  });
  if (!rows('LoaiTaiSan').length) append('LoaiTaiSan', [
    {id:'VT',name:'Vật tư',prefix:'VT',consumable:'true'}, {id:'MI',name:'Máy in',prefix:'MI',consumable:'false'}, {id:'KH',name:'Khác',prefix:'KH',consumable:'false'}
  ]);
  if (!rows('NhomSanPham').length) append('NhomSanPham', [['GI','Giấy in'],['MU','Mực in'],['MM','Cuộn màng mờ'],['VA','Viền ảnh'],['VN','Ván'],['KG','Khung'],['VI','Vít'],['MT','Móc treo'],['HO','Hộp'],['TZ','Túi zip'],['TN','Túi ni lông'],['VK','Vật tư khác']].map(x=>({id:x[0],prefix:x[0],name:x[1]})));
  if (!rows('CauHinh').length) append('CauHinh', [{key:'businessName',value:'Hộ kinh doanh in ảnh'}, {key:'address',value:''}, {key:'reminderEmail',value:''}, {key:'reminderDays',value:'30'}]);
  if (!rows('MauBieu').length) append('MauBieu', [{key:'handoverTerms',value:'Bên nhận kiểm tra số lượng và tình trạng khi nhận. Sử dụng đúng mục đích, bảo quản tài sản và bàn giao khi có yêu cầu. Hai bên ký xác nhận sau khi kiểm tra thực tế.'}]);
  return 'Đã khởi tạo. Chạy seedDemo nếu cần dữ liệu thử.';
}
function db() { const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID'); if (!id) throw Error('Chạy setup trước.'); return SpreadsheetApp.openById(id); }
function sheet(name) { if (!TABLES[name]) throw Error('Tab không hợp lệ'); return db().getSheetByName(name); }
function rows(name) { const s=sheet(name); if (s.getLastRow()<2) return []; return s.getRange(2,1,s.getLastRow()-1,TABLES[name].length).getDisplayValues().map(v=>Object.fromEntries(TABLES[name].map((h,i)=>[h,v[i]]))); }
function safe(v) { const s=String(v===undefined||v===null?'':v); return /^[=+@-]/.test(s) ? "'"+s : s; }
function append(name, data) { if (!data.length) return; const s=sheet(name); s.getRange(s.getLastRow()+1,1,data.length,TABLES[name].length).setValues(data.map(o=>TABLES[name].map(h=>safe(o[h])))); }
function replaceRow(name, id, value) { const list=rows(name), index=list.findIndex(r=>r.id===id); if(index<0) throw Error('Không tìm thấy bản ghi'); sheet(name).getRange(index+2,1,1,TABLES[name].length).setValues([TABLES[name].map(h=>safe(value[h]))]); }
function uid() { return Utilities.getUuid(); }
function now() { return Utilities.formatDate(new Date(),'Asia/Ho_Chi_Minh',"yyyy-MM-dd'T'HH:mm:ss"); }
function today() { return now().slice(0,10); }
function actor() { return Session.getEffectiveUser().getEmail() || 'Chủ sở hữu'; }
function config() { return Object.fromEntries(rows('CauHinh').map(r=>[r.key,r.value])); }
function doGet() { return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('Quản lý tài sản • In ảnh').addMetaTag('viewport','width=device-width, initial-scale=1'); }
function getData() {
  const assets=rows('TaiSan'), transactions=rows('GiaoDich');
  return {assets,transactions,stock:Domain.stock(assets,transactions),employees:rows('NhanVien'),types:rows('LoaiTaiSan'),groups:rows('NhomSanPham'),audits:rows('DotKiemKe'),auditLines:rows('ChiTietKiemKe'),maintenance:rows('BaoTriBaoHanh'),history:rows('LichSu'),settings:config(),terms:rows('MauBieu'),month:today().slice(0,7),report:getReport(today().slice(0,7))};
}
function getReport(month) {
  Domain.date(month+'-01'); const transactions=rows('GiaoDich');
  return rows('TaiSan').filter(a=>a.kind!=='VT'&&a.purchaseDate.slice(0,7)<=month).map(a=>{
    const sale=transactions.filter(t=>t.assetId===a.id&&t.type==='THANH_LY').sort((x,y)=>x.date.localeCompare(y.date))[0];
    const cutoff=sale&&sale.date.slice(0,7)<month?sale.date.slice(0,7):month;
    return Object.assign({},a,Domain.depreciation(a,cutoff),{disposed:!!(sale&&sale.date.slice(0,7)<=month)});
  });
}
// All mutations go through one lock; IDs make retries of submitted forms idempotent.
function mutate(action,p) {
  const lock=LockService.getScriptLock(); lock.waitLock(30000);
  try {
    p=p||{};
    const allowed=['saveAsset','transaction','addCategory','saveEmployee','createAudit','saveAuditLine','closeAudit','maintenance','settings','exportDepreciation'];
    if (!allowed.includes(action)) throw Error('Thao tác không hợp lệ');
    const key='DONE_'+String(p.requestId||'');
    if (!/^[a-zA-Z0-9_-]{8,100}$/.test(p.requestId||'')) throw Error('Thiếu mã yêu cầu');
    const cache=CacheService.getScriptCache(); if(cache.get(key)) return {message:'Yêu cầu đã được xử lý',data:getData()};
    const result=handlers[action](p); SpreadsheetApp.flush(); cache.put(key,'1',21600);
    return {message:result||'Đã lưu',data:getData()};
  } finally { lock.releaseLock(); }
}
const handlers = {
  saveAsset(p) {
    const list=rows('TaiSan'), old=p.id?list.find(a=>a.id===p.id):null;
    if(p.id&&!old) throw Error('Tài sản không tồn tại');
    const type=rows('LoaiTaiSan').find(t=>t.id===p.kind); if(!type) throw Error('Loại tài sản không tồn tại');
    if(old&&old.kind!==p.kind) throw Error('Không đổi loại của mã đã cấp; tạo mã mới');
    const a=Object.assign({},old||{},...['name','kind','group','unit','price','purchaseDate','purchaseTime','months','supplier','serial','warrantyDate','location','note'].map(k=>({[k]:p[k]===undefined?(old?old[k]:''):p[k]})));
    Domain.validateAsset(a); if(a.warrantyDate) Domain.date(a.warrantyDate);
    if (a.kind==='VT'&&!rows('NhomSanPham').some(g=>g.id===a.group)) throw Error('Chọn nhóm vật tư');
    a.updatedAt=now();
    if(old) { replaceRow('TaiSan',a.id,a); append('LichSu',[{id:uid(),assetId:a.id,action:'SUA',before:JSON.stringify(old),after:JSON.stringify(a),createdAt:now(),actor:actor()}]); }
    else {
      const prefix=type.prefix+(a.kind==='VT'?'-'+rows('NhomSanPham').find(g=>g.id===a.group).prefix:'');
      const seq=Math.max(0,...list.filter(x=>x.code.startsWith(prefix+'-')).map(x=>Number(x.code.slice(prefix.length+1))||0))+1;
      Object.assign(a,{id:uid(),code:prefix+'-'+String(seq).padStart(4,'0'),status:'TRONG_KHO',employeeId:'',department:'',condition:'Mới',sample:'false',createdAt:now()}); append('TaiSan',[a]);
    }
    return 'Đã lưu '+a.code+'; khấu hao được tính lại từ ngày và giá mua hiện tại.';
  },
  transaction(p) {
    if(rows('GiaoDich').some(t=>t.requestId===p.requestId)) return 'Phiếu đã được ghi';
    Domain.date(p.date); const assets=rows('TaiSan'), stock=Domain.stock(assets,rows('GiaoDich'));
    const ids=[...new Set(p.assetIds||[])]; if(!ids.length) throw Error('Chọn tài sản');
    const employee=rows('NhanVien').find(e=>e.id===p.employeeId&&e.active==='true');
    if(['CAP_PHAT','DIEU_CHUYEN'].includes(p.type)&&!employee) throw Error('Chọn nhân viên đang làm việc');
    const updates=[],tx=[];
    ids.forEach(id=>{
      const found=assets.find(x=>x.id===id); if(!found) throw Error('Không tìm thấy tài sản'); const a=Object.assign({},found);
      if(p.date<a.purchaseDate) throw Error('Ngày phiếu không được trước ngày mua');
      if(a.kind!=='VT'&&p.date<rows('GiaoDich').filter(t=>t.assetId===id).reduce((d,t)=>t.date>d?t.date:d,'')) throw Error('Ngày phiếu không được trước lần biến động gần nhất');
      let q=1,unitPrice=Number(a.price),amount=unitPrice;
      if(['NHAP_VT','XUAT_VT'].includes(p.type)) {
        if(a.kind!=='VT'||ids.length!==1) throw Error('Mỗi phiếu vật tư chọn một sản phẩm');
        q=Domain.number(p.quantity,'Số lượng',0.000001);
        if(p.date<rows('GiaoDich').filter(t=>t.assetId===id&&['NHAP_VT','XUAT_VT'].includes(t.type)).reduce((d,t)=>t.date>d?t.date:d,'')) throw Error('Không ghi lùi trước phiếu vật tư gần nhất; giá xuất dùng bình quân tại thời điểm ghi.');
        if(p.type==='XUAT_VT') { if(q>stock[id].quantity+1e-9) throw Error('Không đủ tồn kho'); unitPrice=stock[id].average; }
        else unitPrice=Domain.number(p.unitPrice,'Đơn giá nhập',0);
        amount=q*unitPrice;
      } else {
        a.status=Domain.transition(a,p.type);
        if(p.type==='THANH_LY') { if(!String(p.reason||'').trim()) throw Error('Nhập lý do thanh lý'); amount=Domain.number(p.amount,'Giá thu hồi',0); }
        if(['CAP_PHAT','DIEU_CHUYEN'].includes(p.type)) { a.employeeId=employee.id; a.department=employee.department; }
        else { a.employeeId=''; a.department=''; }
        a.location=p.location||(employee?employee.location:a.location); a.condition=p.condition||a.condition; a.updatedAt=now(); updates.push(a);
      }
      const original=assets.find(x=>x.id===id);
      tx.push({id:uid(),type:p.type,assetId:id,assetCode:a.code,assetName:a.name,date:p.date,quantity:q,unitPrice,amount,employeeId:employee?employee.id:'',employeeName:employee?employee.name:'',department:employee?employee.department:'',location:p.location||(employee?employee.location:a.location),condition:p.condition||a.condition,reason:p.reason,approver:p.approver,decision:p.decision,note:p.note,oldEmployee:original.employeeId,oldLocation:original.location,createdAt:now(),actor:actor(),requestId:p.requestId,sample:'false'});
    });
    // Validation completes before any writes. Sheets is not a transactional database.
    append('GiaoDich',tx); updates.forEach(a=>replaceRow('TaiSan',a.id,a)); return 'Đã ghi phiếu';
  },
  addCategory(p) {
    const table=p.table==='NhomSanPham'?'NhomSanPham':'LoaiTaiSan';
    const prefix=String(p.prefix||'').toUpperCase().trim(); if(!/^[A-Z][A-Z0-9]{1,7}$/.test(prefix)||!String(p.name||'').trim()) throw Error('Tên bắt buộc; tiền tố 2–8 chữ/số, bắt đầu bằng chữ');
    if(rows(table).some(r=>r.prefix===prefix||r.id===prefix)) throw Error('Tiền tố đã tồn tại');
    append(table,[{id:prefix,name:p.name,prefix,consumable:'false'}]); return 'Đã thêm danh mục';
  },
  saveEmployee(p) {
    if(!String(p.name||'').trim()) throw Error('Nhập tên nhân viên');
    if(p.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) throw Error('Email không hợp lệ');
    const e={id:p.id||uid(),name:p.name,department:p.department,location:p.location,email:p.email,active:p.active==='false'?'false':'true',sample:'false'};
    p.id?replaceRow('NhanVien',p.id,e):append('NhanVien',[e]); return 'Đã lưu nhân viên';
  },
  createAudit(p) {
    if(!String(p.name||'').trim()) throw Error('Nhập tên đợt kiểm kê'); Domain.date(p.date);
    const id=uid(), assets=rows('TaiSan').filter(a=>a.status!=='THANH_LY'), stock=Domain.stock(assets,rows('GiaoDich')), employees=rows('NhanVien');
    const lines=assets.map(a=>({id:uid(),auditId:id,assetId:a.id,assetCode:a.code,assetName:a.name,expected:a.kind==='VT'?stock[a.id].quantity:1,actual:'',result:'CHUA_KIEM',note:'',employeeName:(employees.find(e=>e.id===a.employeeId)||{}).name||'',location:a.location,updatedAt:now()}));
    append('DotKiemKe',[{id,name:p.name,date:p.date,status:'MO',createdAt:now()}]); append('ChiTietKiemKe',lines); return 'Đã tạo đợt kiểm kê với '+lines.length+' mục';
  },
  saveAuditLine(p) {
    const line=rows('ChiTietKiemKe').find(l=>l.id===p.id); if(!line) throw Error('Không tìm thấy dòng kiểm kê');
    if(!rows('DotKiemKe').some(a=>a.id===line.auditId&&a.status==='MO')) throw Error('Đợt kiểm kê đã đóng');
    if(!['CO_MAT','THIEU','HONG','SAI_VI_TRI'].includes(p.result)) throw Error('Kết quả không hợp lệ');
    const actual=Domain.number(p.actual,'Số lượng thực tế',0); if(p.result==='CO_MAT'&&actual!==Number(line.expected)) throw Error('Số lượng khác sổ; chọn Thiếu hoặc ghi rõ chênh lệch trong ghi chú');
    replaceRow('ChiTietKiemKe',p.id,Object.assign(line,{actual,result:p.result,note:p.note||'',updatedAt:now()})); return 'Đã ghi nhận; không tự sửa tồn kho';
  },
  closeAudit(p) { const a=rows('DotKiemKe').find(a=>a.id===p.id); if(!a) throw Error('Không tìm thấy đợt'); if(rows('ChiTietKiemKe').some(l=>l.auditId===a.id&&l.result==='CHUA_KIEM')) throw Error('Còn mục chưa kiểm kê'); a.status='DONG'; replaceRow('DotKiemKe',a.id,a); return 'Đã chốt kiểm kê'; },
  maintenance(p) { if(!rows('TaiSan').some(a=>a.id===p.assetId)) throw Error('Chọn tài sản'); Domain.date(p.date); if(p.nextDate) Domain.date(p.nextDate); if(!p.content) throw Error('Nhập nội dung'); append('BaoTriBaoHanh',[{id:uid(),assetId:p.assetId,date:p.date,content:p.content,cost:Domain.number(p.cost,'Chi phí',0),nextDate:p.nextDate,createdAt:now()}]); return 'Đã lưu bảo trì'; },
  settings(p) { const existing=config(); ['businessName','address','reminderEmail','reminderDays'].forEach(k=>{if(p[k]!==undefined) existing[k]=String(p[k]);}); if(existing.reminderEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(existing.reminderEmail)) throw Error('Email không hợp lệ'); Domain.number(existing.reminderDays,'Số ngày nhắc',0); const s=sheet('CauHinh'); if(s.getLastRow()>1)s.getRange(2,1,s.getLastRow()-1,2).clearContent(); append('CauHinh',Object.keys(existing).map(k=>({key:k,value:existing[k]}))); return 'Đã lưu cài đặt'; },
  exportDepreciation(p) { const data=getReport(p.month).map(a=>({month:p.month,assetCode:a.code,assetName:a.name,price:a.price,monthly:a.monthly,accumulated:a.accumulated,remaining:a.remaining})); const s=sheet('KhauHaoThang'); if(s.getLastRow()>1)s.getRange(2,1,s.getLastRow()-1,7).clearContent(); append('KhauHaoThang',data); return 'Đã xuất khấu hao tháng '+p.month+' vào tab KhauHaoThang'; }
};
function enableReminders() {
  if (!config().reminderEmail) throw Error('Điền email trong Cài đặt trước.');
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='sendReminders').forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('sendReminders').timeBased().everyDays(1).atHour(8).inTimezone('Asia/Ho_Chi_Minh').create(); return 'Đã bật nhắc hằng ngày khoảng 8 giờ';
}
function sendReminders() {
  const c=config(); if(!c.reminderEmail) return;
  const start=today(), end=new Date(start+'T00:00:00Z'); end.setUTCDate(end.getUTCDate()+Number(c.reminderDays||30)); const limit=end.toISOString().slice(0,10);
  const assets=rows('TaiSan'), messages=assets.filter(a=>a.status!=='THANH_LY'&&a.warrantyDate&&a.warrantyDate>=start&&a.warrantyDate<=limit).map(a=>a.code+' '+a.name+' hết bảo hành: '+a.warrantyDate);
  rows('BaoTriBaoHanh').forEach(m=>{if(m.nextDate&&m.nextDate<=limit&&assets.some(a=>a.id===m.assetId&&a.status!=='THANH_LY')&&!rows('BaoTriBaoHanh').some(n=>n.assetId===m.assetId&&n.date>=m.nextDate)) messages.push('Bảo trì '+(assets.find(a=>a.id===m.assetId)||{}).code+': '+m.nextDate);});
  if(messages.length&&MailApp.getRemainingDailyQuota()>0) MailApp.sendEmail(c.reminderEmail,'Nhắc tài sản — '+c.businessName,messages.join('\n'));
}
function saveDocument(html,title) {
  if(typeof html!=='string'||html.length>300000) throw Error('Tài liệu không hợp lệ');
  const props=PropertiesService.getScriptProperties(); let folder;
  const id=props.getProperty('DOCUMENT_FOLDER'); if(id) folder=DriveApp.getFolderById(id); else {folder=DriveApp.createFolder('Biên bản quản lý tài sản');props.setProperty('DOCUMENT_FOLDER',folder.getId());}
  const blob=Utilities.newBlob(html,'text/html',String(title||'Biên bản').slice(0,100)+'.html').getAs('application/pdf');
  const file=folder.createFile(blob); return file.getUrl();
}
