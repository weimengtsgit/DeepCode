# User Coding Requirements

## Project Description
This is a coding project generated from user requirements via chat interface.

## User Requirements
# 可观测性监控平台 - 项目需求文档

## Project Overview

为 SRE 工程师和测试工程师开发一个现代化的综合监控平台前端演示系统。该平台整合指标监控、链路追踪、日志分析等多维度可观测性数据,提供直观的可视化界面和高效的故障排查工作流。本项目重点打造精美的前端界面和流畅的交互体验,使用 Mock 数据模拟真实监控场景,无需实现真实后端服务。

**核心价值**: 快速故障定位 → 详细信息查看 → 根因分析的完整闭环

---

## Functional Requirements

### 1. 核心功能模块

#### 1.1 综合仪表盘 (Overview Dashboard)
- **服务健康状态看板**: 展示所有监控服务的整体健康度(健康/警告/故障)
- **关键指标概览**: 错误率、平均响应时间、QPS、资源使用率等核心指标的实时展示
- **告警面板**: 当前活跃告警列表,按严重程度分级(Critical/Warning/Info)
- **趋势图表**: 关键指标的时序趋势图(最近1h/6h/24h/7d)

#### 1.2 指标监控 (Metrics Monitoring)
- **服务列表**: 展示所有被监控的服务/应用
- **多维度指标**: 
  - 业务指标: 错误率、成功率、请求量、响应时间分位数(P50/P90/P99)
  - 系统指标: CPU使用率、内存使用率、磁盘I/O、网络带宽
- **多图表类型**: 折线图、柱状图、饼图、热力图
- **对比视图**: 支持多个服务或时间段的指标对比

#### 1.3 链路追踪 (Distributed Tracing)
- **Trace列表**: 展示请求链路列表,包含TraceID、服务名、耗时、状态
- **链路拓扑图**: 可视化展示服务调用关系和依赖
- **Span详情**: 
  - 火焰图/甘特图展示请求各阶段耗时
  - 每个Span的详细信息(服务名、操作、时长、标签、日志)
- **慢查询分析**: 识别并高亮显示性能瓶颈节点

#### 1.4 日志分析 (Log Analytics)
- **日志流**: 实时日志流展示(支持虚拟滚动)
- **高级搜索**: 
  - 关键词搜索(支持正则表达式)
  - 字段筛选(服务名、日志级别、TraceID等)
  - 日志级别过滤(DEBUG/INFO/WARN/ERROR/FATAL)
- **日志详情**: 展开查看完整日志内容、上下文日志
- **日志统计**: 日志数量趋势、级别分布饼图

#### 1.5 自定义Dashboard
- **拖拽式布局**: 支持图表的拖拽、调整大小
- **图表配置**: 
  - 选择数据源和指标
  - 自定义图表类型
  - 设置阈值告警线
- **Dashboard模板**: 预设模板(应用监控、基础设施监控、业务监控等)
- **保存与分享**: 保存个人Dashboard配置(使用LocalStorage)

### 2. 交互功能

#### 2.1 时间控制
- **快捷时间选择**: 最近5分钟、15分钟、1小时、6小时、24小时、7天
- **自定义时间范围**: 日期时间选择器
- **实时模式**: 自动刷新数据(可设置刷新间隔: 5s/10s/30s/1min)
- **时间对比**: 与上一时段对比功能

#### 2.2 数据筛选
- **多维度筛选器**: 
  - 服务/应用名称
  - 环境(生产/预发布/测试)
  - 区域/可用区
  - 实例ID
  - 标签/标记
- **筛选条件保存**: 保存常用筛选组合

#### 2.3 告警管理
- **告警规则展示**: 显示已配置的告警规则(Mock数据)
- **告警历史**: 历史告警记录,支持按时间、严重程度筛选
- **告警详情**: 触发条件、影响范围、恢复时间

#### 2.4 联动与钻取
- **跨模块联动**: 
  - 从指标异常跳转到对应的Trace
  - 从Trace跳转到相关日志(通过TraceID)
- **下钻分析**: 从概览→服务详情→实例详情的逐层深入

---

## Technical Architecture

### 3.1 技术栈

#### 前端框架
- **核心框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **TypeScript**: 全面使用TS提升代码质量
- **状态管理**: Pinia

