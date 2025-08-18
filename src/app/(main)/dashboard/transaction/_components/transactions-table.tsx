"use client";

import * as React from "react";
import { Search, Filter, Download, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { withDndColumn } from "../../../../../components/data-table/table-utils";
import { QueryActionBar } from "@/components/layouts/query-action-bar";

import { CreateTransactionDialog } from "./create-transaction-dialog";
import { EditTransactionDialog } from "./edit-transaction-dialog";
import { getTransactionColumns } from "./transactions-columns";
import { PaymentMethod, Transaction, TransactionStatus, TransactionType } from "@/types/transaction";
import { toPaymentMethodLabel, toTransactionStatusLabel } from "@/lib/enum-labels";
import useSWR from "swr";
import { fetchWithAuth } from "@/utils/fetch-with-auth";

type TxnFilterOverrides = Partial<{
  transactionType: string | undefined;
  transactionStatus: string | undefined;
  paymentMethod: string | undefined;
}>;

export function TransactionsDataTable({
  data: initialData,
  loading = false,
  onRefresh,
  onSearch,
  onFilter,
  onQuery,
  onExport,
  exporting,
  pagination,
}: {
  data: Transaction[];
  loading?: boolean;
  onRefresh?: () => void;
  onSearch?: (query: string) => void;
  onFilter?: (filters: TxnFilterOverrides) => void;
  onQuery?: () => void;
  onExport?: () => void;
  exporting?: boolean;
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
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [payFilter, setPayFilter] = React.useState<string>("ALL");
  const [createTxnOpen, setCreateTxnOpen] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedTxn, setSelectedTxn] = React.useState<Transaction | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);

  const columns = React.useMemo(
    () =>
      getTransactionColumns({
        onViewDetail: (txn) => {
          setSelectedTxn(txn);
          setDetailOpen(true);
        },
        onEdit: (txn) => {
          setSelectedTxn(txn);
          setEditOpen(true);
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const triggerFilter = (
    overrides: Partial<{
      transactionType: string | undefined;
      transactionStatus: string | undefined;
      paymentMethod: string | undefined;
    }>,
  ) => {
    onFilter?.({
      transactionType: overrides.transactionType,
      transactionStatus: overrides.transactionStatus,
      paymentMethod: overrides.paymentMethod,
    });
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value);
    triggerFilter({
      transactionType: value === "ALL" ? undefined : value,
      transactionStatus: statusFilter === "ALL" ? undefined : statusFilter,
      paymentMethod: payFilter === "ALL" ? undefined : payFilter,
    });
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    triggerFilter({
      transactionType: typeFilter === "ALL" ? undefined : typeFilter,
      transactionStatus: value === "ALL" ? undefined : value,
      paymentMethod: payFilter === "ALL" ? undefined : payFilter,
    });
  };

  const handlePayFilter = (value: string) => {
    setPayFilter(value);
    triggerFilter({
      transactionType: typeFilter === "ALL" ? undefined : typeFilter,
      transactionStatus: statusFilter === "ALL" ? undefined : statusFilter,
      paymentMethod: value === "ALL" ? undefined : value,
    });
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
                  placeholder="按客户ID/产品ID搜索..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={typeFilter} onValueChange={handleTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="交易类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全部类型</SelectItem>
                  <SelectItem value={TransactionType.PURCHASE}>申购（purchase）</SelectItem>
                  <SelectItem value={TransactionType.REDEEM}>赎回（redeem）</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全部状态</SelectItem>
                  <SelectItem value={TransactionStatus.PENDING}>待处理（pending）</SelectItem>
                  <SelectItem value={TransactionStatus.CONFIRMED}>已确认（confirmed）</SelectItem>
                  <SelectItem value={TransactionStatus.COMPLETED}>已完成（completed）</SelectItem>
                  <SelectItem value={TransactionStatus.CANCELLED}>已取消（cancelled）</SelectItem>
                </SelectContent>
              </Select>
              <Select value={payFilter} onValueChange={handlePayFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="支付方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全部支付方式</SelectItem>
                  <SelectItem value={PaymentMethod.BANK_TRANSFER}>银行转账（bank_transfer）</SelectItem>
                  <SelectItem value={PaymentMethod.CARD}>银行卡/信用卡（card）</SelectItem>
                  <SelectItem value={PaymentMethod.OTHER}>其他（other）</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => onQuery?.()}>
                <Search className="mr-2 h-4 w-4" /> 查询
              </Button>
            </>
          }
          right={
            <>
              <DataTableViewOptions table={table} />
              <Button variant="outline" size="sm" onClick={() => onExport?.()} disabled={exporting}>
                <Download className="h-4 w-4" />
                <span className="hidden lg:inline">{exporting ? "导出中..." : "导出"}</span>
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setCreateTxnOpen(true)}>
                <Plus className="h-4 w-4" />
                <span className="hidden lg:inline">新增交易</span>
              </Button>
            </>
          }
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

      <CreateTransactionDialog
        open={createTxnOpen}
        onOpenChange={setCreateTxnOpen}
        onCreated={() => {
          onQuery?.();
          onRefresh?.();
        }}
      />

      <EditTransactionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        transaction={selectedTxn}
        onUpdated={() => {
          onQuery?.();
          onRefresh?.();
        }}
      />

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
  const columns = withDndColumn([]);
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
    txnId ? `/api/v1/transactions/${txnId}` : null,
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
