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
    const rules = { CAP_PHAT: ['TRONG_KHO'], DIEU_CHUYEN: ['DANG_DUNG'], THU_HOI: ['DANG_DUNG'], THANH_LY: ['TRONG_KHO', 'DANG_DUNG'] };
    if (asset.kind === 'VT') throw Error('Vật tư dùng nhập / xuất kho');
    if (!rules[type] || !rules[type].includes(asset.status)) throw Error('Trạng thái hiện tại không cho phép thao tác này');
    return type === 'THANH_LY' ? 'THANH_LY' : type === 'THU_HOI' ? 'TRONG_KHO' : 'DANG_DUNG';
  }
  return { number, date, depreciation, validateAsset, stock, transition };
})();
if (typeof module !== 'undefined') module.exports = Domain;
