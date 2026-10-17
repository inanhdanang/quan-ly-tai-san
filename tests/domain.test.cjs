const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../Domain.js');
test('Khấu hao đủ tháng mua, trước tháng mua và giới hạn nguyên giá',()=>{
 const a={kind:'MI',price:24000000,months:24,purchaseDate:'2026-10-20'};
 assert.deepEqual(D.depreciation(a,'2026-10'),{monthly:1000000,accumulated:1000000,remaining:23000000});
 assert.equal(D.depreciation(a,'2026-09').accumulated,0);
 assert.equal(D.depreciation(a,'2028-09').remaining,0);
 assert.equal(D.depreciation(a,'2030-10').accumulated,24000000);
 assert.equal(D.depreciation({...a,price:12000000,purchaseDate:'2026-09-30'},'2026-10').accumulated,1000000);
});
test('Làm tròn không vượt nguyên giá; vật tư không khấu hao',()=>{
 assert.equal(D.depreciation({kind:'KH',price:100,months:3,purchaseDate:'2026-01-01'},'2026-03').remaining,0);
 assert.equal(D.depreciation({kind:'VT',price:100},'2026-03').accumulated,0);
});
test('Ngày, giờ, số tiền và số tháng được kiểm tra',()=>{
 assert.throws(()=>D.date('2026-02-30'));
 assert.throws(()=>D.number('NaN','Giá',0));
 assert.throws(()=>D.validateAsset({name:'Máy',kind:'MI',price:1,purchaseDate:'2026-01-01',purchaseTime:'25:00',months:36,unit:'Cái'}));
 assert.throws(()=>D.depreciation({kind:'MI',price:100,months:0,purchaseDate:'2026-01-01'},'2026-01'));
});
test('Bình quân di động: nhập nhiều giá, xuất và nhập lại',()=>{
 const rows=[{assetId:'a',type:'NHAP_VT',quantity:10,amount:100},{assetId:'a',type:'NHAP_VT',quantity:10,amount:300},{assetId:'a',type:'XUAT_VT',quantity:5,amount:100}];
 assert.deepEqual(D.stock([{id:'a',kind:'VT'}],rows).a,{quantity:15,value:300,average:20});
});
test('Vòng đời hợp lệ và từ chối cấp phát trùng, thu hồi sai, xuất vật tư sai',()=>{
 assert.equal(D.transition({kind:'MI',status:'TRONG_KHO'},'CAP_PHAT'),'DANG_DUNG');
 assert.equal(D.transition({kind:'MI',status:'DANG_DUNG'},'THU_HOI'),'TRONG_KHO');
 assert.equal(D.transition({kind:'MI',status:'TRONG_KHO'},'THANH_LY'),'THANH_LY');
 assert.throws(()=>D.transition({kind:'MI',status:'DANG_DUNG'},'CAP_PHAT'));
 assert.throws(()=>D.transition({kind:'MI',status:'THANH_LY'},'THU_HOI'));
 assert.throws(()=>D.transition({kind:'VT',status:'TRONG_KHO'},'CAP_PHAT'));
});
