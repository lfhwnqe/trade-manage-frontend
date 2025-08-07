# 技术栈与开发环境

## 核心技术栈

### 前端框架

- **Next.js**: 15.4.5 (App Router)
- **React**: 19.1.1
- **TypeScript**: 5.8.3
- **Node.js**: 要求 18+

### UI 组件与样式

- **Shadcn/ui**: 基于 Radix UI 的组件库
- **Tailwind CSS**: v4.1.5 (最新版本)
- **CSS Variables**: 用于主题系统
- **Lucide React**: 0.453.0 (图标库)
- **Radix UI**: 1.4.2 (无样式组件基础)

### 状态管理与数据处理

- **Zustand**: 5.0.7 (客户端状态管理)
- **TanStack React Query**: 5.84.1 (服务端状态管理)
- **TanStack React Table**: 8.21.3 (数据表格)
- **React Hook Form**: 7.62.0 (表单管理)
- **Zod**: 3.25.76 (数据验证)

### 交互与动画

- **DnD Kit**: 拖拽功能
  - `@dnd-kit/core`: 6.3.1
  - `@dnd-kit/sortable`: 10.0.0
  - `@dnd-kit/modifiers`: 9.0.0
- **Framer Motion**: 通过 `tw-animate-css` 集成
- **Recharts**: 2.15.4 (图表库)

### 工具库

- **Axios**: 1.11.0 (HTTP 客户端)
- **Date-fns**: 3.6.0 (日期处理)
- **Class Variance Authority**: 0.7.1 (样式变体管理)
- **clsx** + **tailwind-merge**: 样式类名合并

## 开发工具链

### 代码质量

- **ESLint**: 9.32.0
  - `@typescript-eslint/parser`: 8.26.0
  - `eslint-plugin-react`: 7.37.5
  - `eslint-plugin-security`: 3.0.1
  - `eslint-plugin-sonarjs`: 3.0.4
  - `eslint-plugin-unused-imports`: 4.1.4
- **Prettier**: 3.6.2
  - `prettier-plugin-tailwindcss`: 0.6.14
- **Husky**: 9.1.7 (Git hooks)
- **lint-staged**: 15.5.2 (预提交检查)

### 构建与部署

- **PostCSS**: 8.5.6
- **TypeScript**: 类型检查和编译
- **ts-node**: 10.9.2 (TypeScript 脚本执行)

## 项目配置

### 包管理

- **支持工具**: npm/yarn
- **锁定文件**: yarn.lock (推荐使用 yarn)
- **依赖管理**: package.json 严格版本控制

### 开发脚本

```json
{
  "dev": "next dev", // 开发服务器
  "build": "next build", // 生产构建
  "start": "next start", // 生产服务器
  "lint": "next lint", // 代码检查
  "format": "prettier --write .", // 代码格式化
  "format:check": "prettier --check .", // 格式检查
  "generate:presets": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' src/scripts/generate-theme-presets.ts"
}
```

### 配置文件

- **TypeScript**: [`tsconfig.json`](tsconfig.json)
  - 路径别名: `@/*` 映射到 `./src/*`
  - 严格模式启用
  - Next.js 插件集成
- **ESLint**: [`eslint.config.mjs`](eslint.config.mjs)
- **Prettier**: [`.prettierrc`](.prettierrc)
- **Shadcn/ui**: [`components.json`](components.json)
  - 样式: "new-york"
  - 基础颜色: "neutral"
  - CSS Variables 启用

## 环境要求

### 开发环境

- **Node.js**: >= 18.0.0
- **包管理器**: npm (>= 8.0.0) 或 yarn (>= 1.22.0)
- **操作系统**: macOS, Linux, Windows (WSL 推荐)

### 生产环境

- **部署平台**: Vercel (推荐), Netlify, 或任何支持 Node.js 的平台
- **环境变量**: 通过 `.env.local` 管理
- **静态资源**: 通过 Next.js 优化

## 性能优化

### 构建优化

- **Tree Shaking**: 自动移除未使用代码
- **Code Splitting**: Next.js 自动代码分割
- **Image Optimization**: Next.js Image 组件
- **Bundle Analysis**: 生产环境移除 console 日志

### 运行时优化

- **React 19**: 最新 React 性能特性
- **Server Components**: App Router 默认服务端组件
- **Streaming**: 渐进式页面渲染
- **缓存策略**: Next.js 内置缓存机制

## 开发体验 (DX)

### 热重载

- **Fast Refresh**: React 组件热重载
- **CSS Hot Reload**: 样式实时更新
- **TypeScript 检查**: 实时类型错误提示

### 开发工具

- **VS Code 扩展推荐**:
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - Auto Rename Tag

### 调试支持

- **React DevTools**: 组件状态调试
- **Next.js DevTools**: 路由和性能分析
- **Source Maps**: 生产环境调试支持

## 依赖管理策略

### 版本控制

- **精确版本**: 核心依赖使用精确版本号
- **兼容性**: 定期更新确保兼容性
- **安全审计**: 定期运行 `npm audit`

### 依赖分类

- **生产依赖**: 运行时必需的包
- **开发依赖**: 仅开发时使用的工具
- **Peer 依赖**: 由框架提供的依赖

## 约束与限制

### 技术约束

- **TypeScript 严格模式**: 强制类型安全
- **ESLint 规则**: 代码质量标准
- **Prettier 格式**: 统一代码风格

### 浏览器支持

- **现代浏览器**: Chrome 90+, Firefox 88+, Safari 14+
- **移动端**: iOS Safari 14+, Chrome Mobile 90+
- **不支持**: IE 11 及以下版本
