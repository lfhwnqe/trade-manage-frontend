"use client";

import * as React from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { fetchWithAuth } from "@/utils/fetch-with-auth";
import { TransactionsDataTable } from "./_components/transactions-table";
import { Transaction } from "@/types/transaction";

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
  productId?: string;
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
  });
  // 表单编辑中的待提交参数（不触发请求）
  const [formParams, setFormParams] = React.useState<QueryParams>({
    page: 1,
    limit: 10,
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
  } = useSWR(enabled ? `/api/v1/customers/purchases?${paramsString}` : null, fetcher, {
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
  const total = result?.data?.total ?? 0;
  const page = result?.data?.page ?? queryParams.page ?? 1;
  const limit = result?.data?.limit ?? queryParams.limit ?? 10;
  const totalPages = result?.data?.totalPages ?? (limit ? Math.max(1, Math.ceil(total / limit)) : 1);

  const handleRefresh = () => {
    if (enabled) mutate();
  };

  // 分页交互：页码变化（1-based）
  const handlePageChange = (nextPage: number) => {
    setQueryParams((prev) => ({ ...(prev || {}), page: Math.max(1, nextPage) }));
    setEnabled(true);
  };

  // 分页交互：每页数量变化
  const handlePageSizeChange = (nextSize: number) => {
    setQueryParams((prev) => ({ ...(prev || {}), limit: nextSize, page: 1 }));
    setEnabled(true);
  };

  // 仅更新表单参数，不触发请求
  const handleSearch = (productId: string) => {
    setFormParams((prev) => ({ ...prev, productId, page: 1 }));
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
        onQuery={handleQuery}
        pagination={{
          page,
          limit,
          total,
          totalPages,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
        }}
      />
    </div>
  );
}
