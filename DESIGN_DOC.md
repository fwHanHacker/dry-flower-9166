# 星火燎原：边缘守护者 (Spark: Edge Guardians) - 设计方案

## 1. 游戏概念 (Game Concept)
**背景**：数字世界被“延迟黑暗”笼罩。玩家扮演分布在全球各地的“边缘守护者”。
**核心玩法**：
*   **定位**：利用 ESA 边缘节点识别玩家真实地理位置。
*   **净化**：点击收集能量，点亮所在的城市/区域。
*   **接力**：当本地区域完全点亮后，能量自动汇聚成光束，沿着 ESA 骨干网络路径，飞向最近的黑暗节点，协助其他玩家。

## 2. 架构设计 (Architecture)

### 前端 (Frontend)
*   **框架**: Vue 3 + Vite + TypeScript
*   **3D 引擎**: `globe.gl` (基于 Three.js) 用于渲染地球、光柱、连线动画。
*   **UI 库**: 原生 CSS/Tailwind (保持轻量) 或 Naive UI (用于 HUD 界面)。

### 边缘后端 (ESA Backend)
*   **Edge Routine (ER)**: 处理所有 API 请求，运行在阿里云 ESA 全球边缘节点。
*   **Edge KV**: 存储全球各城市的“亮度值” (Brightness Level) 和“守护者计数”。
*   **Geo Location**: 利用 ER 的 `params.geo` 获取用户经纬度、城市、国家。

## 3. ESA 技术结合点 (ESA Integration)
*   **创意卓越**: 3D 地球可视化全球节点状态，光束接力动画展示网络连通性。
*   **应用价值**: 极低延迟的全球状态同步 (KV + ER)，展示边缘计算的高可用性。
*   **技术探索**: 
    *   **Geo-Routing**: 后端计算最近邻节点算法。
    *   **Edge State**: 无服务器架构下的状态管理。

## 4. 实施步骤 (Implementation Steps)

### Step 1: 3D 引擎集成与基础场景
*   安装 `globe.gl`。
*   创建 `src/components/EarthCanvas.vue`。
*   渲染一个深色背景的 3D 地球，支持鼠标交互旋转缩放。
*   清理默认样式，确保全屏显示。

### Step 2: 边缘后端开发 (Mock & Setup)
*   创建 `functions/api` 目录结构。
*   编写 `functions/api/status.ts`: 模拟返回全球各地的亮度数据。
*   编写 `functions/api/purify.ts`: 接收净化请求，返回更新后的状态。
*   *注：本地开发阶段可能需要 Mock 数据，因为 ESA 环境需部署后生效。*

### Step 3: 前后端联调与地理位置对接
*   在前端调用 `/api/status` 获取数据。
*   利用 `globe.gl` 的 `pointsData` 或 `hexBinPointsData` 在地球上渲染“光点”（代表各城市亮度）。
*   实现“我的位置”高亮：前端获取模拟的 Geo 信息，镜头自动飞向该坐标。

### Step 4: 游戏核心逻辑实现
*   **HUD 界面**: 开发“能量收集器”按钮和仪表盘。
*   **交互逻辑**: 点击按钮 -> 能量蓄满 -> 发送 `/api/purify` 请求。
*   **反馈动画**: 请求成功后，在地球对应坐标生成一根升起的光柱 (`arcsData` 或 `customLayer`)。

### Step 5: 智能路由与光束接力
*   后端算法升级：当某点亮度达到 100%，计算最近的未点亮节点。
*   前端渲染：接收后端返回的 `target_node`，绘制一条从当前位置飞向目标位置的动态光线 (`arcsData` 动画)。

### Step 6: 视觉打磨与部署
*   添加星空背景、大气层光晕效果。
*   优化 UI 样式（科技感、Glassmorphism）。
*   配置 `esa.jsonc` 路由规则。
*   最终部署测试。

---
*Created by GitHub Copilot for Aliyun ESA Competition*