#### UI与可视化
- **UI组件库**: Element Plus / Ant Design Vue (推荐Element Plus,暗色主题支持更好)
- **图表库**: 
  - **主力**: Apache ECharts 5.x (支持丰富的主题定制)
  - **备选**: @antv/g2 或 Chart.js
- **拓扑图**: AntV G6 或 Cytoscape.js (用于链路拓扑)
- **图标**: @iconify/vue (包含丰富的监控类图标)

#### 样式与动画
- **CSS预处理器**: SCSS
- **动画库**: GSAP (用于高级动画效果)
- **布局方案**: CSS Grid + Flexbox
- **响应式**: 媒体查询,支持1920px及以上屏幕优先

#### Mock数据
- **Mock方案**: Mock.js / Faker.js
- **数据生成策略**: 
  - 时序数据生成器(模拟真实波动)
  - 随机Trace生成器(模拟服务调用链)
  - 日志生成器(模拟不同级别日志)

### 3.2 项目结构

```
src/
├── views/              # 页面组件
│   ├── Dashboard/      # 综合仪表盘
│   ├── Metrics/        # 指标监控
│   ├── Tracing/        # 链路追踪
│   ├── Logs/           # 日志分析
│   └── Custom/         # 自定义Dashboard
├── components/         # 通用组件
│   ├── Charts/         # 图表组件封装
│   ├── Filters/        # 筛选器组件
│   ├── TimePicker/     # 时间选择器
│   └── Layout/         # 布局组件
├── composables/        # 组合式函数
│   ├── useTimeRange.ts # 时间范围管理
│   ├── useFilters.ts   # 筛选逻辑
│   └── useChartTheme.ts# 图表主题
├── mock/               # Mock数据
│   ├── metrics.ts
│   ├── traces.ts
│   ├── logs.ts
│   └── generators/     # 数据生成工具
├── stores/             # Pinia状态管理
├── router/             # 路由配置
├── styles/             # 全局样式
│   ├── variables.scss  # 暗色主题变量
│   └── themes/         # 主题配置
└── utils/              # 工具函数
```

### 3.3 设计规范

#### 暗色主题配色 (参考Grafana)
- **主背景**: #0b0c0e ~ #181b1f
- **卡片背景**: #1f1f24 ~ #23252b
- **主色调**: #3274d9 (蓝色,用于高亮)
- **成功/健康**: #73bf69 (绿色)
- **警告**: #ff9830 (橙色)
- **错误/危险**: #f2495c (红色)
- **文字**: #d8d9da (主文字), #9fa7b3 (次要文字)

#### 图表风格
- **配色方案**: 使用专业的监控配色(蓝、绿、黄、红渐变)
- **网格线**: 低饱和度,避免视觉干扰
- **动画**: 流畅的过渡效果(300-500ms)
- **响应式**: 图表根据容器大小自适应

#### 交互规范
- **加载状态**: 骨架屏 + Loading动画
- **空状态**: 友好的空数据提示
- **错误状态**: 清晰的错误信息展示
- **响应速度**: 操作响应时间<100ms

### 3.4 核心技术实现要点

#### Mock数据生成策略
```typescript
// 时序数据生成:基于正弦波+随机噪声模拟真实波动
// Trace生成:随机生成3-10层调用链,模拟微服务场景
// 日志生成:根据时间分布,模拟真实日志密度
```

#### 性能优化
- **虚拟滚动**: 日志列表使用虚拟滚动(vue-virtual-scroller)
- **图表懒加载**: 使用Intersection Observer延迟加载图表
- **时间序列优化**: 大数据量时自动聚合采样
- **LocalStorage缓存**: 缓存用户配置和筛选条件

#### 路由设计
```
/                       # 重定向到 /dashboard
/dashboard              # 综合仪表盘
/metrics                # 指标监控
/metrics/:service       # 服务详情
/tracing                # 链路追踪
/tracing/:traceId       # 链路详情
/logs                   # 日志分析
/custom                 # 自定义Dashboard
```

---

## Performance & Scalability

### 4.1 性能指标
- **首屏加载**: < 2s (1920x1080屏幕)
- **页面切换**: < 300ms
- **图表渲染**: < 500ms (单图表)
- **数据刷新**: < 200ms (实时模式)

