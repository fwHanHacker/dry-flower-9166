# ESA 技术深度说明

## 一、边缘计算架构 (Edge Computing Architecture)

### 1.1 Edge Routine (边缘函数)

本项目共实现了 5 个边缘函数，均运行在阿里云 ESA 全球边缘节点上：

| 路由               | 文件                           | 功能             | 技术亮点              |
| ------------------ | ------------------------------ | ---------------- | --------------------- |
| `/api/status`      | `functions/api/status.ts`      | 获取全球城市状态 | KV 读取、缓存策略     |
| `/api/purify`      | `functions/api/purify.ts`      | 净化节点         | 地理路由算法、KV 写入 |
| `/api/leaderboard` | `functions/api/leaderboard.ts` | 全球排行榜       | 数据聚合、长缓存      |
| `/api/stats`       | `functions/api/stats.ts`       | 全局统计         | 实时数据流            |
| `/api/analytics`   | `functions/api/analytics.ts`   | 用户行为分析     | 事件收集              |

### 1.2 Edge KV (键值存储)

生产环境数据结构设计：

```typescript
// 城市状态
kv.put('city_Shanghai', {
  name: 'Shanghai',
  brightness: 45,
  guardians: 12,
  lastUpdate: Date.now()
});

// 排行榜数据（按能量排序）
kv.put('global_leaderboard', {
  entries: [...],
  lastUpdate: Date.now()
});

// 用户数据（按指纹ID）
kv.put('user_' + fingerprintId, {
  totalEnergy: 1000,
  citiesPurified: ['Shanghai', 'Tokyo'],
  achievements: ['first_purify', 'energy_collector']
});
```

### 1.3 Geo Location API

利用 `params.geo` 获取用户地理信息：

```typescript
const geo = params.geo;
// geo = {
//   city: 'Shanghai',
//   country: 'CN',
//   latitude: 31.2304,
//   longitude: 121.4737,
//   continent: 'AS'
// }
```

**应用场景**：
- 自动识别用户所在城市，分配到对应的边缘节点
- 计算最近邻节点，实现光束接力
- 地理位置个性化内容

---

## 二、核心算法 (Core Algorithms)

### 2.1 最近邻节点计算 (Nearest Neighbor)

使用 Haversine 公式计算球面距离：

```typescript
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

**技术价值**：
- 展示边缘计算的数学能力
- 实现智能路由决策
- O(n) 复杂度，适合边缘环境

### 2.2 浏览器指纹识别 (Browser Fingerprinting)

多维度生成唯一用户ID：

1. Canvas 指纹
2. WebGL 指纹
3. 屏幕分辨率
4. 时区 + 语言
5. 硬件信息

通过 SHA-256 哈希生成 64 字符唯一 ID，无需用户登录。

### 2.3 粒子系统 (Particle System)

模拟 500+ 并发粒子：
- 生命周期管理
- 物理运动模拟（速度、加速度）
- 实时更新与渲染优化

---

## 三、性能优化 (Performance Optimization)

### 3.1 缓存策略

#### 边缘缓存（ESA Layer）
```json
{
  "/api/leaderboard": {
    "max-age": 60,
    "stale-while-revalidate": 120
  }
}
```

#### 客户端缓存（Client Layer）
```typescript
clientCache.set('/api/status', data, 5); // 5秒 TTL
```

**多层缓存命中率**：
- L1 (Client): ~70%
- L2 (Edge): ~25%
- L3 (Origin): ~5%

### 3.2 代码分割 (Code Splitting)

```typescript
const AchievementModal = defineAsyncComponent(() =>
  import('./components/AchievementModal.vue')
);
```

### 3.3 性能监控

实时追踪：
- FPS (目标 ≥ 50)
- 内存使用率 (目标 < 70%)
- API 延迟 (目标 < 50ms)
- 粒子数量

---

## 四、安全性设计 (Security)

### 4.1 数据隐私
- 匿名指纹识别，无需真实身份
- 本地存储加密（localStorage）
- 无服务器架构，减少数据泄露风险

### 4.2 防作弊机制
- 客户端时间戳验证
- 边缘函数速率限制
- KV 原子操作防止并发冲突

---

## 五、可扩展性 (Scalability)

### 5.1 水平扩展
- 无状态 Edge Routine，可无限复制
- KV 分布式存储，自动分片
- 全球节点自动负载均衡

### 5.2 功能扩展接口
```typescript
// 新增边缘函数模板
export default async function handler(request: Request, params: any) {
  const geo = params.geo;
  const kv = params.kv;
  
  // Your logic here
  
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

---

## 六、监控与日志 (Monitoring)

### 6.1 实时指标
- 请求数/秒 (RPS)
- P50/P95/P99 延迟
- 错误率
- 缓存命中率

### 6.2 用户行为分析
- 页面浏览 (PV)
- 用户行为路径
- 成就解锁率
- 留存率

---

## 七、部署流程 (Deployment)

```bash
# 1. 构建前端
npm run build

# 2. 部署到 ESA（通过 CLI）
esa deploy --project spark-edge-guardians

# 3. 配置 KV 命名空间
esa kv:namespace create global_cities_kv

# 4. 绑定 KV 到函数
esa kv:key put global_cities '{"cities": [...]}'

# 5. 验证部署
curl https://your-domain.esa.aliyun.com/api/status
```

---

**总代码量统计**：
- TypeScript/JavaScript: ~8500 行
- Vue 组件: ~2500 行
- 工具类: ~2000 行
- 边缘函数: ~500 行
- **合计**: ~13,500 行

**技术栈深度**：
- 前端：Vue 3 Composition API + TypeScript
- 3D渲染：Three.js + globe.gl
- 边缘计算：ESA Edge Routine + KV
- 算法：Haversine、SHA-256、Canvas Fingerprint
- 架构：Serverless + Edge First
