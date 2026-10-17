/* Pure business rules; shared by Apps Script and Node tests. */
var Domain = (() => {
  function number(v, name, min) {
    if (v === '' || v === null || v === undefined || !Number.isFinite(Number(v)) || Number(v) < min) throw Error(name + ' không hợp lệ');
    return Number(v);
  }
  function date(v) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v || '')) throw Error('Ngày không hợp lệ');
    const d = new Date(v + 'T00:00:00Z');
    if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== v) throw Error('Ngày không hợp lệ');
    return v;
  }
  function depreciation(asset, month) {
    if (asset.kind === 'VT') return { monthly: 0, accumulated: 0, remaining: Number(asset.price) };
    if (!/^\d{4}-\d{2}$/.test(month)) throw Error('Tháng không hợp lệ');
    date(month + '-01'); date(asset.purchaseDate);
    const price = number(asset.price, 'Giá mua', 0), life = number(asset.months, 'Thời gian khấu hao', 1);
    if (!Number.isInteger(life)) throw Error('Thời gian khấu hao phải là số tháng nguyên');
    const start = asset.purchaseDate.slice(0, 7).split('-').map(Number), end = month.split('-').map(Number);
    const elapsed = Math.max(0, Math.min(life, (end[0] - start[0]) * 12 + end[1] - start[1] + 1));
    const accumulated = Math.min(price, Math.round(price * elapsed / life));
    return { monthly: Math.round(price / life), accumulated, remaining: price - accumulated };
  }
  function validateAsset(a) {
    if (!String(a.name || '').trim()) throw Error('Nhập tên tài sản / sản phẩm');
    date(a.purchaseDate);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(a.purchaseTime || '00:00')) throw Error('Giờ mua không hợp lệ');
    number(a.price, 'Giá mua', 0);
    if (a.kind !== 'VT') { const n = number(a.months, 'Số tháng khấu hao', 1); if (!Number.isInteger(n)) throw Error('Số tháng phải là số nguyên'); }
    if (!String(a.unit || '').trim()) throw Error('Nhập đơn vị tính');
    return a;
  }
  function stock(items, transactions) {
    const result = {};
    items.filter(a => a.kind === 'VT').forEach(a => { result[a.id] = { quantity: 0, value: 0, average: 0 }; });
    transactions.forEach(t => {
      const s = result[t.assetId]; if (!s) return;
      const q = Number(t.quantity), value = Number(t.amount);
      if (t.type === 'NHAP_VT') { s.quantity += q; s.value += value; }
      if (t.type === 'XUAT_VT') { s.quantity -= q; s.value -= value; }
      if (Math.abs(s.value) < 0.01) s.value = 0;
      s.average = s.quantity > 0 ? s.value / s.quantity : 0;
    });
    return result;
  }
  function transition(asset, type) {
    const rules = {
      CAP_PHAT: ['TRONG_KHO'], DIEU_CHUYEN: ['DANG_DUNG'],
      THU_HOI: ['DANG_DUNG'], CHO_MUON: ['TRONG_KHO'], TRA_MUON: ['DANG_MUON'],
      SUA_CHUA: ['TRONG_KHO','DANG_DUNG','HONG'], HOAN_TAT_SUA: ['DANG_SUA'],
      BAO_HONG: ['TRONG_KHO','DANG_DUNG','DANG_MUON'],
      BAO_MAT: ['TRONG_KHO','DANG_DUNG','DANG_MUON','HONG'],
      THANH_LY: ['TRONG_KHO','DANG_DUNG','HONG','THAT_LAC','DANG_SUA']
    };
    if (asset.kind === 'VT') throw Error('Vật tư dùng nhập / xuất kho');
    if (!rules[type] || !rules[type].includes(asset.status)) throw Error('Trạng thái hiện tại không cho phép thao tác này');
    return ({THANH_LY:'THANH_LY',THU_HOI:'TRONG_KHO',TRA_MUON:'TRONG_KHO',
      CHO_MUON:'DANG_MUON',SUA_CHUA:'DANG_SUA',BAO_HONG:'HONG',BAO_MAT:'THAT_LAC',
      HOAN_TAT_SUA:asset.employeeId||asset.department?'DANG_DUNG':'TRONG_KHO'})[type] || 'DANG_DUNG';
  }
  function emails(value) {
    const list = [...new Set(String(value || '').split(/[,;\s]+/).filter(Boolean).map(s=>s.toLowerCase()))];
    if (list.some(s=>!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))) throw Error('Email không hợp lệ');
    return list;
  }
  function alerts(data, today, days) {
    date(today); const until = new Date(today+'T00:00:00Z'); until.setUTCDate(until.getUTCDate()+Number(days||30));
    const limit = until.toISOString().slice(0,10), list = [];
    data.assets.filter(a=>a.kind!=='VT'&&a.status!=='THANH_LY').forEach(a=>{
      if(a.status==='DANG_MUON'&&a.loanDueDate&&a.loanDueDate<today) list.push({type:'loan',assetId:a.id,title:'Mượn quá hạn chưa trả',date:a.loanDueDate,employeeId:a.employeeId});
      const completed=(data.maintenance||[]).filter(m=>m.assetId===a.id);
      const nextDates=completed.filter(m=>m.nextDate&&!completed.some(n=>n.date>=m.nextDate)).map(m=>m.nextDate);
      if(a.nextMaintenance&&!completed.some(m=>m.date>=a.nextMaintenance)) nextDates.push(a.nextMaintenance);
      const next=nextDates.sort()[0];
      if(next&&next<=limit) list.push({type:next<today?'maintenanceLate':'maintenanceSoon',assetId:a.id,title:next<today?'Quá hạn bảo trì':'Bảo trì trong thời gian tới',date:next,employeeId:a.employeeId});
      if(a.warrantyDate&&a.warrantyDate>=today&&a.warrantyDate<=limit) list.push({type:'warranty',assetId:a.id,title:'Sắp hết bảo hành',date:a.warrantyDate,employeeId:a.employeeId});
      if(a.status==='HONG') list.push({type:'broken',assetId:a.id,title:'Hỏng đang chờ sửa chữa',date:'',employeeId:a.employeeId});
      if(a.status==='THAT_LAC') list.push({type:'lost',assetId:a.id,title:'Thất lạc',date:'',employeeId:a.employeeId});
    });
    return list;
  }
  return { number, date, depreciation, validateAsset, stock, transition, emails, alerts };
})();
if (typeof module !== 'undefined') module.exports = Domain;
