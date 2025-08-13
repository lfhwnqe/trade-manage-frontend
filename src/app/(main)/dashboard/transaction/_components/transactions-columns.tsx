"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { EllipsisVertical } from "lucide-react";
import { Transaction, TransactionStatus, TransactionType } from "@/types/transaction";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function getTransactionColumns(opts?: { onViewDetail?: (txn: Transaction) => void }): ColumnDef<Transaction>[] {
  const onViewDetail = opts?.onViewDetail;
  return [
    {
      accessorKey: "customerName",
      header: "客户名",
      cell: ({ row }) => <span className="text-xs">{row.original.customerName || row.original.customerId}</span>,
      size: 180,
    },
    {
      accessorKey: "productName",
      header: "产品名",
      cell: ({ row }) => <span className="text-xs">{row.original.productName || row.original.productId}</span>,
      size: 200,
    },
    {
      accessorKey: "transactionType",
      header: "类型",
      cell: ({ row }) => {
        const v = row.original.transactionType;
        const color =
          v === TransactionType.PURCHASE ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600";
        const label = v === TransactionType.PURCHASE ? "申购" : "赎回";
        return <Badge className={color}>{label}</Badge>;
      },
      size: 100,
    },
    {
      accessorKey: "quantity",
      header: "数量",
      cell: ({ row }) => <span>{row.original.quantity}</span>,
      size: 80,
    },
    {
      accessorKey: "unitPrice",
      header: "单价",
      cell: ({ row }) => <span>{row.original.unitPrice}</span>,
      size: 100,
    },
    {
      accessorKey: "totalAmount",
      header: "总金额",
      cell: ({ row }) => <span>{row.original.totalAmount}</span>,
      size: 120,
    },
    {
      accessorKey: "paymentMethod",
      header: "支付方式",
      cell: ({ row }) => <span className="text-xs">{row.original.paymentMethod}</span>,
      size: 120,
    },
    {
      accessorKey: "transactionStatus",
      header: "状态",
      cell: ({ row }) => {
        const s = row.original.transactionStatus as TransactionStatus | string;
        const map: Record<string, { cls: string; label: string }> = {
          [TransactionStatus.PENDING]: { cls: "bg-gray-500/10 text-gray-600", label: "待处理" },
          [TransactionStatus.CONFIRMED]: { cls: "bg-indigo-500/10 text-indigo-600", label: "已确认" },
          [TransactionStatus.COMPLETED]: { cls: "bg-blue-500/10 text-blue-600", label: "已完成" },
          [TransactionStatus.CANCELLED]: { cls: "bg-red-500/10 text-red-600", label: "已取消" },
        };
        const cur = map[s] || { cls: "bg-muted", label: String(s) };
        return <Badge className={cur.cls}>{cur.label}</Badge>;
      },
      size: 120,
    },
    {
      accessorKey: "createdAt",
      header: "创建时间",
      cell: ({ row }) => <span className="text-xs">{new Date(row.original.createdAt).toLocaleString("zh-CN")}</span>,
      size: 180,
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <EllipsisVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => onViewDetail?.(row.original)}>查看详情</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 80,
      enableSorting: false,
    },
  ];
}
