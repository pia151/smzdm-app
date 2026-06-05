const dotenv = require('dotenv');
const path = require('path');

// Test different path resolution methods
console.log('process.cwd():', process.cwd());
console.log('__dirname:', __dirname);

// Try loading .env
const result = dotenv.config({ path: path.join(__dirname, '..', '.env') });
console.log('dotenv error:', result.error);
console.log('JD_APP_KEY:', process.env.JD_APP_KEY ? 'loaded' : 'NOT LOADED');
console.log('JD_APP_SECRET:', process.env.JD_APP_SECRET ? 'loaded' : 'NOT LOADED');
