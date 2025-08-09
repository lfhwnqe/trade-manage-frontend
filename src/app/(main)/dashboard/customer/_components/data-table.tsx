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

import { DataTable as DataTableNew } from "../../../../../components/data-table/data-table";
import { DataTablePagination } from "../../../../../components/data-table/data-table-pagination";
import { DataTableViewOptions } from "../../../../../components/data-table/data-table-view-options";
import { withDndColumn } from "../../../../../components/data-table/table-utils";

import { customerColumns, dashboardColumns } from "./columns";
import { customerSchema, sectionSchema, Customer, CustomerStatus, RiskLevel } from "./schema";
import { CreateCustomerDialog } from "./create-customer-dialog";

// 客户数据表格组件
export function CustomerDataTable({
  data: initialData,
  loading = false,
  error = null,
  onRefresh,
  onSearch,
  onFilter,
  onQuery,
  onCreated,
}: {
  data: Customer[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onSearch?: (query: string) => void;
  onFilter?: (filters: any) => void;
  onQuery?: () => void;
  onCreated?: () => void;
}) {
  const [data, setData] = React.useState(() => initialData);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [riskLevelFilter, setRiskLevelFilter] = React.useState<string>("all");
  const [createOpen, setCreateOpen] = React.useState(false);

  const columns = customerColumns;
  const table = useDataTableInstance({
    data,
    columns,
    getRowId: (row) => row.customerId,
  });

  // 更新数据当props变化时
  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

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
      {/* 工具栏 */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative max-w-sm flex-1">
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
        </div>
        <div className="flex items-center gap-2">
          <DataTableViewOptions table={table} />
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4" />
            <span className="hidden lg:inline">导入</span>
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            <span className="hidden lg:inline">导出</span>
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden lg:inline">新增客户</span>
          </Button>
        </div>
      </div>

      {/* 数据表格 */}
      <div className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground text-sm">加载中...</div>
            </div>
          ) : (
            <DataTableNew table={table} columns={columns} />
          )}
        </div>
        <DataTablePagination table={table} />
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
