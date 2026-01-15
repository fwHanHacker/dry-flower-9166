# 🚀 完整生产环境部署教程

## 📋 前置要求

1. **阿里云账号**：已完成实名认证
2. **开通 ESA 服务**：访问 https://www.aliyun.com/product/esa
3. **域名**：已备案的域名用于接入 ESA
4. **Node.js**：版本 >= 18

---

## 第一步：构建项目

```powershell
# 安装依赖
npm install

# 构建生产版本
npm run build
```

构建完成后，`dist/` 目录包含所有静态资源。

---

## 第二步：配置阿里云 ESA

### 2.1 创建站点

1. 登录 [阿里云 ESA 控制台](https://esa.console.aliyun.com/)
2. 点击「创建站点」
3. 输入你的域名（如 `spark.example.com`）
4. 选择接入方式：
   - **NS 接入**：适合整个域名托管到 ESA
   - **CNAME 接入**：适合子域名接入

### 2.2 配置 DNS

**NS 接入方式：**
```
在域名注册商处修改 NS 服务器为 ESA 提供的地址
示例：
  ns1.alidns.com
  ns2.alidns.com
```

**CNAME 接入方式：**
```
添加 CNAME 记录：
  主机记录: spark
  记录类型: CNAME
  记录值: xxx.esa-cdn.com (ESA 提供)
```

等待 DNS 生效（10-30 分钟）。

---

## 第三步：上传静态资源

### 方案 A：使用阿里云 OSS（推荐）

1. **创建 OSS Bucket**
   
   在 [OSS 控制台](https://oss.console.aliyun.com/) 创建：
   - Bucket 名称：`spark-edge-guardians`
   - 区域：选择就近区域
   - 读写权限：公共读

2. **上传文件**
   
   ```powershell
   # 安装 ossutil（如果未安装）
   # 下载：https://help.aliyun.com/document_detail/120075.html
   
   # 配置 ossutil
   .\ossutil64.exe config
   # 输入 AccessKey ID、AccessKey Secret、Endpoint
   
   # 上传 dist 目录
   .\ossutil64.exe cp -r ./dist/ oss://spark-edge-guardians/ --update
   ```

3. **在 ESA 配置回源**
   
   - 进入 ESA 控制台 → 源站管理
   - 点击「添加源站」
   - 源站类型：OSS 源站
   - Bucket：`spark-edge-guardians`
   - 协议：HTTPS

### 方案 B：使用自有服务器

1. 将 `dist/` 上传到服务器
2. 配置 Web 服务器（Nginx/Apache）
3. 在 ESA 添加源站 IP

---

## 第四步：创建 Edge KV 命名空间

### 4.1 创建 KV

1. 进入 ESA 控制台 → Edge KV
2. 点击「创建命名空间」
3. 配置：
   ```
   名称: GAME_KV
   描述: 游戏全局数据存储
   ```
4. 记录 **命名空间 ID**

### 4.2 初始化数据

创建文件 `scripts/init-kv.js`：

```javascript
// 使用 ESA API 初始化 KV 数据
const cities = {
  beijing: { name: "北京", lat: 39.9042, lng: 116.4074, brightness: 100 },
  shanghai: { name: "上海", lat: 31.2304, lng: 121.4737, brightness: 100 },
  guangzhou: { name: "广州", lat: 23.1291, lng: 113.2644, brightness: 100 },
  shenzhen: { name: "深圳", lat: 22.5431, lng: 114.0579, brightness: 100 },
  tokyo: { name: "Tokyo", lat: 35.6762, lng: 139.6503, brightness: 100 },
  seoul: { name: "Seoul", lat: 37.5665, lng: 126.9780, brightness: 100 },
  singapore: { name: "Singapore", lat: 1.3521, lng: 103.8198, brightness: 100 },
  london: { name: "London", lat: 51.5074, lng: -0.1278, brightness: 100 },
  paris: { name: "Paris", lat: 48.8566, lng: 2.3522, brightness: 100 },
  newyork: { name: "New York", lat: 40.7128, lng: -74.0060, brightness: 100 },
};

const initialData = {
  'global:cities': cities,
  'global:leaderboard': [],
  'global:stats': {
    totalPurifications: 0,
    totalPlayers: 0,
    lastUpdate: Date.now(),
  },
};

console.log('初始化数据:', JSON.stringify(initialData, null, 2));
```

运行：
```powershell
node scripts/init-kv.js
```

---

## 第五步：部署 Edge Functions

### 5.1 启用生产代码

修改以下文件，取消注释：

**1. functions/api/status.ts**

```typescript
export default async (params: any) => {
  try {
    // ✅ 取消注释以启用 KV
    const cached = await params.env.GAME_KV.get('global:cities');
    if (cached) {
      return new Response(cached, {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // 如果 KV 为空，返回初始数据
    return new Response(JSON.stringify(CITIES), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

**2. functions/api/purify.ts**

```typescript
// ✅ 启用 KV 写入
await params.env.GAME_KV.put(`city:${cityName}`, JSON.stringify(city));

// 更新全局统计
const stats = await params.env.GAME_KV.get('global:stats', { type: 'json' });
stats.totalPurifications++;
await params.env.GAME_KV.put('global:stats', JSON.stringify(stats));
```

**3. functions/api/leaderboard.ts**

```typescript
// ✅ 启用 KV 读取
const data = await params.env.GAME_KV.get('global:leaderboard', { type: 'json' });
```

### 5.2 配置 esa.jsonc

检查路由配置：

```jsonc
{
  "version": "1.0",
  "routes": [
    {
      "path": "/api/status",
      "target": "edge-function",
      "function": "functions/api/status.ts"
    },
    {
      "path": "/api/purify",
      "target": "edge-function",
      "function": "functions/api/purify.ts"
    },
    {
      "path": "/api/leaderboard",
      "target": "edge-function",
      "function": "functions/api/leaderboard.ts"
    },
    {
      "path": "/api/stats",
      "target": "edge-function",
      "function": "functions/api/stats.ts"
    },
    {
      "path": "/ws",
      "target": "edge-function",
      "function": "functions/websocket/index.ts"
    }
  ],
  "bindings": {
    "GAME_KV": {
      "type": "kv",
      "namespace_id": "<替换为你的KV命名空间ID>"
    }
  }
}
```

### 5.3 上传 Edge Functions

**方法 1：使用 ESA CLI（推荐）**

```powershell
# 安装 ESA CLI
npm install -g @alicloud/esa-cli

# 登录
esa login

# 部署
esa deploy --config esa.jsonc
```

**方法 2：手动上传**

1. 压缩 `functions/` 目录为 `functions.zip`
2. 在 ESA 控制台 → Edge Routine → 上传代码
3. 选择 `functions.zip` 并部署

---

## 第六步：配置缓存策略

在 ESA 控制台 → 缓存配置：

| 路径               | 缓存时间 | SWR   | 说明        |
| ------------------ | -------- | ----- | ----------- |
| `/`                | 3600s    | 7200s | 首页        |
| `/assets/*`        | 2592000s | -     | JS/CSS/图片 |
| `/api/status`      | 60s      | 120s  | 城市状态    |
| `/api/leaderboard` | 30s      | 60s   | 排行榜      |
| `/api/stats`       | 60s      | 120s  | 统计        |
| `/api/purify`      | 0s       | -     | 动态操作    |

---

## 第七步：配置 WebSocket（可选）

### 7.1 在 ESA 启用 WebSocket

1. 进入 ESA 控制台 → Edge Routine
2. 找到 `/ws` 路由
3. 确认 WebSocket 支持已启用

### 7.2 测试 WebSocket

```javascript
const ws = new WebSocket('wss://your-domain.com/ws');
ws.onopen = () => {
  console.log('✅ WebSocket 连接成功');
  ws.send(JSON.stringify({ 
    type: 'subscribe',
    timestamp: Date.now() 
  }));
};
ws.onmessage = (event) => {
  console.log('📨 收到消息:', event.data);
};
```

---

## 第八步：验证部署

### 8.1 检查静态资源

```powershell
curl https://your-domain.com/
```

应返回 HTML 内容。

### 8.2 测试 API

```powershell
# 获取城市状态
curl https://your-domain.com/api/status

# 测试净化（使用真实经纬度）
curl -X POST https://your-domain.com/api/purify `
  -H "Content-Type: application/json" `
  -d '{"cityName":"beijing","userId":"test-001"}'

# 查看排行榜
curl https://your-domain.com/api/leaderboard

# 查看统计
curl https://your-domain.com/api/stats
```

### 8.3 浏览器测试

1. 访问 `https://your-domain.com`
2. 打开开发者工具（F12）
3. 检查：
   - Network：所有资源加载成功
   - Console：无错误
   - Application → Local Storage：查看用户数据

### 8.4 性能检查

- **Lighthouse 测试**：Performance > 90 分
- **API 延迟**：< 100ms（中国大陆）
- **缓存命中率**：> 80%

---

## 🔧 常见问题

### Q1: Edge Function 报错 "GAME_KV is not defined"

**原因**：KV 绑定未配置

**解决**：
1. 检查 `esa.jsonc` 中的 `bindings`
2. 确认命名空间 ID 正确
3. 重新部署 Edge Function

### Q2: API 返回 CORS 错误

**解决**：在 Edge Function 添加 CORS 头

```typescript
return new Response(JSON.stringify(data), {
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  },
});
```

### Q3: WebSocket 无法连接

**检查清单**：
1. ESA 是否支持 WebSocket（部分套餐不支持）
2. 路由配置是否正确
3. 浏览器控制台错误详情

### Q4: 地理位置不准确

ESA 使用 IP 定位，可能有偏差。

**改进方案**：
```typescript
// 使用浏览器 Geolocation API
navigator.geolocation.getCurrentPosition((pos) => {
  const { latitude, longitude } = pos.coords;
  // 使用精确坐标
});
```

### Q5: 静态资源 404

**检查**：
1. OSS Bucket 权限是否为"公共读"
2. ESA 回源配置是否正确
3. 文件路径是否匹配

---

## 📊 监控与优化

### 监控指标

在 ESA 控制台查看：
- **请求数**：实时 QPS
- **缓存命中率**：目标 > 80%
- **Edge Function 执行时间**：目标 < 50ms
- **错误率**：目标 < 1%

### 性能优化

1. **启用 HTTP/2**（ESA 默认启用）
2. **开启 Brotli 压缩**
3. **图片 WebP 转换**
4. **预连接优化**：
   ```html
   <link rel="preconnect" href="https://your-domain.com">
   ```

### 成本控制

**预估月成本**（10,000 DAU）：

| 项目          | 用量                  | 费用       |
| ------------- | --------------------- | ---------- |
| ESA 流量      | 100GB                 | ¥10-30     |
| Edge Function | 100万次               | ¥5-20      |
| Edge KV       | 1GB + 10万次操作      | ¥5-15      |
| OSS           | 10GB 存储 + 50GB 流量 | ¥5-15      |
| **总计**      |                       | **¥25-80** |

---

## 🔄 持续部署

### 自动化部署脚本

创建 `scripts/deploy.ps1`：

```powershell
# 构建
npm run build

# 上传到 OSS
.\ossutil64.exe cp -r ./dist/ oss://spark-edge-guardians/ --update

# 部署 Edge Functions
esa deploy --config esa.jsonc

# 清除 CDN 缓存
# esa purge --all

Write-Host "✅ 部署完成!" -ForegroundColor Green
```

运行：
```powershell
.\scripts\deploy.ps1
```

---

## 📚 相关文档

- [阿里云 ESA 官方文档](https://help.aliyun.com/product/131166.html)
- [Edge Routine 开发指南](https://help.aliyun.com/document_detail/423079.html)
- [Edge KV 使用文档](https://help.aliyun.com/document_detail/423080.html)
- [项目技术文档](./TECHNICAL.md)
- [评分维度说明](./SCORING_GUIDE.md)

---

## ✅ 部署完成检查清单

- [ ] 静态资源可访问
- [ ] API 端点正常响应
- [ ] KV 数据读写正常
- [ ] WebSocket 连接成功
- [ ] 地理位置识别准确
- [ ] 缓存策略生效
- [ ] 性能指标达标
- [ ] 错误监控配置
- [ ] HTTPS 证书有效

---

**🎉 恭喜！部署成功！**

访问 `https://your-domain.com` 体验游戏！

如有问题，查看 [troubleshooting.md](./troubleshooting.md) 或提交 Issue。
