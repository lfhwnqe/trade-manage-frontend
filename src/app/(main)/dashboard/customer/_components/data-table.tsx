"use client";

import * as React from "react";

import { Plus, Search, Filter, Download, Upload } from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { DataTable as DataTableNew } from "../../../../../components/data-table/data-table";
import { DataTablePagination } from "../../../../../components/data-table/data-table-pagination";
import { DataTableViewOptions } from "../../../../../components/data-table/data-table-view-options";
import { withDndColumn } from "../../../../../components/data-table/table-utils";
import { QueryActionBar } from "@/components/layouts/query-action-bar";

import { getCustomerColumns, customerColumns as defaultCustomerColumns, dashboardColumns } from "./columns";
import { customerSchema, sectionSchema, Customer, CustomerStatus, RiskLevel } from "./schema";
import { CreateCustomerDialog } from "./create-customer-dialog";
import { EditCustomerDialog } from "./edit-customer-dialog";
import { ImportCustomerDialog } from "./import-customer-dialog";

// 客户数据表格组件
export function CustomerDataTable({
  data: initialData,
  loading = false,
  error = null,
  onRefresh,
  onSearch,
  onFilter,
  onQuery,
  onExport,
  exporting,
  onCreated,
  pagination,
}: {
  data: Customer[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onSearch?: (query: string) => void;
  onFilter?: (filters: any) => void;
  onQuery?: () => void;
  onExport?: () => void;
  exporting?: boolean;
  onCreated?: () => void;
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
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [riskLevelFilter, setRiskLevelFilter] = React.useState<string>("all");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editCustomer, setEditCustomer] = React.useState<Customer | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);
  const columns = React.useMemo(
    () =>
      getCustomerColumns({
        onViewDetail: (cust) => {
          setSelectedCustomer(cust);
          setDetailOpen(true);
        },
        onEdit: (cust) => {
          setEditCustomer(cust);
          setEditOpen(true);
        },
      }),
    [],
  );
  const table = useDataTableInstance({
    data,
    columns,
    getRowId: (row) => row.customerId,
  });

  // 更新数据当props变化时
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // 当传入服务端分页参数变化时，同步到表格内部状态（用于分页控件展示）
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

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    onFilter?.({
      status: status === "all" ? undefined : status,
      riskLevel: riskLevelFilter === "all" ? undefined : riskLevelFilter,
    });
  };

  const handleRiskLevelFilter = (riskLevel: string) => {
    setRiskLevelFilter(riskLevel);
    onFilter?.({
      status: statusFilter === "all" ? undefined : statusFilter,
      riskLevel: riskLevel === "all" ? undefined : riskLevel,
    });
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <div className="text-destructive text-sm">加载客户数据时出错: {error}</div>
        <Button onClick={onRefresh} variant="outline" size="sm">
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full flex-col justify-start gap-6">
      {/* 工具栏：左右两侧均支持自动换行 */}
      <div className="mb-6">
        <QueryActionBar
          left={
            <>
              <div className="relative max-w-sm min-w-[200px] flex-1">
                <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                <Input
                  placeholder="搜索客户姓名、邮箱或手机号..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value={CustomerStatus.ACTIVE}>活跃</SelectItem>
                  <SelectItem value={CustomerStatus.INACTIVE}>非活跃</SelectItem>
                  <SelectItem value={CustomerStatus.SUSPENDED}>暂停</SelectItem>
                </SelectContent>
              </Select>
              <Select value={riskLevelFilter} onValueChange={handleRiskLevelFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="风险等级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部等级</SelectItem>
                  <SelectItem value={RiskLevel.LOW}>低</SelectItem>
                  <SelectItem value={RiskLevel.MEDIUM}>中</SelectItem>
                  <SelectItem value={RiskLevel.HIGH}>高</SelectItem>
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
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4" />
                <span className="hidden lg:inline">导入</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => onExport?.()} disabled={exporting}>
                <Download className="h-4 w-4" />
                <span className="hidden lg:inline">{exporting ? "导出中..." : "导出"}</span>
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                <span className="hidden lg:inline">新增客户</span>
              </Button>
            </>
          }
        />
      </div>

      {/* 数据表格 */}
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
      <CreateCustomerDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          // 触发查询并刷新
          onQuery?.();
          onRefresh?.();
        }}
      />

      {/* 导入客户 Dialog */}
      <ImportCustomerDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => {
          // 导入完成后刷新列表
          onQuery?.();
          onRefresh?.();
        }}
      />

      {/* 查看详情 Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>客户详情</DialogTitle>
            <DialogDescription>查看客户的基本信息与状态。</DialogDescription>
          </DialogHeader>
          {selectedCustomer ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {/* 客户ID无展示需求，移除 */}
              <div>
                <Label className="text-muted-foreground text-xs">姓名</Label>
                <div className="text-sm">
                  {selectedCustomer.lastName}
                  {selectedCustomer.firstName}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">邮箱</Label>
                <div className="text-sm">{selectedCustomer.email}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">手机号</Label>
                <div className="text-sm">{selectedCustomer.phone}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">证件类型</Label>
                <div className="text-sm">{selectedCustomer.idType}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">证件号码</Label>
                <div className="text-sm break-all">{selectedCustomer.idNumber}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">出生日期</Label>
                <div className="text-sm">{selectedCustomer.dateOfBirth}</div>
              </div>
              <div className="md:col-span-2">
                <Label className="text-muted-foreground text-xs">联系地址</Label>
                <div className="text-sm">{selectedCustomer.address}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">风险等级</Label>
                <div className="text-sm">{selectedCustomer.riskLevel}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">状态</Label>
                <div className="text-sm">{selectedCustomer.status}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">创建时间</Label>
                <div className="text-sm">{new Date(selectedCustomer.createdAt).toLocaleString("zh-CN")}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">更新时间</Label>
                <div className="text-sm">{new Date(selectedCustomer.updatedAt).toLocaleString("zh-CN")}</div>
              </div>
              {selectedCustomer.wechatId && (
                <div>
                  <Label className="text-muted-foreground text-xs">微信号</Label>
                  <div className="text-sm">{selectedCustomer.wechatId}</div>
                </div>
              )}
              {selectedCustomer.remarks && (
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground text-xs">备注</Label>
                  <div className="text-sm whitespace-pre-wrap">{selectedCustomer.remarks}</div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* 编辑客户 Dialog */}
      <EditCustomerDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={editCustomer}
        onUpdated={() => {
          onQuery?.();
          onRefresh?.();
        }}
      />
    </div>
  );
}

