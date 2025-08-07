# 系统架构设计

## 整体架构

### 前端架构模式

- **架构类型**: Colocation Architecture (就近组织)
- **路由系统**: Next.js 15 App Router
- **状态管理**: 客户端状态 (Zustand) + 服务端状态 (TanStack Query)
- **组件模式**: 原子设计 + 功能模块组合

### 目录结构原则

```
src/
├── app/                    # Next.js App Router 页面
│   ├── (main)/            # 主应用布局组
│   │   └── dashboard/     # 仪表板相关页面
│   │       ├── layout.tsx # 共享布局
│   │       └── [feature]/ # 功能模块就近组织
│   └── (external)/        # 外部页面（登录等）
├── components/            # 全局共享组件
│   ├── ui/               # 原子级 UI 组件
│   └── data-table/       # 复合组件
├── hooks/                # 自定义 Hooks
├── lib/                  # 工具函数
├── stores/               # 状态管理
├── types/                # TypeScript 类型定义
└── navigation/           # 导航配置
```

## 核心组件架构

### 布局系统架构

**主布局组件**: [`src/app/(main)/dashboard/layout.tsx`](<src/app/(main)/dashboard/layout.tsx>)

- **SidebarProvider**: 侧边栏状态管理上下文
- **AppSidebar**: 主侧边栏组件，支持多种变体
- **SidebarInset**: 主内容区域容器

**布局配置**: [`src/types/preferences/layout.ts`](src/types/preferences/layout.ts)

- **SidebarVariant**: `inset | sidebar | floating`
- **SidebarCollapsible**: `icon | offcanvas`
- **ContentLayout**: `centered | full-width`

### 数据表格架构

**核心组件**: [`src/components/data-table/data-table.tsx`](src/components/data-table/data-table.tsx)

- **技术栈**: TanStack Table v8 + DnD Kit
- **功能支持**: 排序、筛选、分页、拖拽排序、列可见性控制
- **状态管理**: [`src/hooks/use-data-table-instance.ts`](src/hooks/use-data-table-instance.ts)

**表格实例模式**:

```typescript
const table = useDataTableInstance({
  data: TData[],
  columns: ColumnDef<TData, TValue>[],
  enableRowSelection?: boolean,
  getRowId?: (row: TData) => string
});
```

### 导航系统架构

**配置文件**: [`src/navigation/sidebar/sidebar-items.ts`](src/navigation/sidebar/sidebar-items.ts)

- **数据结构**: 分组导航 (NavGroup[])
- **支持功能**: 子菜单、Coming Soon 标记、新标签打开
- **图标系统**: Lucide Icons

## 状态管理设计

### 客户端状态 (Zustand)

**偏好设置**: [`src/stores/preferences/preferences-store.ts`](src/stores/preferences/preferences-store.ts)

- **主题模式**: light/dark 切换
- **主题预设**: default/tangerine/brutalist/soft-pop
- **布局偏好**: 侧边栏变体、内容布局

### 服务端状态

**Server Actions**: [`src/server/server-actions.ts`](src/server/server-actions.ts)

- **Cookie 管理**: 用户偏好持久化
- **类型安全**: 泛型约束确保偏好值有效性

## 认证系统架构

### 中间件系统

**认证中间件**: [`src/middleware/auth-middleware.ts`](src/middleware/auth-middleware.ts)

- **保护路径**: `/dashboard/*` 路径需要认证
- **重定向逻辑**: 未认证用户跳转到登录页
- **状态**: 默认禁用 (middleware.disabled.ts)

### 认证组件

**登录表单**: [`src/app/(main)/auth/_components/login-form.tsx`](<src/app/(main)/auth/_components/login-form.tsx>)

- **表单验证**: React Hook Form + Zod
- **多版本支持**: v1/v2 不同样式

## 主题系统架构

### CSS Variables 系统

- **基础主题**: Tailwind CSS v4 + CSS Variables
- **主题预设**: [`src/styles/presets/`](src/styles/presets/)
  - [`tangerine.css`](src/styles/presets/tangerine.css)
  - [`brutalist.css`](src/styles/presets/brutalist.css)
  - [`soft-pop.css`](src/styles/presets/soft-pop.css)

### 主题生成

**生成脚本**: [`src/scripts/generate-theme-presets.ts`](src/scripts/generate-theme-presets.ts)

- **命令**: `npm run generate:presets`
- **自动化**: 从配置生成 CSS Variables

## 组件设计模式

### Colocation 模式

每个功能模块包含：

- `page.tsx` - 页面组件
- `_components/` - 模块专用组件
- `schema.ts` - 数据模型定义
- `columns.tsx` - 表格列定义 (如适用)

### 示例：CRM 模块

```
src/app/(main)/dashboard/crm/
├── page.tsx                    # 主页面
├── _components/
│   ├── insight-cards.tsx       # 洞察卡片
│   ├── operational-cards.tsx   # 操作卡片
│   ├── overview-cards.tsx      # 概览卡片
│   ├── table-cards.tsx         # 数据表格卡片
│   ├── columns.crm.tsx         # 表格列定义
│   ├── crm.config.ts          # 配置数据
│   └── schema.ts              # 数据模型
```

## 关键设计决策

### 1. Colocation vs 传统分层

**选择**: Colocation 架构
**原因**: 提高代码内聚性，减少跨文件跳转

### 2. App Router vs Pages Router

**选择**: Next.js 15 App Router
**原因**: 更好的开发体验，内置布局支持

### 3. TanStack Table vs 其他表格库

**选择**: TanStack Table v8
**原因**: 无样式库、高度可定制、功能强大

### 4. Zustand vs Redux/Context

**选择**: Zustand
**原因**: 轻量级、TypeScript 友好、简单易用

## 扩展点设计

### 1. 新增仪表板页面

1. 在 [`src/app/(main)/dashboard/`](<src/app/(main)/dashboard/>) 创建新目录
2. 更新 [`sidebar-items.ts`](src/navigation/sidebar/sidebar-items.ts) 添加菜单
3. 使用 Colocation 模式组织组件

### 2. 新增数据表格

1. 定义 schema.ts 数据模型
2. 创建 columns.tsx 列定义
3. 使用 useDataTableInstance Hook

### 3. 主题定制

1. 在 [`src/styles/presets/`](src/styles/presets/) 添加新 CSS 文件
2. 更新主题类型定义
3. 运行 `npm run generate:presets`
