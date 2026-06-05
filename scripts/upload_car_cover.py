# -*- coding: utf-8 -*-
import requests
import json

APP_ID = "wxa9bf832f1a8c32d6"
APP_SECRET = "625789d4a942d0c8e7eb842ea998d720"

print("=" * 60)
print("上传汽车封面图到微信永久素材库")
print("=" * 60)

# Step 1: Get access token
print("\n[1/2] Getting access token...")
token_url = f"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={APP_ID}&secret=***"
r = requests.get(token_url, timeout=30)
data = r.json()

if "access_token" not in data:
    print(f"Failed: {data}")
    exit(1)

ACCESS_TOKEN = data["access_token"]
print(f"OK: Token obtained")

# Step 2: Upload to permanent material
print("\n[2/2] Uploading cover image...")
upload_url = f"https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=***&type=image"

with open("/tmp/car_cover.jpg", "rb") as f:
    files = {"media": ("car_cover.jpg", f, "image/jpeg")}
    r2 = requests.post(upload_url, files=files, timeout=60)

result = r2.json()
print("\n" + "=" * 60)

if "media_id" in result:
    print(f"SUCCESS! Cover uploaded")
    print("=" * 60)
    print(f"Media ID: {result['media_id']}")
    print(f"\nUse this ID for article cover:")
    print(f"{result['media_id']}")
else:
    print(f"FAILED: {json.dumps(result, ensure_ascii=False, indent=2)}")
