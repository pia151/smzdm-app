import { getDb, saveDb } from './database';

async function seed() {
  const db = await getDb();
  console.log('🌱 开始填充模拟数据...');

  // 分类数据
  const categories = [
    { name: '数码家电', icon: '📱', sort: 1 },
    { name: '电脑办公', icon: '💻', sort: 2 },
    { name: '服饰鞋包', icon: '👟', sort: 3 },
    { name: '美妆个护', icon: '💄', sort: 4 },
    { name: '食品生鲜', icon: '🍜', sort: 5 },
    { name: '家居家装', icon: '🏠', sort: 6 },
    { name: '母婴玩具', icon: '🧸', sort: 7 },
    { name: '图书文具', icon: '📚', sort: 8 },
    { name: '运动户外', icon: '⚽', sort: 9 },
    { name: '生活服务', icon: '🎫', sort: 10 },
  ];

  for (const cat of categories) {
    db.run(
      `INSERT OR IGNORE INTO categories (name, icon, sort_order) VALUES (?, ?, ?)`,
      [cat.name, cat.icon, cat.sort]
    );
  }

  // 创建模拟用户
  const users = [
    { id: 'u1', nickname: '剁手小王子', phone: '13800000001', bio: '专注发现好价，省钱就是赚钱！' },
    { id: 'u2', nickname: '优惠侦探', phone: '13800000002', bio: '哪里有优惠哪里就有我' },
    { id: 'u3', nickname: '省钱大师', phone: '13800000003', bio: '让每一分钱都花得值' },
    { id: 'u4', nickname: '购物达人', phone: '13800000004', bio: '只买对的，不买贵的' },
  ];

  // 先检查是否已有数据
  const existingUsers = db.exec('SELECT COUNT(*) as c FROM users');
  if (existingUsers[0]?.values[0]?.[0] === 0) {
    for (const u of users) {
      const hash = '$2a$10$dummy'; // 实际密码 "123456"
      // 用安全方式插入
      db.run(
        `INSERT INTO users (id, phone, nickname, password_hash, avatar, bio)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [u.id, u.phone, u.nickname, hash,
         `https://api.dicebear.com/7.x/thumbs/svg?seed=${u.nickname}`,
         u.bio]
      );
    }
  }

  // 商品数据
  const products = [
    { id: 'p1', cat: 1, title: 'Apple AirPods Pro 2 无线耳机', subtitle: '主动降噪，自适应通透模式', price: 1599, orig: 1999, platform: '京东', img: 'https://img14.360buyimg.com/n0/jfs/t1/123456/40/12345/123456/airpods.jpg', sales: 50000, rating: 4.8 },
    { id: 'p2', cat: 1, title: '小米 Redmi K70 5G手机', subtitle: '第二代骁龙8，2K直屏', price: 2499, orig: 3299, platform: '京东', img: 'https://img14.360buyimg.com/n0/jfs/t1/234567/30/23456/234567/redmi.jpg', sales: 100000, rating: 4.7 },
    { id: 'p3', cat: 2, title: '联想 ThinkPad X1 Carbon', subtitle: '商务轻薄本，14英寸2.8K OLED屏', price: 8999, orig: 12999, platform: '京东', img: 'https://img14.360buyimg.com/n0/jfs/t1/345678/20/34567/345678/thinkpad.jpg', sales: 12000, rating: 4.9 },
    { id: 'p4', cat: 5, title: '三只松鼠每日坚果礼盒', subtitle: '30袋装，混合坚果', price: 59.9, orig: 129, platform: '天猫', img: 'https://img14.360buyimg.com/n0/jfs/t1/456789/10/45678/456789/nuts.jpg', sales: 200000, rating: 4.6 },
    { id: 'p5', cat: 1, title: '索尼 WH-1000XM5 头戴式降噪耳机', subtitle: '行业顶级降噪，30小时续航', price: 2299, orig: 2999, platform: '京东', img: 'https://img14.360buyimg.com/n0/jfs/t1/567890/50/56789/567890/sony.jpg', sales: 35000, rating: 4.9 },
    { id: 'p6', cat: 3, title: 'Nike Air Force 1 经典板鞋', subtitle: '经典白色，百搭款', price: 499, orig: 899, platform: '天猫', img: 'https://img14.360buyimg.com/n0/jfs/t1/678901/40/67890/678901/nike.jpg', sales: 80000, rating: 4.5 },
    { id: 'p7', cat: 4, title: 'SK-II 神仙水230ml', subtitle: '护肤精华露，改善肤质', price: 999, orig: 1590, platform: '天猫', img: 'https://img14.360buyimg.com/n0/jfs/t1/789012/30/78901/789012/skii.jpg', sales: 60000, rating: 4.7 },
    { id: 'p8', cat: 6, title: '米家智能除湿机', subtitle: '22L大除湿量，干衣模式', price: 999, orig: 1499, platform: '小米商城', img: 'https://img14.360buyimg.com/n0/jfs/t1/890123/20/89012/890123/dehumidifier.jpg', sales: 25000, rating: 4.6 },
  ];

  const existingProducts = db.exec('SELECT COUNT(*) as c FROM products');
  if (existingProducts[0]?.values[0]?.[0] === 0) {
    for (const p of products) {
      db.run(
        `INSERT INTO products (id, category_id, title, subtitle, image, platform,
          current_price, original_price, discount, sales_count, rating)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.cat, p.title, p.subtitle, p.img, p.platform,
         p.price, p.orig, Math.round((1 - p.price/p.orig) * 100),
         p.sales, p.rating]
      );
    }
  }

  // 好价数据
  const existingDeals = db.exec("SELECT COUNT(*) as c FROM deals WHERE status = 'approved'");
  if (existingDeals[0]?.values[0]?.[0] === 0) {
    const deals = [
      { pid: 'p1', uid: 'u1', title: '【历史低价】AirPods Pro 2 直降400', content: '京东自营现售1599元，领取Plus会员专享券，叠加满减活动，到手价历史新低！', price: 1599, orig: 1999, platform: '京东', platformIcon: 'jd', likes: 128, comments: 56, cat: 1 },
      { pid: 'p2', uid: 'u2', title: '红米K70百亿补贴价2499', content: '百亿补贴活动中，直接降价800元。第二代骁龙8处理器，2K直屏，性价比之王！', price: 2499, orig: 3299, platform: '京东', platformIcon: 'jd', likes: 89, comments: 34, cat: 1 },
      { pid: 'p5', uid: 'u3', title: '索尼XM5耳机国行好价2299', content: '索尼旗舰降噪耳机历史好价，比平时便宜700元，降噪音质双顶级', price: 2299, orig: 2999, platform: '京东', platformIcon: 'jd', likes: 256, comments: 78, cat: 1 },
      { pid: 'p4', uid: 'u1', title: '三只松鼠坚果礼盒5折', content: '年货必备！30袋混合坚果礼盒，原价129现仅59.9，囤货党冲！', price: 59.9, orig: 129, platform: '天猫', platformIcon: 'tmall', likes: 512, comments: 123, cat: 5 },
      { pid: 'p3', uid: 'u4', title: 'ThinkPad X1 Carbon 企业采购价', content: '企业采购专享价，比零售便宜4000元！14英寸2.8K OLED屏幕，i7+16G+512G', price: 8999, orig: 12999, platform: '京东', platformIcon: 'jd', likes: 45, comments: 12, cat: 2 },
      { pid: 'p6', uid: 'u2', title: 'Nike AF1经典白板鞋2件8折', content: '天猫旗舰店两件八折活动，拼单更划算！经典款百搭不过时', price: 499, orig: 899, platform: '天猫', platformIcon: 'tmall', likes: 67, comments: 23, cat: 3 },
      { pid: 'p7', uid: 'u1', title: 'SK-II神仙水双11预售好价', content: '双11预售开启！神仙水230ml到手999元，送大量赠品小样', price: 999, orig: 1590, platform: '天猫', platformIcon: 'tmall', likes: 334, comments: 89, cat: 4 },
      { pid: 'p8', uid: 'u3', title: '米家除湿机新品首发价999', content: '米家新品除湿机，22L大除湿量，支持米家APP远程控制，干衣模式超实用', price: 999, orig: 1499, platform: '小米商城', platformIcon: 'xiaomi', likes: 78, comments: 21, cat: 6 },
    ];

    for (const d of deals) {
      db.run(
        `INSERT INTO deals (id, product_id, user_id, title, content, price,
          original_price, platform, platform_icon, category_id, status,
          like_count, comment_count, is_hot)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?)`,
        [generateDealId(), d.pid, d.uid, d.title, d.content, d.price,
         d.orig, d.platform, d.platformIcon, d.cat, d.likes, d.comments,
         d.likes > 200 ? 1 : 0]
      );
    }
  }

  // 价格历史
  const existingHistory = db.exec('SELECT COUNT(*) as c FROM price_history');
  if (existingHistory[0]?.values[0]?.[0] === 0) {
    const now = new Date();
    for (const p of products) {
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0] + ' 12:00:00';
        // 模拟价格波动
        const variation = (Math.random() - 0.5) * (p.orig - p.price) * 0.5;
        const price = Math.round((p.price + Math.max(0, variation)) * 100) / 100;
        db.run(
          `INSERT INTO price_history (product_id, price, recorded_at) VALUES (?, ?, ?)`,
          [p.id, price, dateStr]
        );
      }
    }
  }

  saveDb();
  console.log('✅ 模拟数据填充完成！');
}

function generateDealId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 14; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `d${Date.now().toString(36)}${result}`;
}

seed().catch(console.error);