import {
  // ShoppingBag,
  // Forklift,
  // Mail,
  // MessageSquare,
  // Calendar,
  // Kanban,
  // ReceiptText,
  // Users,
  // Lock,
  // Fingerprint,
  // SquareArrowUpRight,
  ChartBar,
  Banknote,
  // Gauge,
  // GraduationCap,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

// 是否为本地开发环境
export const IS_DEV = process.env.NODE_ENV === "development";

// 基础（生产）菜单
const baseSidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Dashboards",
    items: [
      // 模板页面
      // {
      //   title: "Default",
      //   url: "/dashboard/default",
      //   icon: LayoutDashboard,
      // },
      {
        title: "客户管理",
        url: "/dashboard/customer",
        icon: LayoutDashboard,
      },
      {
        title: "产品管理",
        url: "/dashboard/products",
        icon: LayoutDashboard,
      },
      {
        title: "交易记录",
        url: "/dashboard/transaction",
        icon: LayoutDashboard,
      },
      // {
      //   title: "CRM",
      //   url: "/dashboard/crm",
      //   icon: ChartBar,
      // },
      // {
      //   title: "Finance",
      //   url: "/dashboard/finance",
      //   icon: Banknote,
      // },
      // {
      //   title: "Analytics",
      //   url: "/dashboard/analytics",
      //   icon: Gauge,
      //   comingSoon: true,
      // },
      // {
      //   title: "E-commerce",
      //   url: "/dashboard/e-commerce",
      //   icon: ShoppingBag,
      //   comingSoon: true,
      // },
      // {
      //   title: "Academy",
      //   url: "/dashboard/academy",
      //   icon: GraduationCap,
      //   comingSoon: true,
      // },
      // {
      //   title: "Logistics",
      //   url: "/dashboard/logistics",
      //   icon: Forklift,
      //   comingSoon: true,
      // },
    ],
  },
];

// dev 环境下追加到 Dashboards 分组的菜单（示例：模板/演示页面）
const devDashboardItems: NavMainItem[] = [
  {
    title: "Default",
    url: "/dashboard/default",
    icon: LayoutDashboard,
  },
  {
    title: "CRM",
    url: "/dashboard/crm",
    icon: ChartBar,
  },
  {
    title: "Finance",
    url: "/dashboard/finance",
    icon: Banknote,
  },
];

// 合并逻辑：dev 环境将 devDashboardItems 合并到 Dashboards 分组末尾
const withDevSidebarItems = (): NavGroup[] => {
  if (!IS_DEV) return baseSidebarItems;

  return baseSidebarItems.map((group) => {
    if (group.label === "Dashboards") {
      return {
        ...group,
        items: [...group.items, ...devDashboardItems],
      };
    }
    return group;
  });
};

export const sidebarItems: NavGroup[] = withDevSidebarItems();
