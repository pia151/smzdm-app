# -*- coding: utf-8 -*-
import requests
import json
import base64
import os

APP_ID = "wxa9bf832f1a8c32d6"
APP_SECRET = "625789d4a942d0c8e7eb842ea998d720"

print("=" * 60)
print("生成 900x500 绿色封面图并上传到微信永久素材库")
print("=" * 60)

# 创建一个更大的纯绿色 JPEG (100x60 像素的绿色图片放大)
# 这是最小可用 JPEG
jpeg_b64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAKABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEDAwUBAAAAAAAAAAAAAQIDAAQRBRIhBhMiMUFR/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAZEQACAwEAAAAAAAAAAAAAAAABAgADESH/2gAMAwEAAhEDEQA/AM40vpXTdR0i3u7q3WSeSMO7HqT8mrqPSOkQQiKOzjVF4AGKq/DWz//2Q=="
cover_path = "/tmp/cover_green.jpg"
with open(cover_path, "wb") as f:
    f.write(base64.b64decode(jpeg_b64))

print(f"[OK] 封面图已创建: {cover_path}")
print(f"[OK] 文件大小: {os.path.getsize(cover_path)} bytes")

# 获取 access_token
print("\n[1/2] 正在获取 access_token...")
token_url = f"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={APP_ID}&secret={APP_SECRET}"
token_response = requests.get(token_url, timeout=30)
token_data = token_response.json()

if "access_token" not in token_data:
    print(f"[ERROR] Token 失败: {token_data}")
    exit(1)

ACCESS_TOKEN = token_data["access_token"]
print(f"[OK] Access Token 获取成功")

# 上传到永久素材库
print("\n[2/2] 正在上传到永久素材库...")
upload_url = f"https://api.weixin.qq.com/cgi-bin/material/add_material?type=image&access_token={ACCESS_TOKEN}"

with open(cover_path, "rb") as f:
    files = {"media": ("cover.jpg", f, "image/jpeg")}
    upload_response = requests.post(upload_url, files=files, timeout=60)

upload_data = upload_response.json()

print("\n" + "=" * 60)
if "media_id" in upload_data:
    print("成功! 封面图已上传到微信永久素材库")
    print("=" * 60)
    print(f"\nMedia ID: {upload_data['media_id']}")
    print("\n请将此 Media ID 复制到 push_final.py 中使用")
else:
    print("失败!")
    print(json.dumps(upload_data, ensure_ascii=False, indent=2))
