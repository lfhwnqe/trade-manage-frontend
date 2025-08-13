"use client";

import * as React from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { fetchWithAuth } from "@/utils/fetch-with-auth";
import { TransactionsDataTable } from "./_components/transactions-table";
import { PaymentMethod, Transaction, TransactionStatus, TransactionType } from "@/types/transaction";

// 后端统一响应包装
interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp?: string;
  message?: unknown;
}

// 列表数据载荷（与后端统一返回结构对齐）
interface TransactionListData {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface QueryParams {
  page?: number;
  limit?: number;
  search?: string; // 可用于按客户ID、产品ID
  transactionType?: TransactionType | string;
  transactionStatus?: TransactionStatus | string;
  paymentMethod?: PaymentMethod | string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// SWR fetcher for transactions data
const fetcher = async (url: string) => {
  const res = await fetchWithAuth(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message?.message || `获取交易数据失败: ${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  return (await res.json()) as ApiResponse<TransactionListData>;
};

export default function Page() {
  // 提交后用于请求的参数
  const [queryParams, setQueryParams] = React.useState<QueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  // 表单编辑中的待提交参数（不触发请求）
  const [formParams, setFormParams] = React.useState<QueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  // 是否允许发起查询
  const [enabled, setEnabled] = React.useState(false);

  // 构建请求 URL
  const paramsString = React.useMemo(() => {
    const sp = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        sp.append(key, value.toString());
      }
    });
    return sp.toString();
  }, [queryParams]);

  const {
    data: result,
    error,
    isLoading,
    mutate,
  } = useSWR(enabled ? `/api/v1/transactions?${paramsString}` : null, fetcher, {
    keepPreviousData: true,
    shouldRetryOnError: false,
  });

  React.useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  // 注意：后端返回为 { success, data: { data: Transaction[], total, ... } }
  const transactions = result?.data?.data ?? [];

  const handleRefresh = () => {
    if (enabled) mutate();
  };

  // 仅更新表单参数，不触发请求
  const handleSearch = (query: string) => {
    setFormParams((prev) => ({ ...prev, search: query, page: 1 }));
  };

  // 仅更新表单参数，不触发请求
  const handleFilter = (filters: any) => {
    setFormParams((prev) => ({
      ...prev,
      transactionType: filters?.transactionType,
      transactionStatus: filters?.transactionStatus,
      paymentMethod: filters?.paymentMethod,
      page: 1,
    }));
  };

  // 点击“查询”按钮时提交表单参数并发起请求
  const handleQuery = () => {
    setQueryParams(formParams);
    setEnabled(true);
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <TransactionsDataTable
        data={transactions}
        loading={isLoading}
        onRefresh={handleRefresh}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onQuery={handleQuery}
      />
    </div>
  );
}
