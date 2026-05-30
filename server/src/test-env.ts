import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testJdApi() {
  const crypto = await import('crypto');
  
  const JD_APP_KEY = process.env.JD_APP_KEY || '';
  const JD_APP_SECRET = process.env.JD_APP_SECRET || '';
  const JD_GATEWAY = 'https://api.jd.com/routerjson';

  function generateSign(params: Record<string, string>): string {
    const filtered = Object.entries(params)
      .filter(([k, v]) => v !== '' && k !== 'sign')
      .sort(([a], [b]) => a.localeCompare(b));
    const str = JD_APP_SECRET +
      filtered.map(([k, v]) => `${k}${v}`).join('') +
      JD_APP_SECRET;
    return crypto.createHash('md5').update(str, 'utf8').digest('hex').toUpperCase();
  }

  const method = 'jd.union.open.category.list.get';
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, '+0000');
  
  const systemParams: Record<string, string> = {
    method,
    app_key: JD_APP_KEY,
    timestamp,
    format: 'json',
    v: '1.0',
    sign_method: 'md5',
  };

  const paramJson = JSON.stringify({ parentId: 0, grade: 1 });
  const allParams = { ...systemParams, param_json: paramJson };
  allParams.sign = generateSign(allParams);

  const formBody = Object.entries(allParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  console.log('== Request ==');
  console.log('URL:', JD_GATEWAY);
  console.log('Body:', formBody.substring(0, 200) + '...');
  console.log('');
  console.log('== Response ==');

  try {
    const resp = await fetch(JD_GATEWAY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
    });
    const text = await resp.text();
    console.log(text.substring(0, 500));
  } catch (e: any) {
    console.error('请求失败:', e.message);
  }
}

testJdApi().catch(console.error);