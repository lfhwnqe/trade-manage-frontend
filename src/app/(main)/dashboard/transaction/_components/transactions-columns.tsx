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
import { PAYMENT_METHOD_LABEL, TRANSACTION_STATUS_BADGE, TRANSACTION_TYPE_LABEL } from "@/lib/enum-labels";

export function getTransactionColumns(opts?: {
  onViewDetail?: (txn: Transaction) => void;
  onEdit?: (txn: Transaction) => void;
}): ColumnDef<Transaction>[] {
  const onViewDetail = opts?.onViewDetail;
  const onEdit = opts?.onEdit;
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
        const label = (TRANSACTION_TYPE_LABEL as Record<string, string>)[v] ?? String(v);
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
      cell: ({ row }) => {
        const v = row.original.paymentMethod as string;
        const label = (PAYMENT_METHOD_LABEL as Record<string, string>)[v] ?? String(v);
        return <span className="text-xs">{label}</span>;
      },
      size: 120,
    },
    {
      accessorKey: "transactionStatus",
      header: "状态",
      cell: ({ row }) => {
        const s = row.original.transactionStatus as TransactionStatus | string;
        const cur = (TRANSACTION_STATUS_BADGE as Record<string, { cls: string; label: string }>)[s] || {
          cls: "bg-muted",
          label: String(s),
        };
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
            <DropdownMenuItem onClick={() => onEdit?.(row.original)}>编辑</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 80,
      enableSorting: false,
      meta: { sticky: "right" },
    },
  ];
}
