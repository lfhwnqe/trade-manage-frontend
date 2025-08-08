# 客户页面数据获取逻辑修改总结

## 修改概述

本次修改将客户页面的数据获取逻辑从使用静态JSON数据改为使用认证请求工具调用后端API接口，实现了真正的数据交互功能。

## 修改的文件

### 1. `src/app/(main)/dashboard/customer/_components/schema.ts`

- **修改内容**: 添加了客户数据的完整schema定义
- **新增功能**:
  - 定义了`CustomerStatus`、`IdType`、`RiskLevel`枚举
  - 创建了`customerSchema`用于客户数据验证
  - 导出了`Customer`类型定义
- **保持兼容**: 保留了原有的`sectionSchema`以防其他地方使用

### 2. `src/app/(main)/dashboard/customer/_components/columns.tsx`

- **修改内容**: 添加了专门的客户数据表格列定义
- **新增功能**:
  - 创建了`customerColumns`数组，包含客户相关的所有列
  - 添加了客户ID、姓名、邮箱、手机号、状态、风险等级、创建时间等列
  - 实现了状态和风险等级的Badge显示
  - 添加了操作菜单（查看详情、编辑、导出、删除）
- **UI改进**: 使用图标增强用户体验，支持筛选功能
- **保持兼容**: 保留了原有的`dashboardColumns`

### 3. `src/app/(main)/dashboard/customer/_components/data-table.tsx`

- **修改内容**: 创建了新的`CustomerDataTable`组件
- **新增功能**:
  - 支持加载状态和错误处理
  - 实现了搜索功能（支持姓名、邮箱、手机号搜索）
  - 添加了状态和风险等级筛选
  - 提供了导入、导出、新增客户等操作按钮
  - 支持数据刷新功能
- **用户体验**: 提供了完整的错误提示和重试机制
- **保持兼容**: 保留了原有的`DataTable`组件

### 4. `src/app/(main)/dashboard/customer/page.tsx`

- **修改内容**: 完全重写了页面组件，从静态数据改为动态API调用
- **新增功能**:
  - 使用`useFetchWithAuth`钩子进行认证请求
  - 实现了分页、搜索、筛选等查询参数管理
  - 添加了加载状态、错误处理和数据刷新功能
  - 支持实时搜索和筛选
- **API集成**: 调用`/api/v1/customers`接口获取客户数据
- **状态管理**: 使用React hooks管理组件状态

## 技术特性

### 1. 认证集成

- 使用`useFetchWithAuth`工具自动处理JWT认证
- 支持token刷新和自动重定向到登录页面
- 处理401未授权错误

### 2. 数据验证

- 使用Zod进行客户数据schema验证
- 确保类型安全和数据一致性

### 3. 用户体验

- 提供加载状态指示器
- 实现错误处理和重试机制
- 支持实时搜索和筛选
- 响应式设计，支持移动端

### 4. 性能优化

- 使用React.useCallback优化函数重新创建
- 实现防抖搜索（通过查询参数管理）
- 支持分页减少数据传输量

## API接口对接

### 请求路径

- **前端请求**: `/api/v1/customers`
- **后端接口**: `GET /customers` (通过Next.js rewrites代理)

### 支持的查询参数

- `page`: 页码
- `limit`: 每页数量
- `search`: 搜索关键词（姓名、邮箱、手机号）
- `status`: 客户状态筛选
- `riskLevel`: 风险等级筛选
- `sortBy`: 排序字段
- `sortOrder`: 排序方向

### 响应格式

```typescript
interface CustomerListResponse {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

## 错误处理

### 1. 网络错误

- 显示友好的错误消息
- 提供重试按钮
- 自动处理认证失败

### 2. 数据验证错误

- 使用Zod schema验证响应数据
- 处理数据格式不匹配的情况

### 3. 用户体验

- 加载状态指示器
- 空数据状态提示
- 错误状态恢复机制

## 兼容性说明

所有修改都保持了向后兼容性：

- 保留了原有的组件和schema定义
- 新功能通过新组件实现
- 不影响其他页面的正常使用

## 下一步建议

1. **测试**: 建议编写单元测试和集成测试
2. **优化**: 可以添加数据缓存和虚拟滚动
3. **功能扩展**: 可以添加批量操作和高级筛选
4. **监控**: 添加错误监控和性能监控
