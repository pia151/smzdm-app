# -*- coding: utf-8 -*-
import requests
import json

APP_ID = "wxa9bf832f1a8c32d6"
APP_SECRET = "625789d4a942d0c8e7eb842ea998d720"

print("=" * 60)
print("微信公众号文章推送工具")
print("=" * 60)

# 步骤 1: 获取 access_token
token_url = "https://api.weixin.qq.com/cgi-bin/token"
token_params = {
    "grant_type": "client_credential",
    "appid": APP_ID,
    "secret": APP_SECRET
}

print("\n[1/3] 🔑 正在获取 access_token...")
token_response = requests.get(token_url, params=token_params, timeout=30)
token_data = token_response.json()

if "access_token" not in token_data:
    print(f"❌ 获取 token 失败：{json.dumps(token_data, ensure_ascii=False, indent=2)}")
    exit(1)

access_token = token_data["access_token"]
print(f"✅ Access Token 获取成功!")
print(f"   有效期：{token_data.get('expires_in', 7200)}秒")

# 步骤 2: 准备 HTML 正文内容
html_content = """<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue','PingFang SC','Hiragino Sans GB','Microsoft YaHei UI','Microsoft YaHei',Arial,sans-serif;">

<h1 style="text-align:center;font-size:28px;color:#222;margin-bottom:10px;line-height:1.3;">今日车圈头条</h1>
<p style="text-align:center;font-size:16px;color:#888;margin-top:0;">5 月 26 日 | 汽车行业 9 大热点速览</p>

<hr style="border:none;border-top:2px solid #eee;margin:25px 0;">

<h2 style="color:#1aad19;border-left:4px solid #1aad19;padding-left:12px;background:#f9fdf9;padding:10px 12px;margin:25px 0 15px;font-size:18px;">🚗 一、新车上市 · 重磅来袭</h2>

<h3 style="font-size:16px;color:#333;margin:20px 0 10px;"><strong>1. 比亚迪海狮 06 DM-i 2026 款 上市</strong></h3>
<p style="color:#666;margin:8px 0;"><strong>纯电续航 310km | 售价 12.99 万元起</strong></p>
<p style="line-height:1.8;color:#555;">• 第五代 DM 技术加持<br>• NEDC 综合油耗低至 1.7L/100km<br>• CLTC 纯电续航高达 310km<br>• 馈电油耗仅 2.9L/100km</p>

<h3 style="font-size:16px;color:#333;margin:20px 0 10px;"><strong>2. 吉利银河星耀 7 惊艳亮相</strong></h3>
<p style="color:#666;margin:8px 0;"><strong>四驱车也能跑出 1.5L 油耗！限时权益价 9.88 万起</strong></p>
<p style="line-height:1.8;color:#555;">同级唯一 11 万级直接上四驱 | MAX 版本配置拉满</p>

<h3 style="font-size:16px;color:#333;margin:20px 0 10px;"><strong>3. 福特烈马亚马逊限量版 售 39.98 万</strong></h3>
<p style="line-height:1.8;color:#555;">涉水能力全面升级 | 亚马逊主题特殊涂装 | 限量专属标识</p>

<h3 style="font-size:16px;color:#333;margin:20px 0 10px;"><strong>4. 星途瑶光 2027 款 | 13.79-15.29 万元</strong></h3>
<p style="line-height:1.8;color:#555;">把「全球车」标准卷进 13 万级市场</p>

<hr style="border:none;border-top:2px solid #eee;margin:30px 0;">

<h2 style="color:#1aad19;border-left:4px solid #1aad19;padding-left:12px;background:#f9fdf9;padding:10px 12px;margin:25px 0 15px;font-size:18px;">⚡ 二、智能驾驶 · 格局变动</h2>

<h3 style="font-size:16px;color:#333;margin:20px 0 10px;"><strong>5. 小米 YU7 矩阵持续扩容</strong></h3>
<p style="line-height:1.8;color:#555;">YU7 系列定位更加清晰 | 供应链深度绑定完成 | 产能爬坡超预期 | 交付速度明显提升</p>

<h3 style="font-size:16px;color:#333;margin:20px 0 10px;"><strong>6. 特斯拉 FSD 改名引发关注</strong></h3>
<p style="line-height:1.8;color:#555;">官网悄然调整命名策略，「完全自动驾驶」字眼消失，行业解读为合规考量。</p>

<h3 style="font-size:16px;color:#333;margin:20px 0 10px;"><strong>7. 宝马全新 7 系 7 月投产</strong></h3>
<p style="line-height:1.8;color:#555;">搭载最新 iDrive X 系统，AI 语音交互能力提升，支持更多第三方应用。</p>

<hr style="border:none;border-top:2px solid #eee;margin:30px 0;">

<h2 style="color:#1aad19;border-left:4px solid #1aad19;padding-left:12px;background:#f9fdf9;padding:10px 12px;margin:25px 0 15px;font-size:18px;">💰 三、价格战 · 消费者利好</h2>

<table style="width:100%;border-collapse:collapse;margin:15px 0;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
<tr style="background:#f5f5f5;"><th style="padding:12px;text-align:left;border-bottom:1px solid #ddd;">车型</th><th style="padding:12px;text-align:center;border-bottom:1px solid #ddd;">价格</th></tr>
<tr><td style="padding:12px;border-bottom:1px solid #eee;">帝豪向上系列</td><td style="padding:12px;border-bottom:1px solid #eee;text-align:center;color:#1aad19;">5.59 万起</td></tr>
<tr><td style="padding:12px;border-bottom:1px solid #eee;">极狐贝塔 S3</td><td style="padding:12px;border-bottom:1px solid #eee;text-align:center;color:#1aad19;">5.98 万起</td></tr>
<tr><td style="padding:12px;border-bottom:1px solid #eee;">与众 07</td><td style="padding:12px;border-bottom:1px solid #eee;text-align:center;color:#1aad19;">10.99 万起</td></tr>
<tr><td style="padding:12px;">smart 精灵#6 (预售)</td><td style="padding:12px;text-align:center;color:#1aad19;">18.99 万起</td></tr>
</table>

<hr style="border:none;border-top:2px solid #eee;margin:30px 0;">

<h2 style="color:#1aad19;border-left:4px solid #1aad19;padding-left:12px;background:#f9fdf9;padding:10px 12px;margin:25px 0 15px;font-size:18px;">📊 四、数据看车市</h2>
<div style="display:flex;flex-wrap:wrap;gap:10px;margin:15px 0;">
<div style="flex:1;min-width:110px;background:linear-gradient(135deg,#1aad19,#07c160);color:white;border-radius:8px;padding:15px;text-align:center;">
<div style="font-size:24px;font-weight:bold;">42%</div>
<div style="font-size:12px;margin-top:4px;opacity:0.9;">新能源渗透率</div>
</div>
<div style="flex:1;min-width:110px;background:linear-gradient(135deg,#07c160,#05a856);color:white;border-radius:8px;padding:15px;text-align:center;">
<div style="font-size:24px;font-weight:bold;">65%+</div>
<div style="font-size:12px;margin-top:4px;opacity:0.9;">自主品牌市占率</div>
</div>
<div style="flex:1;min-width:110px;background:linear-gradient(135deg,#05a856,#04944d);color:white;border-radius:8px;padding:15px;text-align:center;">
<div style="font-size:24px;font-weight:bold;">3-5 天</div>
<div style="font-size:12px;margin-top:4px;opacity:0.9;">平均提车周期</div>
</div>
</div>

<hr style="border:none;border-top:2px solid #eee;margin:30px 0;">

<h2 style="color:#1aad19;border-left:4px solid #1aad19;padding-left:12px;background:#f9fdf9;padding:10px 12px;margin:25px 0 15px;font-size:18px;">✨ 明日看点</h2>
<ul style="line-height:2;color:#555;padding-left:20px;">
<li>启境 GT7 正式公布预售价（5 月 29 日）</li>
<li>别克 E7 交付数据出炉</li>
<li>多城新能源补贴细则落地</li>
<li>华为系车型最新动态</li>
</ul>

<hr style="border:none;border-top:2px solid #eee;margin:30px 0;">

<div style="text-align:center;padding:20px 0;margin:30px 0 0;background:#fafafa;border-radius:8px;">
<p style="margin:0 0 8px 0;font-size:12px;color:#bbb;">素材来源：网易汽车、汽车之家、各品牌官网</p>
<p style="margin:0;font-size:11px;color:#ccc;">© 2026 汽车观察局 | 未经授权禁止转载</p>
</div>

</body></html>"""