### 4.2 数据规模考虑
- **日志展示**: 支持渲染10,000+条目(虚拟滚动)
- **时序数据点**: 单图表支持1000+数据点
- **Trace展示**: 支持100层Span的链路
- **Dashboard**: 支持同屏15-20个图表

### 4.3 兼容性
- **浏览器**: Chrome 90+, Firefox 88+, Edge 90+
- **屏幕分辨率**: 主要适配1920x1080, 2560x1440
- **不支持移动端**(SRE工作场景以桌面为主)

### 4.4 扩展性考虑
- **组件复用**: 图表组件高度可配置,易于扩展新指标
- **Mock数据**: 数据生成器独立,方便替换为真实API
- **主题切换**: 预留浅色主题接口(可选实现)
- **国际化**: 预留i18n接口(可选)

---

## 交付标准

1. **代码质量**: TypeScript严格模式,ESLint + Prettier规范
2. **文档**: README包含项目说明、运行指南、Mock数据说明
3. **演示数据**: 至少3个服务的完整Mock数据(指标、Trace、日志)
4. **视觉还原度**: 达到Grafana 80%以上的视觉专业度
5. **交互流畅度**: 无明显卡顿,动画流畅自然

## Generated Implementation Plan
The following implementation plan was generated by the AI chat planning agent:

