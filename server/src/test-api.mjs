import dotenv from 'dotenv';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const JD_APP_KEY = process.env.JD_APP_KEY || '';
const JD_APP_SECRET=proces...CRET || '';
const JD_GATEWAY = 'https://api.jd.com/routerjson';

function generateSign(params) {
  const filtered = Object.entries(params)
    .filter(([k, v]) => v !== '' && k !== 'sign')
    .sort(([a], [b]) => a.localeCompare(b));
  const str = JD_APP_SECRET +
    filtered.map(([k, v]) => `${k}${v}`).join('') +
    JD_APP_SECRET;
  return createHash('md5').update(str, 'utf8').digest('hex').toUpperCase();
}

async function test() {
  const method = 'jd.union.open.goods.jingfen.query';
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, '+0000');

  const params = {
    method,
    app_key: JD_APP_KEY,
    timestamp,
    format: 'json',
    v: '1.0',
    sign_method: 'md5',
    param_json: JSON.stringify({ eliteId: 1 }),
  };
  params.sign = generateSign(params);

  const formBody = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  console.log('Method:', method);
  console.log('AppKey:', JD_APP_KEY.substring(0, 8) + '...');
  console.log('Secret:', JD_APP_SECRET.substring(0, 8) + '...');
  console.log('Sign:', params.sign.substring(0, 16) + '...');

  const resp = await fetch(JD_GATEWAY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody,
  });
  const text = await resp.text();
  console.log('\nResponse:', text.substring(0, 600));
}

test().catch(console.error);