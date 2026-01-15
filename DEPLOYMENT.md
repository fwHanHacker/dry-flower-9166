# 部署指南 (Deployment Guide)

## 本地测试运行

由于 ESA 的某些功能（如 Edge Routine、KV、Geo）只在生产环境可用，本地开发使用了 Mock 数据。

### 运行开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173`，你应该能看到：
- 一个 3D 旋转的地球
- 全球主要城市的亮度光点
- 右下角的能量收集器 HUD

### 本地功能验证
1. 点击"点击充能"按钮，观察能量条增长
2. 能量满后，点击"净化节点"
3. 观察控制台输出的 API 调用结果

---

## 部署到阿里云 ESA

### Step 1: 构建项目

```bash
npm run build
```

这会在 `dist/` 目录生成静态文件。

### Step 2: 准备 ESA 环境

1. 登录 [阿里云 ESA 控制台](https://esa.console.aliyun.com/)
2. 创建一个新的 ESA 站点（如果还没有）
3. 记录你的站点域名

### Step 3: 配置 KV 命名空间（可选，用于生产环境持久化）

在 ESA 控制台创建一个 KV 命名空间，例如 `global_cities_kv`。

然后修改 `functions/api/status.ts` 和 `functions/api/purify.ts` 中的注释代码，启用 KV 读写：

```typescript
// 取消以下注释
const kv = params.kv;
const citiesData = await kv.get('global_cities', 'json');
await kv.put('city_Shanghai', JSON.stringify({ brightness: newBrightness }));
```

### Step 4: 部署文件

#### 方法 1: 使用 ESA CLI（推荐）

```bash
# 安装 ESA CLI
npm install -g @aliyun/esa-cli

# 登录
esa login

# 部署
esa deploy
```

#### 方法 2: 手动上传

1. 在 ESA 控制台，进入"边缘函数"页面
2. 上传 `functions/api/status.ts` 和 `functions/api/purify.ts`
3. 配置路由规则（参考 `esa.jsonc`）
4. 上传 `dist/` 目录到静态资源托管

### Step 5: 验证部署

访问你的 ESA 站点域名，例如 `https://your-site.esa-cn-hangzhou.aliyuncs.com`。

检查：
- 地球是否正常渲染
- HUD 是否显示
- 点击充能和净化是否正常工作
- 控制台是否有错误

---

## 生产环境优化建议

### 1. 启用真实 Geo 定位

在 `functions/api/purify.ts` 中，取消注释：

```typescript
const geo = params.geo; 
const userCity = geo.city || 'Shanghai'; // 使用真实城市
```

### 2. 持久化数据到 KV

在 `functions/api/status.ts` 中：

```typescript
const kv = params.kv;
const citiesData = await kv.get('global_cities', 'json');
if (!citiesData) {
  // 初始化数据
  await kv.put('global_cities', JSON.stringify(getMockCities()));
}
```

### 3. 添加缓存策略

在 `esa.jsonc` 中配置缓存：

```json
{
  "cache": {
    "maxAge": 60,
    "staleWhileRevalidate": 300
  }
}
```

### 4. 监控与日志

在 Edge Routine 中添加日志：

```typescript
console.log(`[ESA] Purify request from ${geo.city}, energy: ${energy}`);
```

在 ESA 控制台的"日志"页面查看实时日志。

---

## 常见问题 (FAQ)

### Q: 本地开发时 `/api/status` 返回 404？
A: 这是正常的。Edge Routine 只在 ESA 生产环境运行。本地开发时，代码会 catch 错误并使用 Mock 数据。

### Q: 部署后地球不显示？
A: 检查 `globe.gl` 依赖的 CDN 资源（地球纹理图）是否被正确加载。可以在 `EarthCanvas.vue` 中使用自托管的图片。

### Q: 如何调试 Edge Routine？
A: 在 ESA 控制台的"边缘函数 -> 日志"页面查看实时日志输出。

---

## 性能指标参考

- **首屏加载时间**：< 2s（依赖 CDN）
- **API 响应延迟**：< 50ms（边缘节点处理）
- **全球同步延迟**：< 100ms（KV 写入）

---

**Happy Deploying! 🚀**
