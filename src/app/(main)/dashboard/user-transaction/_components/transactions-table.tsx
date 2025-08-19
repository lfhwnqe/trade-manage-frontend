"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { DataTable as DataTableNew } from "../../../../../components/data-table/data-table";
import { DataTablePagination } from "../../../../../components/data-table/data-table-pagination";
import { DataTableViewOptions } from "../../../../../components/data-table/data-table-view-options";
import { QueryActionBar } from "@/components/layouts/query-action-bar";

import { getTransactionColumns } from "./transactions-columns";
import { Transaction, TransactionType } from "@/types/transaction";
import { toPaymentMethodLabel, toTransactionStatusLabel } from "@/lib/enum-labels";
import useSWR from "swr";
import { fetchWithAuth } from "@/utils/fetch-with-auth";

export function TransactionsDataTable({
  data: initialData,
  loading = false,
  onRefresh,
  onSearch,
  onQuery,
  pagination,
}: {
  data: Transaction[];
  loading?: boolean;
  onRefresh?: () => void;
  onSearch?: (productId: string) => void;
  onQuery?: () => void;
  pagination?: {
    page: number; // 1-based
    limit: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void; // 1-based
    onPageSizeChange: (size: number) => void;
  };
}) {
  const [data, setData] = React.useState(() => initialData);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedTxn, setSelectedTxn] = React.useState<Transaction | null>(null);

  const columns = React.useMemo(
    () =>
      getTransactionColumns({
        onViewDetail: (txn) => {
          setSelectedTxn(txn);
          setDetailOpen(true);
        },
      }),
    [],
  );
  const table = useDataTableInstance({ data, columns, getRowId: (row) => row.transactionId });

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // 同步外部分页到表格内部分页状态
  React.useEffect(() => {
    if (pagination) {
      const safePage = Math.max(1, pagination.page);
      if (table.getState().pagination.pageIndex !== safePage - 1) {
        table.setPageIndex(safePage - 1);
      }
      if (table.getState().pagination.pageSize !== pagination.limit) {
        table.setPageSize(pagination.limit);
      }
    }
  }, [pagination?.page, pagination?.limit]);

  const handleSearch = (productId: string) => {
    setSearchQuery(productId);
    onSearch?.(productId);
  };

  return (
    <div className="w-full flex-col justify-start gap-6">
      <div className="mb-6">
        <QueryActionBar
          left={
            <>
              <div className="relative max-w-sm min-w-[200px] flex-1">
                <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                <Input
                  placeholder="按产品ID搜索..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button size="sm" onClick={() => onQuery?.()}>
                <Search className="mr-2 h-4 w-4" /> 查询
              </Button>
            </>
          }
          right={<DataTableViewOptions table={table} />}
        />
      </div>

      <div className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border">
          <DataTableNew table={table} columns={columns} loading={loading} />
        </div>
        <DataTablePagination
          table={table}
          server={
            pagination
              ? {
                  page: pagination.page,
                  pageSize: pagination.limit,
                  pageCount: pagination.totalPages,
                  total: pagination.total,
                  onPageChange: pagination.onPageChange,
                  onPageSizeChange: pagination.onPageSizeChange,
                  loading,
                }
              : undefined
          }
        />
      </div>

      {/* 查看详情 Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>交易详情</DialogTitle>
            <DialogDescription>查看交易的完整信息。</DialogDescription>
          </DialogHeader>
          <TxnDetailContent txnId={selectedTxn?.transactionId} />
          <DialogFooter></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 保留一个占位旧组件签名，便于可能的复用（不使用拖拽）
export function DataTable({ data: initialData }: { data: Array<Record<string, unknown>> }) {
  const columns: never[] = [];
  const table = useDataTableInstance({
    data: initialData,
    columns,
    getRowId: (row) => {
      const r = row as { id?: string | number };
      return String(r.id ?? "");
    },
  });
  return (
    <Tabs defaultValue="outline" className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <TabsList>
          <TabsTrigger value="outline">Outline</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="outline" className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border">
          <DataTableNew table={table} columns={columns} />
        </div>
        <DataTablePagination table={table} />
      </TabsContent>
    </Tabs>
  );
}

// 交易详情内容（打开对话框时按需请求）
function TxnDetailContent({ txnId }: { txnId?: string | null }) {
  type ApiResponse<T> = { success: boolean; data: T; message?: unknown };
  const fetcher = async (url: string) => {
    const res = await fetchWithAuth(url);
    if (!res.ok) {
      const err: unknown = await res.json().catch(() => null);
      const msg = (() => {
        if (err && typeof err === "object") {
          const m1 = (err as { message?: unknown }).message;
          if (typeof m1 === "string") return m1;
          if (m1 && typeof m1 === "object") {
            const m2 = (m1 as { message?: unknown }).message;
            if (typeof m2 === "string") return m2;
          }
        }
        return `加载失败: ${res.status} ${res.statusText}`;
      })();
      throw new Error(msg);
    }
    return (await res.json()) as ApiResponse<Transaction>;
  };

  const { data, error, isLoading } = useSWR<ApiResponse<Transaction>>(
    txnId ? `/api/v1/customers/transactions/detail?transactionId=${txnId}` : null,
    fetcher,
  );

  if (!txnId) {
    return <div className="text-muted-foreground text-sm">未选择交易</div>;
  }
  if (isLoading) {
    return <div className="text-muted-foreground text-sm">加载中...</div>;
  }
  if (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return <div className="text-destructive text-sm">加载失败：{msg}</div>;
  }
  const t = data?.data;
  if (!t) return null;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="md:col-span-2">
        <Label className="text-muted-foreground text-xs">交易ID</Label>
        <div className="text-sm font-medium">{t.transactionId}</div>
      </div>
      <div>
        <Label className="text-muted-foreground text-xs">客户</Label>
        <div className="text-sm">{t.customerName || t.customerId}</div>
      </div>
      <div>
        <Label className="text-muted-foreground text-xs">产品</Label>
        <div className="text-sm">{t.productName || t.productId}</div>
      </div>
      <div>
        <Label className="text-muted-foreground text-xs">交易类型</Label>
        <div className="text-sm">
          {t.transactionType === TransactionType.PURCHASE ? "申购（purchase）" : "赎回（redeem）"}
        </div>
      </div>
      <div>
        <Label className="text-muted-foreground text-xs">数量</Label>
        <div className="text-sm">{t.quantity}</div>
      </div>
      <div>
        <Label className="text-muted-foreground text-xs">单价</Label>
        <div className="text-sm">{t.unitPrice}</div>
      </div>
      <div>
        <Label className="text-muted-foreground text-xs">总金额</Label>
        <div className="text-sm">{t.totalAmount}</div>
      </div>
      <div>
        <Label className="text-muted-foreground text-xs">状态</Label>
        <div className="text-sm">{toTransactionStatusLabel(t.transactionStatus)}</div>
      </div>
      <div>
        <Label className="text-muted-foreground text-xs">支付方式</Label>
        <div className="text-sm">{toPaymentMethodLabel(t.paymentMethod)}</div>
      </div>
      {t.expectedMaturityDate && (
        <div>
          <Label className="text-muted-foreground text-xs">预期到期日期</Label>
          <div className="text-sm">{t.expectedMaturityDate}</div>
        </div>
      )}
      {typeof t.actualReturnRate === "number" && (
        <div>
          <Label className="text-muted-foreground text-xs">实际收益率</Label>
          <div className="text-sm">{t.actualReturnRate}</div>
        </div>
      )}
      {t.completedAt && (
        <div>
          <Label className="text-muted-foreground text-xs">完成时间</Label>
          <div className="text-sm">{t.completedAt}</div>
        </div>
      )}
      <div>
        <Label className="text-muted-foreground text-xs">创建时间</Label>
        <div className="text-sm">{new Date(t.createdAt).toLocaleString("zh-CN")}</div>
      </div>
      <div>
        <Label className="text-muted-foreground text-xs">更新时间</Label>
        <div className="text-sm">{new Date(t.updatedAt).toLocaleString("zh-CN")}</div>
      </div>
      {t.notes && (
        <div className="md:col-span-2">
          <Label className="text-muted-foreground text-xs">备注</Label>
          <div className="text-sm whitespace-pre-wrap">{t.notes}</div>
        </div>
      )}
    </div>
  );
}