// 保留原有的DataTable组件以防其他地方使用
export function DataTable({ data: initialData }: { data: z.infer<typeof sectionSchema>[] }) {
  const [data, setData] = React.useState(() => initialData);
  const columns = withDndColumn(dashboardColumns);
  const table = useDataTableInstance({ data, columns, getRowId: (row) => row.id.toString() });

  return (
    <Tabs defaultValue="outline" className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="outline">
          <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm" id="view-selector">
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="past-performance">Past Performance</SelectItem>
            <SelectItem value="key-personnel">Key Personnel</SelectItem>
            <SelectItem value="focus-documents">Focus Documents</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="outline">Outline</TabsTrigger>
          <TabsTrigger value="past-performance">
            Past Performance <Badge variant="secondary">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="key-personnel">
            Key Personnel <Badge variant="secondary">2</Badge>
          </TabsTrigger>
          <TabsTrigger value="focus-documents">Focus Documents</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DataTableViewOptions table={table} />
          <Button variant="outline" size="sm">
            <Plus />
            <span className="hidden lg:inline">Add Section</span>
          </Button>
        </div>
      </div>
      <TabsContent value="outline" className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border">
          <DataTableNew dndEnabled table={table} columns={columns} onReorder={setData} />
        </div>
        <DataTablePagination table={table} />
      </TabsContent>
      <TabsContent value="past-performance" className="flex flex-col">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="focus-documents" className="flex flex-col">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  );
}
