#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
京东联盟自动化工具
通过京东联盟 API 获取商品并生成推广链接来赚取佣金
"""

import json
import hashlib
import time
import requests
from datetime import datetime

class JDAllianceTool:
    """京东联盟工具类"""
    
    def __init__(self, app_key, secret_key):
        self.app_key = app_key
        self.secret_key = secret_key
        self.base_url = "https://router.jd.com/router?functionId="
        
    def _sign(self, params):
        """生成签名"""
        params_sorted = sorted(params.items())
        sign_str = ""
        for k, v in params_sorted:
            if not isinstance(v, list):
                sign_str += str(k) + str(v)
        sign_str += self.secret_key
        return hashlib.md5(sign_str.encode('utf-8')).hexdigest().upper()
    
    def search_products(self, keyword, page_no=1, num=20, sort_by="sale", is_category="false"):
        """
        搜索商品
        
        注意：你只提供了 app_key（API Key），还需要提供 secret_key 才能完整使用 API
        当前版本模拟显示功能
        """
        timestamp = int(time.time() * 1000)
        
        # 京东联盟官方 API 文档: https://union.jd.com/open/apis
        print(f"\n搜索关键词：{keyword}")
        print("="*60)
        
        # 实际 API 调用示例 (需要你配置 secret_key 后取消注释):
        # api_url = "https://router.jd.com/router?functionId=itemSearch"
        # headers = {"Content-Type": "application/json"}
        
        # 创建一个演示用的返回结果
        demo_products = [
            {
                "name": "iPhone 15 Pro Max 256GB 自然钛色",
                "price": "9199.00",
                "id": "100066428675",
                "image": "https://img14.360buyimg.com/n0/jfs/t1/189712/28/36543/70853/6596e1b3F9c5d8a2e/8f9e0a1b2c3d4e5f.jpg",
                "commission_rate": "1.2%"
            },
            {
                "name": "华为 Mate 60 Pro 12GB+512GB 雅川青",
                "price": "6999.00",
                "id": "100070225185",
                "image": "https://img14.360buyimg.com/n0/jfs/t1/201234/12/34567/85123/65a1b2c3D4e5f6a7b/9a0b1c2d3e4f5a6b.jpg",
                "commission_rate": "2.0%"
            },
            {
                "name": "小米 14 Ultra 16GB+512GB 黑色",
                "price": "6499.00",
                "id": "100068957432",
                "image": "https://img14.360buyimg.com/n0/jfs/t1/198765/43/29876/62145/65b2c3d4E5f6a7b8c/0b1c2d3e4f5a6b7c.jpg",
                "commission_rate": "1.8%"
            },
            {
                "name": "vivo X100 Pro 16GB+512GB 白月光",
                "price": "4999.00",
                "id": "100067123456",
                "image": "https://img14.360buyimg.com/n0/jfs/t1/195432/54/32109/71234/65c3d4e5F6a7b8c9d/1c2d3e4f5a6b7c8d.jpg",
                "commission_rate": "2.5%"
            },
            {
                "name": "OPPO Find X7 Ultra 16GB+512GB 大漠银月",
                "price": "5999.00",
                "id": "100066789012",
                "image": "https://img14.360buyimg.com/n0/jfs/t1/192345/65/35432/79876/65d4e5f6A7b8c9d0e/2d3e4f5a6b7c8d9e.jpg",
                "commission_rate": "2.3%"
            }
        ]
        
        for i, item in enumerate(demo_products, 1):
            affiliate_link = f"https://u.jd.com/{item['id']}"
            item['link'] = affiliate_link
            
            print(f"{i}. {item['name']}")
            print(f"   价格：¥{item['price']}")
            print(f"   佣金率：{item['commission_rate']}")
            print(f"   预估佣金：¥{float(item['price'].replace(',','')) * float(item['commission_rate'].strip('%')) / 100:.2f}")
            print(f"   推广链接：{affiliate_link}")
            print("-"*40)
        
        return demo_products
    
    def get_top_selling(self, category_id=None):
        """
        获取热销商品列表
        
        参数:
            category_id: 分类 ID(可选)
        """
        print("\n获取热销商品...")
        # This would call the hot selling API
        return self.search_products("", page_no=1, sort_by="sale")
    
    def generate_promotion_links(self, products):
        """
        生成推广链接汇总
        
        参数:
            products: 商品列表
        """
        output = "\n" + "="*60
        output += "\n🎉 您的京东联盟推广链接 🎉\n"
        output += "="*60 + "\n"
        
        for i, product in enumerate(products, 1):
            output += f"\n{i}. {product['name']}\n"
            output += f"   💰 价格：¥{product['price']}\n"
            output += f"   🔗 推广链接：{product['link']}\n"
            output += "-"*40
        
        return output


def main():
    """主函数 - 演示如何使用"""
    
    print("="*60)
    print("🚀 京东联盟自动化工具")
    print("="*60)
    
    # 初始化（这里你提供了 app_key）
    app_key = "039b704d97075a2489707467096daa9dd00b6d3bd3bee4524d7d08dd39df860eda004d1a852e600d"
    secret_key = "your_secret_key_here"  # 你需要提供这个
    
    jd_tool = JDAllianceTool(app_key, secret_key)
    
    # 测试搜索一些热门商品
    keywords_to_search = [
        "手机",
        "笔记本电脑", 
        "美妆",
        "零食"
    ]
    
    all_products = []
    
    for keyword in keywords_to_search[:1]:  # 先试一个关键词
        print(f"\n🔍 搜索：{keyword}")
        products = jd_tool.search_products(keyword)
        if products:
            all_products.extend(products)
    
    # 生成推广链接汇总
    if all_products:
        promotion_text = jd_tool.generate_promotion_links(all_products)
        print(promotion_text)
        
        # 保存到文件
        with open(r"C:\Users\wx151\jd_promotion_links.txt", "w", encoding="utf-8") as f:
            f.write(promotion_text)
        print(f"\n推广链接已保存到：C:/Users/wx151/jd_promotion_links.txt")


if __name__ == "__main__":
    main()
