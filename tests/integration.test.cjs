const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function app(){
 class Range{constructor(s,r,c,n,m){Object.assign(this,{s,r,c,n,m})}getValues(){return Array.from({length:this.n},(_,i)=>Array.from({length:this.m},(_,j)=>this.s.values[this.r-1+i]?.[this.c-1+j]??''))}getDisplayValues(){return this.getValues().map(r=>r.map(String))}setValues(v){v.forEach((r,i)=>{const row=this.s.values[this.r-1+i]??=[];r.forEach((x,j)=>row[this.c-1+j]=typeof x==='string'&&x.startsWith("'")?x.slice(1):x)});return this}setBackground(){return this}setFontColor(){return this}setFontWeight(){return this}setNumberFormat(){return this}createFilter(){this.s.filter=true;return this}clearContent(){for(let i=0;i<this.n;i++)for(let j=0;j<this.m;j++)if(this.s.values[this.r-1+i])this.s.values[this.r-1+i][this.c-1+j]='';return this}}
 class Sheet{constructor(){this.values=[]}getLastRow(){let i=this.values.length;while(i&&!this.values[i-1].some(x=>x!==''))i--;return i}getMaxRows(){return 1000}getRange(...a){return new Range(this,...a)}getFilter(){return this.filter}setFrozenRows(){}}
 const sheets={},ss={getId:()=> 'test',setSpreadsheetTimeZone(){},getSheetByName:n=>sheets[n],insertSheet:n=>sheets[n]=new Sheet()},props={},cache={};let locked=false;
 const c=vm.createContext({console,SpreadsheetApp:{getActiveSpreadsheet:()=>ss,openById:()=>ss,flush(){}},PropertiesService:{getScriptProperties:()=>({setProperty(k,v){props[k]=v},getProperty:k=>props[k]})},Session:{getEffectiveUser:()=>({getEmail:()=> 'owner@example.test'})},Utilities:{getUuid:()=>require('node:crypto').randomUUID(),formatDate:(d,tz,f)=>f==='yyyy-MM-dd'? '2026-10-17':'2026-10-17T09:00:00'},LockService:{getScriptLock:()=>({waitLock(){assert.equal(locked,false);locked=true},releaseLock(){locked=false}})},CacheService:{getScriptCache:()=>({get:k=>cache[k],put:(k,v)=>cache[k]=v})}});
 for(const f of ['Domain.js','Code.gs','Seed.gs'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),c,{filename:f});
 vm.runInContext('setup(); seedDemo()',c);
 let request=0;return {c,run:(action,p)=>c.mutate(action,{...p,requestId:p.requestId||'request_'+(++request)}),data:()=>c.getData()};
}
module.exports={app};
test('Khởi tạo lặp không mất dữ liệu; dữ liệu mẫu đúng và không nạp trùng',()=>{
 const a=app();assert.equal(a.data().assets.length,30);assert.equal(a.data().employees.length,4);a.c.setup();assert.equal(a.data().assets.length,30);assert.throws(()=>a.c.seedDemo());
});
test('Luồng cấp phát, chống trùng phiếu, điều chuyển, thu hồi, thanh lý',()=>{
 const a=app(),asset=a.data().assets.find(x=>x.kind==='MI'&&x.status==='TRONG_KHO'),id=asset.id;
 const p={assetIds:[id],type:'CAP_PHAT',employeeId:'NV001',date:'2026-10-17',requestId:'repeat_request'};
 a.run('transaction',p);const n=a.data().transactions.length;a.run('transaction',p);assert.equal(a.data().transactions.length,n);
 assert.equal(a.data().assets.find(x=>x.id===id).employeeId,'NV001');assert.throws(()=>a.run('transaction',{...p,requestId:'different_request'}));
 a.run('transaction',{...p,type:'DIEU_CHUYEN',employeeId:'NV002',requestId:'transfer_request'});
 const t=a.data().transactions.at(-1);assert.equal(t.oldEmployee,'NV001');assert.equal(t.employeeName,'Trần Thu Hà');
 a.run('transaction',{assetIds:[id],type:'THU_HOI',date:'2026-10-17',location:'Kho chính'});assert.equal(a.data().assets.find(x=>x.id===id).status,'TRONG_KHO');
 a.run('transaction',{assetIds:[id],type:'THANH_LY',date:'2026-10-17',reason:'Không dùng',amount:100000});assert.equal(a.data().assets.find(x=>x.id===id).status,'THANH_LY');
 assert.throws(()=>a.run('transaction',{assetIds:[id],type:'THU_HOI',date:'2026-10-17'}));
});
test('Xuất kho không âm; giá bình quân và không ghi lùi phiếu',()=>{
 const a=app(),id=a.data().assets.find(x=>x.kind==='VT').id;const s=a.data().stock[id];
 assert.throws(()=>a.run('transaction',{assetIds:[id],type:'XUAT_VT',date:'2026-10-17',quantity:s.quantity+1}));
 a.run('transaction',{assetIds:[id],type:'NHAP_VT',date:'2026-10-18',quantity:s.quantity,unitPrice:s.average*3});
 assert.equal(a.data().stock[id].average,s.average*2);
 assert.throws(()=>a.run('transaction',{assetIds:[id],type:'XUAT_VT',date:'2026-10-17',quantity:1}));
 a.run('transaction',{assetIds:[id],type:'XUAT_VT',date:'2026-10-18',quantity:10});assert.equal(a.data().stock[id].quantity,s.quantity*2-10);
});
test('Sửa ngày giờ và giá mua tính lại khấu hao, giữ nguyên mã và lưu lịch sử',()=>{
 const a=app(),old=a.data().assets.find(x=>x.kind==='MI');a.run('saveAsset',{...old,price:24000000,months:24,purchaseDate:'2026-09-20',purchaseTime:'16:45'});
 const updated=a.data().assets.find(x=>x.id===old.id);assert.equal(updated.code,old.code);assert.equal(updated.purchaseTime,'16:45');assert.equal(a.c.getReport('2026-10').find(x=>x.id===old.id).accumulated,2000000);assert.equal(a.data().history.length,1);
 a.run('exportDepreciation',{month:'2026-10'});assert.equal(a.c.rows('KhauHaoThang').length,10);
});
test('Kiểm kê snapshot, ghi chênh lệch không sửa tồn và cấm chốt khi còn chưa kiểm',()=>{
 const a=app();a.run('createAudit',{name:'Đợt thử',date:'2026-10-17'});let d=a.data();const audit=d.audits[0],line=d.auditLines[0],before=d.stock[line.assetId]?.quantity;
 assert.equal(d.auditLines.length,30);assert.throws(()=>a.run('closeAudit',{id:audit.id}));
 a.run('saveAuditLine',{id:line.id,result:'THIEU',actual:0,note:'Cần đối chiếu'});assert.equal(a.data().stock[line.assetId]?.quantity,before);
 for(const l of a.data().auditLines.filter(x=>x.result==='CHUA_KIEM'))a.run('saveAuditLine',{id:l.id,result:'CO_MAT',actual:l.expected});
 a.run('closeAudit',{id:audit.id});assert.equal(a.data().audits[0].status,'DONG');assert.throws(()=>a.run('saveAuditLine',{id:line.id,result:'CO_MAT',actual:line.expected}));
});
test('Thêm loại tài sản và nhóm vật tư mở rộng; mã không trùng',()=>{
 const a=app();a.run('addCategory',{table:'LoaiTaiSan',name:'Máy cán',prefix:'MC'});
 const p={name:'Máy cán mới',kind:'MC',unit:'Cái',price:1000,purchaseDate:'2026-10-17',purchaseTime:'10:00',months:12};a.run('saveAsset',p);a.run('saveAsset',p);
 const codes=a.data().assets.filter(x=>x.kind==='MC').map(x=>x.code);assert.deepEqual([...codes],['MC-0001','MC-0002']);assert.throws(()=>a.run('addCategory',{name:'Trùng',prefix:'MC'}));
});
test('Khấu hao dừng sau tháng thanh lý, loại tài sản tương lai khỏi báo cáo',()=>{
 const a=app(),asset=a.data().assets.find(x=>x.kind==='MI'&&x.status==='TRONG_KHO');
 assert.equal(a.c.getReport('2026-09').length,0);
 a.run('transaction',{assetIds:[asset.id],type:'THANH_LY',date:'2026-10-17',reason:'Đổi máy',amount:0});
 const oct=a.c.getReport('2026-10').find(x=>x.id===asset.id),nov=a.c.getReport('2026-11').find(x=>x.id===asset.id);
 assert.equal(nov.accumulated,oct.accumulated);assert.equal(nov.disposed,true);
});
test('Phiếu nhiều tài sản: kiểm tra toàn bộ trước khi ghi, không ghi nửa phiếu lỗi',()=>{
 const a=app(),d=a.data(),inStock=d.assets.find(x=>x.kind==='MI'&&x.status==='TRONG_KHO'),issued=d.assets.find(x=>x.kind==='MI'&&x.status==='DANG_DUNG');
 assert.throws(()=>a.run('transaction',{assetIds:[inStock.id,issued.id],type:'CAP_PHAT',employeeId:'NV001',date:'2026-10-17'}));
 assert.equal(a.data().transactions.length,d.transactions.length);assert.equal(a.data().assets.find(x=>x.id===inStock.id).status,'TRONG_KHO');
});
