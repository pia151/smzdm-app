const { createHash } = require('crypto');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const raw = fs.readFileSync(envPath, 'utf8');
const lines = raw.split('\n');
let appKey = '', s1 = '';
for (const line of lines) {
  if (line.indexOf('JD_APP_K') >= 0) appKey = line.split('=').slice(1).join('=').trim();
  if (line.indexOf('JD_APP_S') >= 0) s1 = line.split('=').slice(1).join('=').trim();
}

const GW = 'https://api.jd.com/routerjson';

function gS(ps) {
  const e = Object.entries(ps).filter(([k, v]) => v !== '' && k !== 'sign');
  e.sort((a, b) => a[0].localeCompare(b[0]));
  return createHash('md5').update(s1 + e.map(x => x[0] + x[1]).join('') + s1, 'utf8').digest('hex').toUpperCase();
}

async function ca(m, bz) {
  const n = new Date();
  const ts = n.getFullYear() + '-' + String(n.getMonth()+1).padStart(2,'0') + '-' + String(n.getDate()).padStart(2,'0') + ' ' + String(n.getHours()).padStart(2,'0') + ':' + String(n.getMinutes()).padStart(2,'0') + ':' + String(n.getSeconds()).padStart(2,'0');

  const ps = { method: m, app_key: appKey, timestamp: ts, format: 'json', v: '1.0', sign_method: 'md5', param_json: JSON.stringify(bz) };
  ps.sign = gS(ps);
  const bd = Object.entries(ps).map(e => encodeURIComponent(e[0]) + '=' + encodeURIComponent(e[1])).join('&');
  const r = await fetch(GW, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: bd });
  return r.text();
}

async function t() {
  // Try to figure out the correct param structure by checking if
  // the API actually exists at all - try jingfen with minimal params
  console.log('=== Minimal jingfen params ===');
  
  // 1. Just eliteId alone
  let r = await ca('jd.union.open.goods.jingfen.query', { eliteId: 1 });
  console.log('eliteId:1 =>', JSON.parse(JSON.parse(r)[Object.keys(JSON.parse(r))[0]].queryResult));
  
  // 2. Try with empty goodsReq
  r = await ca('jd.union.open.goods.jingfen.query', {});
  console.log('empty =>', JSON.parse(JSON.parse(r)[Object.keys(JSON.parse(r))[0]].queryResult));
  
  // 3. The API exists (code=0, not method not found) but params wrong
  // The 400 "参数错误" means bad parameters, not auth issue
  // Maybe the format requires: { "goodsReq": { "eliteId": 1, "pageIndex": 1, "pageSize": 20 } }
  // Let's try to call a different API that might work

  // Try the simplest possible API - price query
  console.log('\n=== Goods promotion info ===');
  r = await ca('jd.union.open.goods.promotiongoodsinfo.query', { skuIds: '1000001' });
  console.log(r.substring(0,200));

  // Try with array
  r = await ca('jd.union.open.goods.promotiongoodsinfo.query', { skuIds: ['1000001'] });
  console.log('array:', JSON.parse(JSON.parse(r)[Object.keys(JSON.parse(r))[0]].queryResult));
  
  // Maybe 'skuIds' should be a comma-separated string
  r = await ca('jd.union.open.goods.promotiongoodsinfo.query', { skuIds: '1000001,1000002' });
  console.log('csv:', JSON.parse(JSON.parse(r)[Object.keys(JSON.parse(r))[0]].queryResult));
}

t().catch(console.error);
