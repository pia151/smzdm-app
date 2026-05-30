const { createHash } = require('crypto');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.trim().split('\n');
let JD_APP_KEY = '', JD_APP_SECRET=*** (const line of envLines) {
  if (line.startsWith('JD_APP_KEY=')) JD_APP_KEY = line.split('=').slice(1).join('=').trim();
  if (line.startsWith('JD_APP_SECRET=*** JD_APP_SECRET=line.s...onst JD_GATEWAY = 'https://api.jd.com/routerjson';

function generateSign(params) {
  const filtered = Object.entries(params)
    .filter(([k, v]) => v !== '' && k !== 'sign')
    .sort(([a], [b]) => a.localeCompare(b));
  const str = JD_APP_SECRET +
    filtered.map(([k, v]) => k + v).join('') +
    JD_APP_SECRET;
  return createHash('md5').update(str, 'utf8').digest('hex').toUpperCase();
}

async function callApi(method, bizParams) {
  const now = new Date();
  const ts = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0') + ':' +
    String(now.getSeconds()).padStart(2, '0');

  const params = {
    method,
    app_key: JD_APP_KEY,
    timestamp: ts,
    format: 'json',
    v: '1.0',
    sign_method: 'md5',
    param_json: JSON.stringify(bizParams),
  };
  params.sign = generateSign(params);

  const formBody = Object.entries(params)
    .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
    .join('&');

  const resp = await fetch(JD_GATEWAY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody,
  });
  const text = await resp.text();
  return text;
}

async function test() {
  console.log('=== JD API Method Discovery ===\n');

  // Test various common method names for version 1.0
  const methods = [
    // Category
    'jd.union.open.category.list.query',
    'jd.union.open.category.goods.get',
    'jd.union.api.queryCategory',
    // Goods query (search)
    'jd.union.open.goods.query',
    'jd.union.open.goods.bigfield.query',
    'jd.union.open.goods.material.query',
    'jd.union.open.goods.promotiongoodsinfo.query',
    // Jingfen  
    'jd.union.open.goods.jingfen.query',
    // Promotion
    'jd.union.open.promotion.common.get',
    'jd.union.open.promotion.bysubunionid.get',
  ];

  for (const method of methods) {
    try {
      const text = await callApi(method, {});
      const parsed = JSON.parse(text);
      const responseKey = Object.keys(parsed).find(k => k.endsWith('_responce') || k.endsWith('_response'));
      
      if (parsed.error_response) {
        const code = parsed.error_response.code;
        if (code === '15') {
          console.log('✗ ' + method + ' -> Method not found');
        } else {
          console.log('? ' + method + ' -> code=' + code + ' ' + (parsed.error_response.zh_desc || ''));
        }
      } else if (responseKey) {
        const qr = parsed[responseKey];
        if (qr.code === '0') {
          console.log('✓ ' + method + ' -> SUCCESS (code=0)');
        } else {
          console.log('? ' + method + ' -> code=' + qr.code + ' ' + (qr.message || JSON.stringify(qr).substring(0,100)));
        }
      } else {
        console.log('? ' + method + ' -> ' + text.substring(0, 100));
      }
    } catch (e) {
      console.log('! ' + method + ' -> ' + e.message);
    }
  }
}

test().catch(console.error);