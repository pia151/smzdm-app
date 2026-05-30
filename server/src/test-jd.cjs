const { createHash } = require('crypto');
const fs = require('fs');
const path = require('path');

function getVal(key) {
  const envPath = path.join(__dirname, '..', '.env');
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    if (line.startsWith(key + '=')) return line.slice(key.length + 1).trim();
  }
  return '';
}

const APP_KEY = getVal('JD_APP_KEY');
const APP_SECRET=getV...'JD_APP_SECRET'); const GATEWAY = 'https://api.jd.com/routerjson';

function genSign(params) {
  const e = Object.entries(params).filter(([k, v]) => v !== '' && k !== 'sign');
  e.sort((a, b) => a[0].localeCompare(b[0]));
  const s = APP_SECRET + e.map(x => x[0] + x[1]).join('') + APP_SECRET;
  return createHash('md5').update(s, 'utf8').digest('hex').toUpperCase();
}

async function callApi(method, biz) {
  const now = new Date();
  const ts = now.getFullYear() + '-' +
    String(now.getMonth()+1).padStart(2,'0') + '-' +
    String(now.getDate()).padStart(2,'0') + ' ' +
    String(now.getHours()).padStart(2,'0') + ':' +
    String(now.getMinutes()).padStart(2,'0') + ':' +
    String(now.getSeconds()).padStart(2,'0');

  const params = { method, 'app_key': APP_KEY, 'timestamp': ts,
    'format': 'json', 'v': '1.0', 'sign_method': 'md5',
    'param_json': JSON.stringify(biz) };
  params.sign = genSign(params);

  const body = Object.entries(params).map(e => encodeURIComponent(e[0])+'='+encodeURIComponent(e[1])).join('&');
  const resp = await fetch(GATEWAY, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  return resp.text();
}

async function test() {
  const toTest = [
    ['jd.union.open.category.list.get', {}],
    ['jd.union.open.goods.query', {}],
    ['jd.union.open.goods.bigfield.query', {}],
    ['jd.union.open.goods.jingfen.query', { eliteId: 1 }],
    ['jd.union.open.promotion.common.get', {}],
  ];

  for (const [m, p] of toTest) {
    try {
      const text = await callApi(m, p);
      const d = JSON.parse(text);
      if (d.error_response) {
        console.log('  ' + m + '  =>  ' + d.error_response.code + ': ' + (d.error_response.zh_desc || d.error_response.en_desc));
      } else {
        const k = Object.keys(d).find(k => k.endsWith('_responce') || k.endsWith('_response'));
        if (k && d[k].queryResult) {
          const inner = JSON.parse(d[k].queryResult);
          console.log('✓ ' + m + '  =>  code=' + d[k].code + ' ' + (inner.message || JSON.stringify(inner).substring(0,100)));
        } else if (k) {
          console.log('  ' + m + '  =>  code=' + d[k].code + ' ' + (d[k].message || ''));
        } else {
          console.log('? ' + m + '  =>  ' + text.substring(0,100));
        }
      }
    } catch (e) {
      console.log('! ' + m + '  =>  ' + e.message);
    }
  }
}

test().catch(console.error);
