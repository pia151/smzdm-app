# -*- coding: utf-8 -*-
import requests
import json
import os
import base64

APP_ID = "wxa9bf832f1a8c32d6"
APP_SECRET = "625789d4a942d0c8e7eb842ea998d720"

print("=" * 60)
print("微信公众号封面图生成器")
print("=" * 60)

# 尝试使用 Pillow 创建封面图
try:
    from PIL import Image, ImageDraw, ImageFont
    
    print("\n[1/3] 正在生成封面图片...")
    
    # 创建 900x500 封面图 (微信推荐尺寸)
    width, height = 900, 500
    img = Image.new('RGB', (width, height), color='#1aad19')
    draw = ImageDraw.Draw(img)
    
    # 尝试加载中文字体
    try:
        font_main = ImageFont.truetype("C:/Windows/Fonts/simhei.ttf", 70)
        font_sub = ImageFont.truetype("C:/Windows/Fonts/simhei.ttf", 36)
    except:
        font_main = ImageFont.load_default()
        font_sub = font_main
    
    text_main = "今日车圈头条"
    text_sub = "汽车行业 9 大热点速览"
    text_date = "汽车观察局 | 5 月 26 日"
    
    # 计算居中位置
    bbox_main = draw.textbbox((0, 0), text_main, font=font_main)
    w_main = bbox_main[2] - bbox_main[0]
    h_main = bbox_main[3] - bbox_main[1]
    x_main = (width - w_main) // 2
    y_main = (height - h_main) // 2 - 30
    
    bbox_sub = draw.textbbox((0, 0), text_sub, font=font_sub)
    w_sub = bbox_sub[2] - bbox_sub[0]
    h_sub = bbox_sub[3] - bbox_sub[1]
    x_sub = (width - w_sub) // 2
    y_sub = y_main + h_main + 20
    
    # 绘制文字（白色）
    draw.text((x_main, y_main), text_main, fill='white', font=font_main)
    draw.text((x_sub, y_sub), text_sub, fill='#e8fce8', font=font_sub)
    
    # 底部日期
    bbox_date = draw.textbbox((0, 0), text_date, font=font_sub)
    w_date = bbox_date[2] - bbox_date[0]
    x_date = (width - w_date) // 2
    y_date = height - 60
    draw.text((x_date, y_date), text_date, fill='#a8f0a8', font=font_sub)
    
    # 保存为临时文件
    cover_path = "/tmp/car_news_cover.jpg"
    img.save(cover_path, "JPEG", quality=95)
    
    print(f"[OK] 封面图已生成：{cover_path}")
    print(f"[OK] 文件大小：{os.path.getsize(cover_path)} bytes")
    
except ImportError as e:
    print(f"[WARN] Pillow 未安装：{e}")
    print("[INFO] 将使用 Base64 创建简单 PNG")
    
    # 创建最小有效 PNG
    png_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8Dwn4MDCMAJ/wj/P+JIAAAAASUVORK5CYII="
    cover_path = "/tmp/car_news_cover.png"
    with open(cover_path, "wb") as f:
        f.write(base64.b64decode(png_b64))
    
    print(f"[OK] 封面图已创建：{cover_path}")

# 获取 access_token
print("\n[2/3] 正在获取 access_token...")
token_url = f"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={APP_ID}&secret={APP_SECRET}"
token_response = requests.get(token_url, timeout=30)
token_data = token_response.json()

if "access_token" not in token_data:
    print(f"[ERROR] Token 失败：{token_data}")
    exit(1)

ACCESS_TOKEN = token_data["access_token"]
print(f"[OK] Access Token 获取成功 (有效期 {token_data.get('expires_in', 7200)}秒)")

# 上传封面图到永久素材库
print("\n[3/3] 正在上传封面图...")
upload_url = f"https://api.weixin.qq.com/cgi-bin/material/add_material?type=image&access_token={ACCESS_TOKEN}"

with open(cover_path, "rb") as f:
    files = {"media": ("cover.jpg", f, "image/jpeg")}
    upload_response = requests.post(upload_url, files=files, timeout=60)

upload_data = upload_response.json()

print("\n" + "=" * 60)
if "media_id" in upload_data:
    print("成功！封面图已上传到微信素材库")
    print("=" * 60)
    print(f"\nMedia ID: {upload_data['media_id']}")
    print(f"类型：{upload_data.get('type', 'image')}")
    print(f"上传时间：{upload_data.get('created_at', 'N/A')}")
    
    print("\n下一步操作:")
    print("1. 登录公众号后台 https://mp.weixin.qq.com/")
    print("2. 新建图文消息")
    print("3. 点击「设置封面」")
    print("4. 从素材库选择刚刚上传的图片")
    print("5. 粘贴文章正文内容")
else:
    print("失败！封面图上传失败")
    print(f"\n错误详情:\n{json.dumps(upload_data, ensure_ascii=False, indent=2)}")
    print("\n可能原因:")
    print("1. IP 白名单未配置")
    print("2. 公众号类型不支持此接口")
    print("3. 图片格式或大小不符合要求")