```yaml
# 📊 可观测性监控平台 - 综合实施计划

基于您的需求文档，我将为这个现代化监控平台生成一个全面的实施计划。让我先搜索一些最佳实践和技术细节。
[Calling tool bocha-mcp_bocha_web_search with args {'query': 'Vue 3 ECharts monitoring dashboard dark theme best practices 2024', 'count': 5}]
[Calling tool bocha-mcp_bocha_web_search with args {'query': 'distributed tracing visualization flame graph Vue TypeScript', 'count': 5}]
[Calling tool bocha-mcp_bocha_web_search with args {'query': 'Mock.js time series data generator observability metrics', 'count': 5}]
基于您的详细需求文档，我将生成一个全面的实施计划：

```yaml
project_plan:
  title: "可观测性监控平台 (Observability Monitoring Platform)"
  description: "现代化综合监控平台前端演示系统，整合指标监控、链路追踪、日志分析等多维度可观测性数据，提供直观的暗色主题可视化界面和高效的故障排查工作流"
  project_type: "web_app"

  # 项目文件结构 (基于 Vue 3 + Vite + TypeScript)
  file_structure: |
    observability-platform/
    ├── public/
    │   └── favicon.ico
    ├── src/
    │   ├── main.ts                      # 应用入口
    │   ├── App.vue                      # 根组件
    │   ├── router/
    │   │   └── index.ts                 # 路由配置 (7个主路由+动态路由)
    │   ├── stores/
    │   │   ├── index.ts                 # Pinia根store
    │   │   ├── timeRange.ts             # 时间范围状态
    │   │   ├── filters.ts               # 全局筛选器状态
    │   │   └── dashboard.ts             # Dashboard配置状态
    │   ├── views/
    │   │   ├── DashboardView.vue        # 综合仪表盘
    │   │   ├── MetricsView.vue          # 指标监控列表
    │   │   ├── MetricsDetail.vue        # 服务指标详情
    │   │   ├── TracingView.vue          # 链路追踪列表
    │   │   ├── TracingDetail.vue        # Trace详情(火焰图)
    │   │   ├── LogsView.vue             # 日志分析
    │   │   └── CustomDashboardView.vue  # 自定义Dashboard
    │   ├── components/
    │   │   ├── Layout/
    │   │   │   ├── MainLayout.vue       # 主布局(侧边栏+顶栏)
    │   │   │   ├── Sidebar.vue          # 导航侧边栏
    │   │   │   └── Topbar.vue           # 顶部栏(时间选择器+筛选器)
    │   │   ├── Charts/
    │   │   │   ├── LineChart.vue        # 折线图组件
    │   │   │   ├── BarChart.vue         # 柱状图组件
    │   │   │   ├── PieChart.vue         # 饼图组件
    │   │   │   ├── HeatmapChart.vue     # 热力图组件
    │   │   │   ├── GaugeChart.vue       # 仪表盘组件
    │   │   │   └── BaseChart.vue        # ECharts基础封装
    │   │   ├── Tracing/
    │   │   │   ├── FlameGraph.vue       # 火焰图组件
    │   │   │   ├── GanttChart.vue       # 甘特图组件
    │   │   │   └── TopologyGraph.vue    # 服务拓扑图(G6)
    │   │   ├── Filters/
    │   │   │   ├── TimeRangePicker.vue  # 时间范围选择器
    │   │   │   ├── ServiceFilter.vue    # 服务筛选器
    │   │   │   └── MultiFilter.vue      # 多维度筛选组件
    │   │   ├── Dashboard/
    │   │   │   ├── MetricCard.vue       # 指标卡片
    │   │   │   ├── AlertPanel.vue       # 告警面板
    │   │   │   ├── ServiceStatus.vue    # 服务状态组件
    │   │   │   └── GridLayout.vue       # 可拖拽网格布局
    │   │   ├── Logs/
    │   │   │   ├── LogStream.vue        # 虚拟滚动日志流
    │   │   │   ├── LogDetail.vue        # 日志详情抽屉
    │   │   │   └── LogSearch.vue        # 日志搜索组件
    │   │   └── Common/
    │   │       ├── LoadingSkeleton.vue  # 骨架屏
    │   │       ├── EmptyState.vue       # 空状态
    │   │       └── ErrorBoundary.vue    # 错误边界
    │   ├── composables/
    │   │   ├── useTimeRange.ts          # 时间范围管理逻辑
    │   │   ├── useFilters.ts            # 筛选逻辑
    │   │   ├── useChartTheme.ts         # ECharts暗色主题
    │   │   ├── useRealtime.ts           # 实时刷新逻辑
    │   │   └── useLocalStorage.ts       # LocalStorage封装
    │   ├── mock/
    │   │   ├── index.ts                 # Mock数据入口
    │   │   ├── metrics.ts               # 指标Mock数据
    │   │   ├── traces.ts                # Trace Mock数据
    │   │   ├── logs.ts                  # 日志Mock数据
    │   │   ├── alerts.ts                # 告警Mock数据
    │   │   └── generators/
    │   │       ├── timeSeriesGenerator.ts  # 时序数据生成器
    │   │       ├── traceGenerator.ts       # Trace链路生成器
    │   │       └── logGenerator.ts         # 日志生成器
    │   ├── styles/
    │   │   ├── main.scss                # 全局样式入口
    │   │   ├── variables.scss           # SCSS变量(暗色主题)
    │   │   ├── mixins.scss              # SCSS混合
    │   │   └── themes/
    │   │       └── dark.scss            # 暗色主题样式
    │   ├── utils/
    │   │   ├── format.ts                # 数据格式化工具
    │   │   ├── color.ts                 # 颜色工具(状态映射)
    │   │   ├── chart.ts                 # 图表配置工具
    │   │   └── date.ts                  # 日期时间工具
    │   └── types/
    │       ├── index.ts                 # 类型定义入口
    │       ├── metrics.ts               # 指标类型
    │       ├── tracing.ts               # Trace类型
    │       └── logs.ts                  # 日志类型
    ├── index.html                       # HTML入口
    ├── vite.config.ts                   # Vite配置
    ├── tsconfig.json                    # TypeScript配置
    ├── tsconfig.node.json               # Node TypeScript配置
    ├── package.json                     # 项目依赖
    ├── .eslintrc.cjs                    # ESLint配置
    ├── .prettierrc.json                 # Prettier配置
    ├── .env.development                 # 开发环境变量
    └── README.md                        # 项目文档

  # 核心实施步骤
  implementation_steps:
    1: "项目初始化与基础架构搭建"
       substeps:
         - "使用 Vite 创建 Vue 3 + TypeScript 项目"
         - "安装核心依赖：Element Plus、ECharts、Pinia、Vue Router"
         - "配置 TypeScript 严格模式、ESLint、Prettier"
         - "搭建主布局结构（MainLayout + Sidebar + Topbar）"
         - "配置路由系统（7个主路由 + 动态详情路由）"
         - "建立 SCSS 暗色主题变量系统（参考 Grafana 配色）"

    2: "Mock 数据系统开发"
       substeps:
         - "实现时序数据生成器（正弦波 + 随机噪声模拟真实波动）"
         - "实现 Trace 生成器（随机 3-10 层调用链，模拟微服务场景）"
         - "实现日志生成器（不同级别日志，符合真实时间分布）"
         - "创建 3 个服务的完整 Mock 数据集（user-service、order-service、payment-service）"
         - "生成告警数据（Critical/Warning/Info 三级）"
         - "实现数据刷新机制（模拟实时数据更新）"

    3: "核心可视化组件开发"
       substeps:
         - "封装 BaseChart 组件（ECharts 统一配置、暗色主题、响应式）"
         - "开发 LineChart、BarChart、PieChart、HeatmapChart 图表组件"
         - "开发火焰图组件（Trace 性能分析可视化）"
         - "开发甘特图组件（Span 时序展示）"
         - "使用 AntV G6 开发服务拓扑图（展示服务调用关系）"
         - "实现虚拟滚动日志流组件（支持 10,000+ 条目）"
         - "实现图表懒加载（Intersection Observer）"

    4: "五大核心页面实现"
       substeps:
         - "综合仪表盘：服务状态看板、关键指标、告警面板、趋势图"
         - "指标监控：服务列表、多维度指标、多图表类型、对比视图"
         - "链路追踪：Trace 列表、火焰图、甘特图、服务拓扑"
         - "日志分析：日志流、高级搜索、日志详情、统计图表"
         - "自定义 Dashboard：拖拽式布局（使用 vue-grid-layout）、图表配置"

    5: "交互功能与状态管理"
       substeps:
         - "实现时间范围控制（快捷选择 + 自定义范围 + 实时模式）"
         - "实现多维度筛选器（服务、环境、区域、标签）"
         - "使用 Pinia 管理全局状态（时间范围、筛选条件、Dashboard 配置）"
         - "实现跨模块联动（指标→Trace→日志的跳转）"
         - "实现下钻分析（概览→服务详情→实例详情）"
         - "使用 LocalStorage 持久化用户配置"

    6: "性能优化与完善"
       substeps:
         - "实现骨架屏加载状态"
         - "优化大数据量图表渲染（数据采样、节流）"
         - "实现时序数据自动聚合（根据时间范围）"
         - "添加错误边界和友好的空状态"
         - "性能测试（首屏 < 2s、图表渲染 < 500ms）"
         - "浏览器兼容性测试（Chrome 90+、Firefox 88+、Edge 90+）"

    7: "视觉与动画润色"
       substeps:
         - "统一视觉风格（参考 Grafana 暗色主题，达到 80% 还原度）"
         - "使用 GSAP 实现高级动画效果（页面切换、数据更新）"
         - "优化图表动画（300-500ms 流畅过渡）"
         - "响应式适配（1920x1080、2560x1440）"
         - "细节打磨（图标、间距、阴影、渐变）"

    8: "文档与交付"
       substeps:
         - "编写完整 README（项目说明、技术栈、运行指南）"
         - "编写 Mock 数据说明文档"
         - "添加代码注释（核心逻辑和复杂算法）"
         - "准备演示数据（3 个服务的完整场景）"
         - "录制演示视频（可选）"

  # 依赖与环境配置
  dependencies:
    required_packages:
      - "vue@^3.4.0"
      - "vue-router@^4.2.0"
      - "pinia@^2.1.0"
      - "typescript@^5.3.0"
      - "vite@^5.0.0"
      - "element-plus@^2.5.0"
      - "echarts@^5.4.0"
      - "vue-echarts@^6.6.0"
      - "@antv/g6@^4.8.0"
      - "mockjs@^1.1.0"
      - "@faker-js/faker@^8.3.0"
      - "dayjs@^1.11.0"
      - "lodash-es@^4.17.21"
      - "vue-virtual-scroller@^2.0.0-beta.8"
      - "vue-grid-layout@^3.0.0"
      - "@iconify/vue@^4.1.0"
      - "sass@^1.69.0"
      - "gsap@^3.12.0"
      
    dev_packages:
      - "@vitejs/plugin-vue@^5.0.0"
      - "@typescript-eslint/parser@^6.15.0"
      - "@typescript-eslint/eslint-plugin@^6.15.0"
      - "eslint@^8.56.0"
      - "eslint-plugin-vue@^9.19.0"
      - "prettier@^3.1.0"
      - "eslint-config-prettier@^9.1.0"
      - "eslint-plugin-prettier@^5.0.0"
      - "vite-plugin-compression@^0.5.1"
      - "unplugin-auto-import@^0.17.0"
      - "unplugin-vue-components@^0.26.0"
      
    optional_packages:
      - "vue-i18n@^9.8.0: 国际化支持（可选）"
      - "@vueuse/core@^10.7.0: 组合式工具库（推荐）"
      - "pinia-plugin-persistedstate@^3.2.0: Pinia 持久化插件"
      
    setup_commands:
      - "npm create vite@latest observability-platform -- --template vue-ts"
      - "cd observability-platform"
      - "npm install"
      - "npm install element-plus echarts vue-echarts @antv/g6 mockjs @faker-js/faker dayjs lodash-es vue-virtual-scroller vue-grid-layout @iconify/vue sass gsap pinia vue-router"
      - "npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint eslint-plugin-vue prettier eslint-config-prettier eslint-plugin-prettier unplugin-auto-import unplugin-vue-components"
      - "npm run dev"

  # 技术栈详情
  tech_stack:
    language: "TypeScript 5.3+"
    frameworks: 
      - "Vue 3.4 (Composition API)"
      - "Vite 5.0"
    core_libraries:
      - "Element Plus 2.5 (UI 组件库，暗色主题支持)"
      - "Apache ECharts 5.4 (主力图表库)"
      - "AntV G6 4.8 (服务拓扑图)"
      - "Pinia 2.1 (状态管理)"
      - "Vue Router 4.2 (路由管理)"
    visualization:
      - "vue-echarts (ECharts Vue 组件封装)"
      - "GSAP 3.12 (高级动画引擎)"
    mock_data:
      - "Mock.js 1.1 (Mock 数据拦截)"
      - "@faker-js/faker 8.3 (真实数据生成)"
    utilities:
      - "dayjs (轻量级日期处理)"
      - "lodash-es (工具函数库)"
      - "vue-virtual-scroller (虚拟滚动)"
      - "vue-grid-layout (拖拽式布局)"
      - "@iconify/vue (图标库)"
    styling:
      - "SCSS (CSS 预处理器)"
      - "CSS Grid + Flexbox (布局方案)"

  # 核心功能特性
  main_features:
    - "综合仪表盘：服务健康状态、关键指标概览、活跃告警、趋势图表"
    - "指标监控：多维度业务/系统指标、多图表类型、服务对比视图"
    - "链路追踪：Trace 列表、火焰图/甘特图、服务拓扑、慢查询分析"
    - "日志分析：实时日志流（虚拟滚动）、高级搜索、日志统计、上下文查看"
    - "自定义 Dashboard：拖拽式布局、图表配置、模板系统、LocalStorage 持久化"
    - "时间控制：快捷时间选择、自定义范围、实时刷新模式、时间对比"
    - "多维度筛选：服务/环境/区域/标签筛选、筛选条件保存"
    - "跨模块联动：指标→Trace→日志的完整排查链路"
    - "告警管理：告警规则展示、历史记录、告警详情"
    - "暗色主题：专业监控风格，参考 Grafana 视觉设计"

  # 技术实现关键点
  technical_highlights:
    mock_data_strategy:
      - "时序数据生成：Math.sin(t) + noise 模拟真实波动"
      - "Trace 生成：递归生成 3-10 层服务调用树，分配合理耗时"
      - "日志生成：基于泊松分布模拟日志时间分布，不同级别比例真实"
      - "实时更新：setInterval 模拟数据流，支持暂停/恢复"
      
    performance_optimization:
      - "虚拟滚动：RecycleScroller 处理 10,000+ 日志条目"
      - "图表懒加载：IntersectionObserver 延迟渲染非可视区图表"
      - "数据采样：时间跨度 > 7 天时自动聚合数据点（降采样）"
      - "防抖节流：搜索/筛选使用 lodash debounce，图表 resize 使用 throttle"
      - "组件懒加载：路由级别的动态 import"
      
    chart_configuration:
      - "统一暗色主题：自定义 ECharts theme（背景 #181b1f，网格 #333，轴线 #555）"
      - "响应式：Charts resize 监听窗口变化"
      - "动画配置：animationDuration: 300ms，animationEasing: 'cubicOut'"
      - "工具提示：trigger: 'axis'，axisPointer 十字准星"
      - "数据缩放：dataZoom 组件支持时间范围缩放"
      
    state_management:
      - "timeRange Store：管理全局时间范围、刷新间隔、实时模式"
      - "filters Store：管理服务/环境/区域等筛选条件，支持持久化"
      - "dashboard Store：管理自定义 Dashboard 布局配置（LocalStorage）"
      - "跨模块通信：通过 Store 实现指标→Trace→日志的联动跳转"
      
    routing_design:
      - "/ → /dashboard (重定向)"
      - "/dashboard → 综合仪表盘"
      - "/metrics → 指标监控列表"
      - "/metrics/:service → 服务指标详情（动态路由）"
      - "/tracing → 链路追踪列表"
      - "/tracing/:traceId → Trace 详情（火焰图 + 甘特图）"
      - "/logs → 日志分析（支持 query 参数传递 traceId）"
      - "/custom → 自定义 Dashboard"
      
    cross_module_linking:
      - "指标异常点击 → 跳转到相同时间段的 Trace 列表（传递 service + timeRange）"
      - "Trace 详情中的 Span → 点击跳转到日志页面（通过 traceId 筛选）"
      - "日志详情中的 traceId → 高亮并支持跳转到对应 Trace"
      - "告警详情 → 跳转到告警触发时间点的指标图表"

  # 设计规范
  design_specifications:
    color_palette:
      background:
        primary: "#0b0c0e"
        secondary: "#181b1f"
        card: "#1f1f24"
        elevated: "#23252b"
      accent:
        primary: "#3274d9"      # 蓝色（高亮、链接）
        success: "#73bf69"      # 绿色（健康、成功）
        warning: "#ff9830"      # 橙色（警告）
        error: "#f2495c"        # 红色（错误、危险）
        info: "#5794f2"         # 浅蓝（信息）
      text:
        primary: "#d8d9da"      # 主文字
        secondary: "#9fa7b3"    # 次要文字
        disabled: "#6e7681"     # 禁用文字
      border:
        default: "#2d2f33"
        hover: "#404449"
        
    chart_colors:
      - "#5470c6"  # 蓝
      - "#91cc75"  # 绿
      - "#fac858"  # 黄
      - "#ee6666"  # 红
      - "#73c0de"  # 青
      - "#3ba272"  # 深绿
      - "#fc8452"  # 橙
      - "#9a60b4"  # 紫
      
    typography:
      font_family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      sizes:
        h1: "28px"
        h2: "24px"
        h3: "20px"
        body: "14px"
        small: "12px"
        
    spacing:
      xs: "4px"
      sm: "8px"
      md: "16px"
      lg: "24px"
      xl: "32px"
      
    animation:
      duration:
        fast: "150ms"
        normal: "300ms"
        slow: "500ms"
      easing: "cubic-bezier(0.4, 0, 0.2, 1)"
      
    shadows:
      card: "0 2px 8px rgba(0, 0, 0, 0.3)"
      elevated: "0 4px 16px rgba(0, 0, 0, 0.4)"
      
  # 性能目标
  performance_targets:
    loading:
      - "首屏加载时间 < 2s（1920x1080）"
      - "页面切换 < 300ms"
      - "图表初始渲染 < 500ms"
      - "实时数据刷新 < 200ms"
      
    scalability:
      - "日志虚拟滚动支持 10,000+ 条目流畅滚动"
      - "单图表支持 1,000+ 数据点无卡顿"
      - "Trace 详情支持 100+ Span 层级"
      - "Dashboard 同屏 15-20 个图表流畅运行"
      
    compatibility:
      browsers:
        - "Chrome 90+"
        - "Firefox 88+"
        - "Edge 90+"
      resolutions:
        - "1920x1080 (主要适配)"
        - "2560x1440 (优化支持)"
      notes: "不支持移动端，专注于桌面 SRE 工作场景"

  # Mock 数据规格
  mock_data_specifications:
    services:
      - name: "user-service"
        description: "用户服务"
        metrics:
          - "QPS: 1000-3000 (正弦波动)"
          - "响应时间: P50=50ms, P90=120ms, P99=350ms"
          - "错误率: 0.1%-2.5% (偶尔峰值)"
          - "CPU: 30%-60%"
          - "内存: 2-4 GB"
          
      - name: "order-service"
        description: "订单服务"
        metrics:
          - "QPS: 500-1500"
          - "响应时间: P50=80ms, P90=200ms, P99=500ms"
          - "错误率: 0.5%-5% (依赖 payment 服务)"
          - "CPU: 40%-70%"
          - "内存: 3-6 GB"
          
      - name: "payment-service"
        description: "支付服务"
        metrics:
          - "QPS: 200-800"
          - "响应时间: P50=150ms, P90=400ms, P99=1200ms"
          - "错误率: 1%-8% (外部支付网关影响)"
          - "CPU: 20%-50%"
          - "内存: 1-3 GB"
          
    trace_scenarios:
      - "正常调用链：user-service → order-service → payment-service (500ms)"
      - "慢查询：order-service 数据库查询耗时 800ms"
      - "错误链路：payment-service 第三方 API 超时 5s"
      - "复杂链路：10 层微服务调用（包含缓存、MQ、数据库）"
      
    log_patterns:
      - "INFO: 70% (正常业务日志)"
      - "WARN: 20% (性能警告、业务警告)"
      - "ERROR: 8% (业务错误、网络错误)"
      - "FATAL: 2% (严重系统错误)"
      - "每秒生成 50-200 条日志（根据时间段波动）"
      
    alert_rules:
      - "Critical: 错误率 > 5%、P99 响应时间 > 2s、服务不可用"
      - "Warning: 错误率 > 2%、P99 响应时间 > 1s、CPU > 80%"
      - "Info: 部署事件、配置变更通知"

  # 开发规范
  development_standards:
    code_quality:
      - "TypeScript 严格模式（strict: true, noImplicitAny: true）"
      - "ESLint + Prettier 格式化（commit 前自动格式化）"
      - "组件命名：PascalCase（大驼峰）"
      - "文件命名：PascalCase.vue (组件), camelCase.ts (工具)"
      - "变量命名：camelCase（小驼峰）"
      - "常量命名：UPPER_SNAKE_CASE"
      
    component_guidelines:
      - "单一职责原则：每个组件只负责一个功能"
      - "Props 类型定义：使用 TypeScript interface 或 type"
      - "Emits 显式声明：defineEmits<{ ... }>()"
      - "组合式函数：use 前缀（如 useTimeRange）"
      - "尺寸限制：单文件组件 < 300 行（超过则拆分）"
      
    git_workflow:
      - "分支命名：feature/xxx, bugfix/xxx, refactor/xxx"
      - "Commit 规范：feat/fix/refactor/docs/style/perf/test/chore"
      - "Commit 示例：feat: add flame graph component for tracing"
      
  # 交付清单
  deliverables:
    code:
      - "完整源代码（符合 TypeScript 严格模式）"
      - "ESLint 和 Prettier 配置文件"
      - "Vite 配置（生产优化、代码分割）"
      
    documentation:
      - "README.md：项目介绍、技术栈、目录结构、运行指南"
      - "MOCK_DATA.md：Mock 数据说明、数据生成逻辑"
      - "代码注释：核心算法和复杂逻辑必须注释"
      
    demo_data:
      - "3 个服务的完整 Mock 数据（user/order/payment）"
      - "至少 20 条 Trace 记录（包含正常/慢查询/错误场景）"
      - "10,000+ 条日志数据"
      - "30+ 条告警记录（不同级别和状态）"
      
    visual_quality:
      - "暗色主题专业度达到 Grafana 80% 以上"
      - "所有图表统一风格和配色"
      - "流畅动画效果（300-500ms 过渡）"
      - "
```

## Project Metadata
- **Input Type**: Chat Input
- **Generation Method**: AI Chat Planning Agent
- **Timestamp**: 1765805199
