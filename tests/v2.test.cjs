const {test}=require('node:test'),assert=require('node:assert/strict');
const {app}=require('./helpers.cjs');
const Domain=require('../Domain.js');
const fresh=a=>a.data().assets.find(x=>x.kind==='MI'&&x.status==='TRONG_KHO');
function tx(a,type,id,extra={}){return a.run('transaction',{assetIds:[id],type,date:'2026-10-17',...extra});}
test('V1 → V2 migration appends columns and creates new tabs without erasing records',()=>{
 const a=app(),before=a.data();const widths={TaiSan:22,LoaiTaiSan:4,NhomSanPham:3,NhanVien:7,GiaoDich:24,DotKiemKe:5,ChiTietKiemKe:12,LichSu:7,BaoTriBaoHanh:7,CauHinh:2,KhauHaoThang:7,MauBieu:2};
 for(const name of Object.keys(a.sheets)){if(!widths[name])delete a.sheets[name];else{a.sheets[name].values=a.sheets[name].values.map(r=>r.slice(0,widths[name]));a.sheets[name].maxColumns=26;}}
 a.c.setup();const after=a.data();assert.equal(after.assets.length,30);assert.equal(after.employees.length,4);assert.equal(after.transactions.length,before.transactions.length);
 for(const old of before.assets){const updated=after.assets.find(x=>x.id===old.id);assert.equal(updated.code,old.code);assert.equal(updated.price,old.price);assert.equal(updated.employeeId,old.employeeId);}
 assert.equal(after.settings.reminderEmail,before.settings.reminderEmail);assert.equal(after.settings.remindersEnabled,'false');a.c.setup();assert.equal(a.data().assets.length,30);
});
test('Unexpected existing header aborts migration before rewriting headers or data',()=>{const a=app();a.sheets.TaiSan.values[0][1]='ma-da-doi';const original=JSON.stringify(a.sheets.TaiSan.values);assert.throws(()=>a.c.setup(),/cấu trúc khác/);assert.equal(JSON.stringify(a.sheets.TaiSan.values),original);});
test('Loan, due date, overdue alert and return follow the actual lifecycle',()=>{
 const a=app(),asset=fresh(a);assert.throws(()=>tx(a,'CHO_MUON',asset.id,{employeeId:'NV001',dueDate:'2026-10-16'}),/Hạn trả/);
 tx(a,'CHO_MUON',asset.id,{employeeId:'NV001',dueDate:'2026-10-18'});assert.equal(a.data().assets.find(x=>x.id===asset.id).status,'DANG_MUON');
 assert.throws(()=>tx(a,'CAP_PHAT',asset.id,{employeeId:'NV002'}));a.setToday('2026-10-19');assert.ok(a.data().alerts.some(x=>x.type==='loan'&&x.assetId===asset.id));
 tx(a,'TRA_MUON',asset.id,{date:'2026-10-19'});const returned=a.data().assets.find(x=>x.id===asset.id);assert.equal(returned.status,'TRONG_KHO');assert.equal(returned.employeeId,'');assert.equal(returned.loanDueDate,'');assert.ok(!a.data().alerts.some(x=>x.assetId===asset.id&&x.type==='loan'));
});
test('Assignment to a department without a person and repair preserves custody',()=>{
 const a=app(),asset=fresh(a);tx(a,'CAP_PHAT',asset.id,{department:'Kho',location:'Bàn kho'});assert.equal(a.data().assets.find(x=>x.id===asset.id).department,'Kho');
 tx(a,'BAO_HONG',asset.id);assert.equal(a.data().assets.find(x=>x.id===asset.id).status,'HONG');tx(a,'SUA_CHUA',asset.id);assert.equal(a.data().assets.find(x=>x.id===asset.id).status,'DANG_SUA');tx(a,'HOAN_TAT_SUA',asset.id,{condition:'Tốt'});assert.equal(a.data().assets.find(x=>x.id===asset.id).status,'DANG_DUNG');
});
test('Sale preview and posted gain/loss use full depreciation in the disposal month',()=>{
 const a=app(),asset=fresh(a);a.run('saveAsset',{...asset,price:24000000,months:24,purchaseDate:'2026-10-17'});const preview=a.c.getSalePreview([asset.id],'2026-10-17',2000000);assert.equal(preview.bookValue,23000000);assert.equal(preview.gainLoss,-21000000);
 tx(a,'THANH_LY',asset.id,{amount:2000000,reason:'Đổi máy',method:'BAN_LAI'});const posted=a.data().transactions.at(-1);assert.equal(Number(posted.bookValue),23000000);assert.equal(Number(posted.gainLoss),-21000000);assert.equal(a.c.getReport('2027-01').find(x=>x.id===asset.id).remaining,23000000);
});
test('A service failure after posting is repaired on retry, exactly once',()=>{
 const a=app(),asset=fresh(a),initial=a.data().transactions.length,p={type:'CAP_PHAT',assetIds:[asset.id],employeeId:'NV001',date:'2026-10-17',requestId:'recover_request'};
 a.failNextWrite('TaiSan');assert.throws(()=>a.run('transaction',p),/Simulated/);assert.equal(a.c.rows('YeuCau').find(x=>x.id===p.requestId).status,'PENDING');
 a.run('transaction',p);assert.equal(a.data().transactions.length,initial+1);assert.equal(a.data().assets.find(x=>x.id===asset.id).status,'DANG_DUNG');assert.equal(a.c.rows('YeuCau').find(x=>x.id===p.requestId).status,'DONE');
});
test('Multi-recipient reminders honor hour, personal scope, deduplication and disable',()=>{
 const a=app(),one=a.data().assets.find(x=>x.employeeId==='NV001'),two=a.data().assets.find(x=>x.employeeId==='NV002');
 a.run('saveAsset',{...one,warrantyDate:'2026-10-25'});a.run('saveAsset',{...two,warrantyDate:'2026-10-26'});
 a.run('saveEmployee',{...a.data().employees[0],email:'an@example.test'});a.run('saveEmployee',{...a.data().employees[1],email:'ha@example.test'});
 a.run('settings',{reminderEmail:'kho@example.test,chu@example.test',reminderHour:'9',remindersEnabled:'true',notifyAssignees:'true',copyOwner:'true'});
 assert.equal(a.triggers.length,1);assert.equal(a.triggers[0].hour,9);a.c.sendReminders();assert.equal(a.sent.length,5);
 const own=a.sent.find(x=>x.to==='an@example.test');assert.ok(own.body.includes(one.code));assert.ok(!own.body.includes(two.code));a.c.sendReminders();assert.equal(a.sent.length,5);
 a.run('settings',{remindersEnabled:'false'});assert.equal(a.triggers.length,0);a.setToday('2026-10-18');a.c.sendReminders();assert.equal(a.sent.length,5);
});
test('Maintenance completion clears due alert, cost report and document are available',()=>{
 const a=app(),asset=fresh(a);a.run('saveAsset',{...asset,nextMaintenance:'2026-10-17'});assert.ok(a.data().alerts.some(x=>x.assetId===asset.id&&x.type==='maintenanceSoon'));
 a.run('maintenance',{assetId:asset.id,date:'2026-10-17',nextDate:'2027-01-17',cost:250000,content:'Vệ sinh đầu phun',requestId:'maintenance_doc'});
 assert.ok(!a.data().alerts.some(x=>x.assetId===asset.id&&x.type==='maintenanceSoon'));const d=a.c.createDocument('maintenance_doc',true);assert.ok(d.html.includes('Vệ sinh đầu phun'));assert.ok(d.url.startsWith('https://drive.google.com/'));const count=a.files.size;a.c.createDocument('maintenance_doc',true);assert.equal(a.files.size,count);
});
test('Automatic PDF persists one receipt for a multi-asset issue, remains private in mocks',()=>{
 const a=app(),assets=a.data().assets.filter(x=>x.kind==='MI'&&x.status==='TRONG_KHO');a.run('transaction',{assetIds:assets.map(a=>a.id),type:'CAP_PHAT',employeeId:'NV001',date:'2026-10-17',savePdf:'true',requestId:'auto_pdf_request'});
 const lines=a.data().transactions.filter(t=>t.requestId==='auto_pdf_request');assert.equal(new Set(lines.map(t=>t.documentUrl)).size,1);assert.ok(lines[0].documentUrl);assert.equal(a.files.size,1);const d=a.c.createDocument('auto_pdf_request',false);assert.ok(d.html.includes(assets[0].name));assert.ok(d.html.includes(assets[1].name));
});
test('Bad emails, unsupported URL and invalid clock fail without saving settings',()=>{
 const a=app();assert.throws(()=>a.run('settings',{reminderEmail:'x@@example.com'}));assert.throws(()=>a.run('settings',{reminderHour:24}));assert.throws(()=>a.run('settings',{webAppUrl:'https://evil.test/app'}));assert.equal(a.data().settings.reminderHour,'8');assert.deepEqual(Domain.emails('a@x.test; a@x.test b@y.test'),['a@x.test','b@y.test']);
});
test('Asset photos reject disguised files and round-trip permitted image bytes',()=>{
 const a=app(),asset=fresh(a);assert.throws(()=>a.c.uploadPhoto(asset.id,Buffer.from('<script>').toString('base64'),'image/png'),/định dạng/);
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');a.c.uploadPhoto(asset.id,png.toString('base64'),'image/png');assert.equal(a.c.getAssetPhoto(asset.id),'data:image/png;base64,'+png.toString('base64'));
});
test('Audit scope uses chosen location and manual record does not change stock',()=>{
 const a=app();a.run('createAudit',{name:'Kho',date:'2026-10-17',location:'Kho chính'});const d=a.data();assert.ok(d.auditLines.length<30);assert.ok(d.auditLines.every(l=>l.location==='Kho chính'));assert.ok(d.appUrl.endsWith('/exec'));
});
test('Excel export creates an actual XLSX export URL and rejects malformed datasets',()=>{
 const a=app();const out=a.c.exportExcel('TaiSan',[['Mã','Giá'],['MI-1',24000000]]);assert.ok(out.url.endsWith('/export?format=xlsx'));assert.ok(out.sheetUrl.endsWith('/edit'));assert.throws(()=>a.c.exportExcel('bad',[['x'],['x','y']]));
});
test('Filtered bulk audit marking touches only selected pending lines in its own audit',()=>{
 const a=app();a.run('createAudit',{name:'Đợt A',date:'2026-10-17'});const d=a.data(),ids=d.auditLines.slice(0,2).map(l=>l.id),auditId=d.audits[0].id;
 a.run('markAuditPresent',{auditId,ids});assert.equal(a.data().auditLines.filter(l=>l.result==='CO_MAT').length,2);a.run('markAuditPresent',{auditId,ids});assert.equal(a.data().auditLines.filter(l=>l.result==='CO_MAT').length,2);
 a.run('createAudit',{name:'Đợt B',date:'2026-10-17'});assert.throws(()=>a.run('markAuditPresent',{auditId:a.data().audits[1].id,ids}));
});
test('Code preview follows type/group and is not reserved until save',()=>{
 const a=app();assert.equal(a.c.nextAssetCode('MI',''),'MI-0007');assert.equal(a.c.nextAssetCode('VT','GI'),'VT-GI-0004');assert.throws(()=>a.c.nextAssetCode('VT','INVALID'));
});
test('Migration preserves a previously configured V1 reminder trigger and recipient',()=>{
 const a=app();a.run('settings',{reminderEmail:'kho@example.test'});a.c.ScriptApp.newTrigger('sendReminders').timeBased().everyDays(1).atHour(8).inTimezone('Asia/Ho_Chi_Minh').create();
 const index=a.sheets.CauHinh.values.findIndex(r=>r[0]==='remindersEnabled');a.sheets.CauHinh.values.splice(index,1);a.c.setup();assert.equal(a.data().settings.remindersEnabled,'true');assert.equal(a.data().settings.reminderEmail,'kho@example.test');assert.equal(a.triggers.length,1);
});
test('Dashboard reads each populated table once per execution and reuses the spreadsheet connection',()=>{
 const a=app();a.newExecution();a.data();assert.equal(a.metrics.opens,1);assert.ok(Object.keys(a.metrics.reads).length>5);assert.ok(Object.values(a.metrics.reads).every(n=>n===1));
 const old=fresh(a);a.run('saveAsset',{...old,price:12345678});assert.equal(Number(a.data().assets.find(x=>x.id===old.id).price),12345678);
});
test('Connection diagnostic only reads data and reports record counts',()=>{
 const a=app(),before=JSON.stringify(a.data().assets),n=a.data().transactions.length;a.newExecution();const d=a.c.diagnose();assert.equal(d.version,2);assert.equal(d.assets,30);assert.equal(d.employees,4);assert.equal(JSON.stringify(a.data().assets),before);assert.equal(a.data().transactions.length,n);
});
