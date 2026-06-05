# -*- coding: utf-8 -*-
import requests
import json
import base64

APP_ID = "wxa9bf832f1a8c32d6"
APP_SECRET = "625789d4a942d0c8e7eb842ea998d720"

print("=" * 60)
print("微信公众号文章推送")
print("=" * 60)

# 获取 access_token
token_url = f"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={APP_ID}&secret={APP_SECRET}"
token_response = requests.get(token_url, timeout=30)
token_data = token_response.json()

if "access_token" not in token_data:
    print(f"Token 失败：{token_data}")
    exit(1)

ACCESS_TOKEN = token_data["access_token"]
print(f"[OK] Access Token 获取成功")

# 创建 PNG 图片
png_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
cover_path = "/tmp/wx_cover.png"
with open(cover_path, "wb") as f:
    f.write(base64.b64decode(png_b64))
print(f"[OK] 封面图已创建")

# 上传封面图
upload_url = f"https://api.weixin.qq.com/cgi-bin/media/upload?type=image&access_token=***\nwith open(cover_path, "rb") as f:
    files = {"media": ("cover.png", f, "image/png")}
    upload_response = requests.post(upload_url, files=files, timeout=30)

upload_data = upload_response.json()
if "media_id" not in upload_data:
    print(f"封面上传失败：{upload_data}")
    thumb_media_id = ""
else:
    thumb_media_id = upload_data["media_id"]
    print(f"[OK] 封面 Media ID: {thumb_media_id[:20]}...")

# HTML 正文
html_content = '''<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:20px;font-family:-apple-system,'Microsoft YaHei',sans-serif;">
<h1 style="text-align:center;font-size:28px;color:#222;">今日车圈头条</h1>
<p style="text-align:center;font-size:16px;color:#888;">5 月 26 日 | 汽车行业 9 大热点速览</p>
<hr style="border:none;border-top:2px solid #eee;margin:25px 0;">
<h2 style="color:#1aad19;border-left:4px solid #1aad19;padding-left:12px;background:#f9fdf9;padding:10px;margin:25px 0 15px;font-size:18px;">一、新车上市</h2>
<p style="line-height:1.8;color:#555;"><strong>1. 比亚迪海狮 06 DM-i 2026 款 上市</strong><br>纯电续航 310km | 售价 12.99 万元起<br>第五代 DM 技术 | NEDC 油耗 1.7L/100km</p>
<p style="line-height:1.8;color:#555;"><strong>2. 吉利银河星耀 7 | 限时 9.88 万起</strong><br>四驱车也能跑出 1.5L 油耗</p>
<p style="line-height:1.8;color:#555;"><strong>3. 福特烈马亚马逊限量版 售 39.98 万</strong></p>
<p style="line-height:1.8;color:#555;"><strong>4. 星途瑶光 2027 款 | 13.79-15.29 万元</strong></p>
<hr style="border:none;border-top:2px solid #eee;margin:30px 0;">
<h2 style="color:#1aad19;border-left:4px solid #1aad19;padding-left:12px;background:#f9fdf9;padding:10px;margin:25px 0 15px;font-size:18px;">二、智能驾驶</h2>
<p style="line-height:1.8;color:#555;">小米 YU7 矩阵扩容<br>特斯拉 FSD 改名<br>宝马全新 7 系 iDrive X 系统</p>
<hr style="border:none;border-top:2px solid #eee;margin:30px 0;">
<h2 style="color:#1aad19;border-left:4px solid #1aad19;padding-left:12px;background:#f9fdf9;padding:10px;margin:25px 0 15px;font-size:18px;">三、价格战</h2>
<table style="width:100%;border-collapse:collapse;">
<tr style="background:#f5f5f5;"><th style="padding:12px;text-align:left;">车型</th><th style="padding:12px;text-align:center;">价格</th></tr>
<tr><td style="padding:12px;border-bottom:1px solid #eee;">帝豪向上系列</td><td style="padding:12px;border-bottom:1px solid #eee;text-align:center;color:#1aad19;">5.59 万起</td></tr>
<tr><td style="padding:12px;border-bottom:1px solid #eee;">极狐贝塔 S3</td><td style="padding:12px;border-bottom:1px solid #eee;text-align:center;color:#1aad19;">5.98 万起</td></tr>
<tr><td style="padding:12px;">smart 精灵#6</td><td style="padding:12px;text-align:center;color:#1aad19;">18.99 万起</td></tr>
</table>
<div style="text-align:center;padding:20px;margin:30px 0 0;background:#fafafa;"><p style="margin:0;font-size:11px;color:#bbb;">© 2026 汽车观察局</p></div>
</body></html>'''

article_data = {
    "articles": [{
        "title": "今日车圈头条｜9 大热点速览",
        "thumb_media_id": thumb_media_id,
        "author": "汽车观察局",
        "digest": "比亚迪海狮 06 DM-i 上市 12.99 万起、吉利银河星耀 7...",
        "content_source_url": "",
        "content": html_content,
        "show_cover_pic": 1
    }]
}

print("\n正在上传到草稿箱...")
draft_url = f"https://api.weixin.qq.com/cgi-bin/draft/add?access_token={ACCESS_TOKEN}"
draft_response = requests.post(draft_url, json=article_data, timeout=30)
draft_data = draft_response.json()

print("\n" + "=" * 60)
if "media_id" in draft_data:
    print("成功！文章已推送到公众号草稿箱")
    print("=" * 60)
    print(f"\nMedia ID: {draft_data['media_id']}")
    print("\n查看地址：https://mp.weixin.qq.com/cgi-bin/draft")
else:
    print("推送失败!")
    print(json.dumps(draft_data, ensure_ascii=False, indent=2))
