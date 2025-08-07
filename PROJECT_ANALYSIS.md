# Next.js Shadcn Admin 项目分析与开发指南

本文档旨在帮助您快速理解 `next-shadcn-admin-dashboard` 项目的结构，并指导您如何在此基础上进行二次开发。

## 目录

1.  [项目结构概览](#项目结构概览)
2.  [如何添加菜单项](#如何添加菜单项)
3.  [鉴权机制解析](#鉴权机制解析)
4.  [如何开发常规分页列表页面](#如何开发常规分页列表页面)
5.  [如何为列表添加查询条件](#如何为列表添加查询条件)
6.  [如何设计到 AWS Lambda 的请求转发](#如何设计到-aws-lambda-的请求转发)

---

### 1. 项目结构概览

这个项目是一个基于 Next.js 15 (App Router)、Shadcn/ui 和 Tailwind CSS 的现代化管理后台模板。

- `src/app/(main)`: 包含所有需要登录后才能访问的主应用页面，例如 `dashboard`。它使用了一个共享的 `layout.tsx` 来渲染侧边栏和顶部导航。
- `src/app/(external)`: 用于独立的、不需要通用布局的页面（例如登录、注册页面的容器）。
- `src/components/ui`: 存放由 Shadcn/ui 生成的原子 UI 组件。
- `src/components/data-table`: 提供了功能强大的可复用数据表格组件，支持分页、排序、筛选等。
- `src/navigation/sidebar`: 定义了侧边栏的菜单结构。
- `src/middleware/auth-middleware.ts`: 核心的鉴权逻辑，通过 Next.js 中间件实现。
- `src/lib`: 存放工具函数，例如 `utils.ts`。

---

### 2. 如何添加菜单项

添加新的侧边栏菜单非常直接，所有菜单项都在一个文件中统一定义。

**步骤:**

1.  **打开配置文件**:
    打开 `src/navigation/sidebar/sidebar-items.ts`。

2.  **修改 `sidebarItems` 数组**:
    该文件导出了一个名为 `sidebarItems` 的数组。每个对象代表一个菜单项。您可以直接在这个数组中添加或修改条目。

    例如，要添加一个名为“商品管理”的一级菜单，底下包含“商品列表”和“添加商品”两个子菜单，您可以这样修改：

    ```typescript
    // src/navigation/sidebar/sidebar-items.ts

    // ... (原有的代码)

    export const sidebarItems: SidebarItems = {
      // ... (保留其他菜单项，例如 'main', 'secondary', 'user')
      main: [
        // ... (保留 'Dashboards' 菜单)
        {
          type: "collapsible",
          icon: "Package", // Heroicons 图标名称
          label: "商品管理",
          items: [
            {
              type: "link",
              label: "商品列表",
              href: "/dashboard/products",
            },
            {
              type: "link",
              label: "添加商品",
              href: "/dashboard/products/new",
            },
          ],
        },
      ],
      // ...
    };
    ```

3.  **创建对应页面**:
    确保您在 `href` 中指定的路径（例如 `/dashboard/products`）有对应的页面文件（`src/app/(main)/dashboard/products/page.tsx`），否则点击菜单会 404。

**关键点**:

- `type: 'collapsible'` 表示一个可折叠的父菜单。
- `type: 'link'` 表示一个可点击的链接。
- `icon`: 图标名称来自 [Heroicons](https://heroicons.com/)，您可以直接更换。

---

### 3. 鉴权机制解析

本项目的鉴权是基于 Next.js 的中间件（Middleware）实现的，在用户访问受保护页面前进行拦截和验证。

**核心文件**:

- `src/middleware/auth-middleware.ts`: 定义了鉴权逻辑。
- `src/middleware.disabled.ts`: 项目默认**禁用**了鉴权中间件。要启用它，您需要将其重命名为 `middleware.ts`。

**工作流程**:

1.  **启用中间件**: 将 `src/middleware.disabled.ts` 重命名为 `src/middleware.ts`。
2.  **拦截请求**: 中间件会拦截所有匹配 `matcher` 规则的请求（默认为 `/dashboard/:path*`）。
3.  **验证会话**:
    - 它会尝试从 `cookies` 中获取一个名为 `session` 的令牌。
    - 如果 `session` 不存在或无效，它会将用户重定向到登录页面 (`/auth/v1/login`)。
    - 如果 `session` 存在，则允许用户访问请求的页面。

**如何集成您自己的鉴权**:

1.  **修改 `auth-middleware.ts`**:
    - 将 `const session = request.cookies.get('session')?.value;` 这一行替换成您自己的会话验证逻辑。例如，从 cookie 中获取 JWT 令牌，然后调用后端 API 或使用密钥进行验证。
    - 如果验证失败，执行 `NextResponse.redirect(...)`。
    - 如果验证成功，执行 `NextResponse.next()`。

2.  **登录逻辑**:
    在您的登录页面（例如 `src/app/(main)/auth/_components/login-form.tsx`），当用户成功登录后，您需要在 `cookie` 中设置您的会- 话令牌（例如 `session`）。

---

### 4. 如何开发常规分页列表页面

项目中的 `CRM` 页面 (`src/app/(main)/dashboard/crm/page.tsx`) 是一个完美的分页列表范例。您可以复制并修改它来创建自己的列表页面。

**核心组件**:

- `src/components/data-table/data-table.tsx`: 可复用的数据表格组件。
- `src/hooks/use-data-table-instance.ts`: 管理表格状态（分页、排序、筛选）的 Hook。

**步骤**:

1.  **定义数据结构 (Schema)**:
    在页面组件旁边创建一个 `schema.ts` 文件，使用 `zod` 定义您的数据行结构。

    ```typescript
    // src/app/(main)/dashboard/products/schema.ts
    import { z } from "zod";

    export const productSchema = z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      stock: z.number(),
    });
    ```

2.  **定义表格列 (Columns)**:
    创建一个 `columns.tsx` 文件，定义每一列的显示方式。

    ```typescript
    // src/app/(main)/dashboard/products/columns.tsx
    "use client";
    import { ColumnDef } from "@tanstack/react-table";
    import { z } from "zod";
    import { productSchema } from "./schema";

    export const columns: ColumnDef<z.infer<typeof productSchema>>[] = [
      {
        accessorKey: "name",
        header: "商品名称",
      },
      {
        accessorKey: "price",
        header: "价格",
        cell: ({ row }) => `¥${row.original.price.toFixed(2)}`,
      },
      // ... 其他列
    ];
    ```

3.  **创建页面组件**:
    复制 `src/app/(main)/dashboard/crm/page.tsx` 到您的新页面目录，并进行修改。

    ```tsx
    // src/app/(main)/dashboard/products/page.tsx
    "use client";

    import { DataTable } from "@/components/data-table/data-table";
    import { useDataTableInstance } from "@/hooks/use-data-table-instance";
    import { columns } from "./columns";
    import { productSchema } from "./schema";
    import { z } from "zod";

    // 假设这是从 API 获取的数据
    const MOCK_DATA = [
      // ... 你的商品数据
    ];

    export default function ProductsPage() {
      const instance = useDataTableInstance({
        data: MOCK_DATA,
        columns,
        schema: productSchema,
      });

      return (
        <div className="p-4">
          <h1 className="mb-4 text-2xl font-bold">商品列表</h1>
          <DataTable instance={instance} />
        </div>
      );
    }
    ```

---

### 5. 如何为列表添加查询条件

`data-table` 组件已经内置了强大的筛选功能。您可以通过 `useDataTableInstance` Hook 和 `DataTable` 组件的属性来启用和配置它。

**步骤**:

1.  **启用全局搜索**:
    在 `useDataTableInstance` 中，通过 `search` 配置项指定要搜索的列。

    ```tsx
    // src/app/(main)/dashboard/products/page.tsx
    const instance = useDataTableInstance({
      // ...
      search: {
        placeholder: "搜索商品名称...",
        column: "name", // 指定在哪一列中进行模糊搜索
      },
    });
    ```

    这会自动在表格上方渲染一个搜索框。

2.  **添加条件筛选器 (Faceted Filters)**:
    如果您想添加类似“状态”或“分类”的下拉筛选器，可以配置 `filters` 选项。

    ```tsx
    // src/app/(main)/dashboard/products/page.tsx

    // 假设您的 schema 中有 category 字段
    // export const productSchema = z.object({ ... category: z.string() });

    const instance = useDataTableInstance({
      // ...
      filters: [
        {
          column: "category",
          title: "分类",
          options: [
            // 这些选项通常也从 API 获取
            { label: "电子产品", value: "electronics" },
            { label: "服装", value: "clothing" },
          ],
        },
      ],
    });
    ```

    这会在表格上方、搜索框旁边渲染一个“分类”筛选按钮。

---

### 6. 如何设计到 AWS Lambda 的请求转发

为了安全和统一管理，前端请求不应直接发往 AWS Lambda，而是通过 Next.js 的后端 API (Route Handlers) 作为代理进行转发。

**设计思路**:

1.  **创建 API 路由**:
    在 `src/app/api` 目录下创建您的 API 路由。例如，创建一个获取商品列表的路由：
    `src/app/api/products/route.ts`

2.  **编写路由处理器 (Route Handler)**:
    这个处理器负责接收前端请求，然后安全地调用后端的 AWS Lambda 函数。

    ```typescript
    // src/app/api/products/route.ts
    import { NextResponse } from "next/server";
    import { fetch } from "undici"; // 使用 undici 或 node-fetch

    const LAMBDA_ENDPOINT = process.env.LAMBDA_API_ENDPOINT; // 从环境变量读取 Lambda URL
    const API_KEY = process.env.LAMBDA_API_KEY; // 安全地存储 API Key

    export async function GET(request: Request) {
      try {
        // 1. 从前端请求中解析参数 (例如分页、查询条件)
        const { searchParams } = new URL(request.url);
        const page = searchParams.get("page") || "1";
        const query = searchParams.get("query") || "";

        // 2. 构建到 Lambda 的请求
        const lambdaUrl = new URL(`${LAMBDA_ENDPOINT}/products`);
        lambdaUrl.searchParams.set("page", page);
        lambdaUrl.searchParams.set("query", query);

        const response = await fetch(lambdaUrl.toString(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY, // 携带认证信息
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch data from Lambda");
        }

        const data = await response.json();

        // 3. 将 Lambda 的响应返回给前端
        return NextResponse.json(data);
      } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
      }
    }
    ```

3.  **前端调用**:
    在您的前端页面组件中，使用 `fetch` 或 `SWR`/`React-Query` 等库来调用您刚刚创建的 Next.js API 路由。

    ```tsx
    // 在你的分页列表页面中获取数据
    useEffect(() => {
      async function fetchData() {
        const response = await fetch("/api/products?page=1&query=laptop");
        const data = await response.json();
        // ... 更新你的组件状态
      }
      fetchData();
    }, []);
    ```

**优势**:

- **安全**: API 密钥和 Lambda 的真实 URL 不会暴露到浏览器。
- **统一**: 所有后端请求都通过 Next.js API 路由，方便管理和添加日志、缓存等。
- **简化**: 前端无需处理复杂的 AWS 认证逻辑。
