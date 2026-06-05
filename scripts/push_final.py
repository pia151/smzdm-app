#!/usr/bin/env python
# -*- coding: utf-8 -*-
import requests, json, base64

APP_ID = "wxa9bf832f1a8c32d6"
APP_SECRET = "625789d4a942d0c8e7eb842ea998d720"

print("="*60 + "\n微信公众号文章推送\n" + "="*60)

token_url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=" + APP_ID + "&secret=" + APP_SECRET
resp = requests.get(token_url, timeout=30).json()
if "access_token" not in resp:
    print("Token 失败:", resp); exit(1)
ACCESS_TOKEN = resp["access_token"]
print("[OK] Token 获取成功")

png_path = "/tmp/wxc.png"
with open(png_path, "wb") as f: f.write(base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="))
print("[OK] 封面图已创建")

up_url = "https://api.weixin.qq.com/cgi-bin/media/upload?type=image&access_token=" + ACCESS_TOKEN
with open(png_path, "rb") as f:
    r = requests.post(up_url, files={"media": ("c.png", f, "image/png")}, timeout=30).json()
thumb_id = r.get("media_id", "")
print("[OK] 封面 ID:", thumb_id[:20]+"..." if thumb_id else "无")

html = '''<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:20px;font-family:-apple-system,'Microsoft YaHei',sans-serif;">
<h1 style="text-align:center;font-size:28px;color:#222;">今日车圈头条</h1>
<p style="text-align:center;font-size:16px;color:#888;">5 月 26 日 | 汽车行业 9 大热点</p>
<hr style="border:none;border-top:2px solid #eee;margin:25px 0;">
<h2 style="color:#1aad19;border-left:4px solid #1aad19;padding-left:12px;background:#f9fdf9;padding:10px;margin:25px 0 15px;">一、新车上市</h2>
<p style="line-height:1.8;"><strong>1. 比亚迪海狮 06 DM-i 上市</strong><br>续航 310km | 售价 12.99 万起</p>
<p style="line-height:1.8;"><strong>2. 吉利银河星耀 7 | 限时 9.88 万起</strong></p>
<p style="line-height:1.8;"><strong>3. 福特烈马限量版 售 39.98 万</strong></p>
<p style="line-height:1.8;"><strong>4. 星途瑶光 2027 款 | 13.79-15.29 万元</strong></p>
<hr style="border:none;border-top:2px solid #eee;margin:30px 0;">
<h2 style="color:#1aad19;border-left:4px solid #1aad19;padding-left:12px;background:#f9fdf9;padding:10px;margin:25px 0 15px;">二、智能驾驶</h2>
<p style="line-height:1.8;">小米 YU7 扩容 | 特斯拉 FSD 改名 | 宝马 7 系 iDrive X</p>
<hr style="border:none;border-top:2px solid #eee;margin:30px 0;">
<h2 style="color:#1aad19;border-left:4px solid #1aad19;padding-left:12px;background:#f9fdf9;padding:10px;margin:25px 0 15px;">三、价格战</h2>
<table style="width:100%;border-collapse:collapse;"><tr style="background:#f5f5f5;"><th style="padding:12px;text-align:left;">车型</th><th style="padding:12px;text-align:center;">价格</th></tr>
<tr><td style="padding:12px;border-bottom:1px solid #eee;">帝豪向上系列</td><td style="padding:12px;border-bottom:1px solid #eee;text-align:center;color:#1aad19;">5.59 万起</td></tr>
<tr><td style="padding:12px;border-bottom:1px solid #eee;">极狐贝塔 S3</td><td style="padding:12px;border-bottom:1px solid #eee;text-align:center;color:#1aad19;">5.98 万起</td></tr>
<tr><td style="padding:12px;">smart 精灵#6</td><td style="padding:12px;text-align:center;color:#1aad19;">18.99 万起</td></tr></table>
<div style="text-align:center;padding:20px;margin:30px 0 0;background:#fafafa;"><p style="margin:0;font-size:11px;color:#bbb;">© 2026 汽车观察局</p></div>
</body></html>'''

data = {"articles": [{"title": "今日车圈头条｜9 大热点速览","thumb_media_id": thumb_id,"author": "汽车观察局",
    "digest": "比亚迪海狮 06 DM-i 上市 12.99 万起、吉利银河星耀 7...","content_source_url": "","content": html,"show_cover_pic": 1}]}

print("\n上传草稿箱...")
draft_r = requests.post("https://api.weixin.qq.com/cgi-bin/draft/add?access_token="+ACCESS_TOKEN, json=data, timeout=30).json()
print("\n"+"="*60)
if "media_id" in draft_r:
    print("成功！文章已推送到公众号草稿箱")
    print("="*60 + f"\nMedia ID: {draft_r['media_id']}\n查看地址：https://mp.weixin.qq.com/cgi-bin/draft")
else:
    print("失败:", json.dumps(draft_r, ensure_ascii=False))
