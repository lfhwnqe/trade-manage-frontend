"use client";

import * as React from "react";
import useSWR from "swr";
import { fetchWithAuth } from "@/utils/fetch-with-auth";
import { ChartAreaInteractive } from "./_components/chart-area-interactive";
import { CustomerDataTable } from "./_components/data-table";
import { SectionCards } from "./_components/section-cards";
import { Customer } from "./_components/schema";

interface CustomerListResponse {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  riskLevel?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// SWR fetcher for customer data
const fetcher = async (url: string) => {
  const res = await fetchWithAuth(url);
  if (!res.ok) {
    throw new Error(`获取客户数据失败: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as CustomerListResponse;
};

export default function Page() {
  const [queryParams, setQueryParams] = React.useState<QueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

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
  } = useSWR(`/api/v1/customers?${paramsString}`, fetcher, { keepPreviousData: true, shouldRetryOnError: false });

  const customers = result?.data ?? [];

  const handleRefresh = () => {
    mutate();
  };

  const handleSearch = (query: string) => {
    setQueryParams((prev) => ({ ...prev, search: query, page: 1 }));
  };

  const handleFilter = (filters: { status?: string; riskLevel?: string }) => {
    setQueryParams((prev) => ({ ...prev, ...filters, page: 1 }));
  };

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      {/* <SectionCards />
      <ChartAreaInteractive /> */}
      <CustomerDataTable
        data={customers}
        loading={isLoading}
        error={error ? error.message : null}
        onRefresh={handleRefresh}
        onSearch={handleSearch}
        onFilter={handleFilter}
      />
    </div>
  );
}