# 步骤 3: 上传到草稿箱
article_data = {
    "articles": [{
        "title": "今日车圈头条｜9 大热点速览",
        "thumb_media_id": "",
        "author": "汽车观察局",
        "digest": "比亚迪海狮 06 DM-i 上市售 12.99 万起、吉利银河星耀 7、小米 YU7 矩阵扩容...",
        "content_source_url": "",
        "content": html_content,
        "show_cover_pic": 0
    }]
}

print("\n[2/3] 📝 正在上传文章到草稿箱...")
draft_url = f"https://api.weixin.qq.com/cgi-bin/draft/add?access_token={access_token}"
draft_response = requests.post(draft_url, json=article_data, timeout=30)
draft_data = draft_response.json()

print("\n" + "=" * 60)
if "media_id" in draft_data:
    print("✅ 成功! 文章已推送到公众号草稿箱")
    print("=" * 60)
    print(f"\n📄 Media ID: {draft_data['media_id']}")
    print(f"\n🔗 查看地址:")
    print(f"   https://mp.weixin.qq.com/cgi-bin/draft")
    print(f"\n📌 下一步操作:")
    print(f"   1. 登录公众号后台")
    print(f"   2. 点击左侧「草稿箱」")
    print(f"   3. 找到本文档，可编辑或发布")
else:
    print("❌ 推送失败!")
    print(f"\n错误详情:\n{json.dumps(draft_data, ensure_ascii=False, indent=2)}")
