# 项目简介

**项目名称**: Trade Manage Frontend (基于 Studio Admin 模板)  
**项目类型**: 现代化管理后台前端应用  
**技术栈**: Next.js 15 + TypeScript + Shadcn/ui + Tailwind CSS v4

## 核心目标

这是一个基于 Studio Admin 模板的贸易管理前端系统，旨在提供：

1. **现代化管理界面**: 使用 Next.js 15 App Router 和 Shadcn/ui 构建的响应式管理后台
2. **多样化仪表板**: 支持 Default、CRM、Finance 等多种业务场景的仪表板
3. **灵活的布局系统**: 可配置的侧边栏样式、主题预设和内容布局
4. **强大的数据表格**: 基于 TanStack Table 的可拖拽、可筛选、可分页数据表格
5. **完整的认证系统**: 多版本登录注册界面和中间件保护

## 项目特色

- **文件系统架构**: 采用 Next.js App Router 的 colocation 架构，按功能模块组织代码
- **主题系统**: 支持 light/dark 模式和多种颜色主题预设 (Tangerine, Brutalist, Soft Pop)
- **可配置布局**: 侧边栏变体 (inset/sidebar/floating) 和折叠模式 (icon/offcanvas)
- **状态管理**: 使用 Zustand 管理用户偏好设置
- **开发工具链**: 集成 ESLint、Prettier、Husky 等现代开发工具

## 目标用户

适用于需要快速构建管理后台的项目，特别是：

- SaaS 应用的管理界面
- 企业内部管理系统
- 数据可视化和报表系统
- 电商后台管理
- CRM 和 ERP 系统

## 设计原则

- **简洁不臃肿**: 避免传统管理模板的臃肿和过时设计
- **模块化架构**: 功能组件就近放置，便于维护和扩展
- **类型安全**: 全程 TypeScript 开发，减少运行时错误
- **响应式设计**: 移动端友好的响应式布局
- **开发体验**: 优秀的 DX，支持热重载和快速迭代
