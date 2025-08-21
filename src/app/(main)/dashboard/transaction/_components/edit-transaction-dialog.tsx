"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFetchWithAuth, fetchWithAuth } from "@/utils/fetch-with-auth";
import { PaymentMethod, Transaction, TransactionStatus, TransactionType } from "@/types/transaction";
import useSWR from "swr";
// 仅用于下拉选项的轻量客户类型
type CustomerOption = { customerId: string; firstName?: string; lastName?: string; phone: string };
import { Product } from "@/types/product";

// 编辑交易表单校验（与创建一致，便于发送完整载荷）
const editTransactionSchema = z
  .object({
    customerId: z.string({ required_error: "客户ID不能为空" }).min(1, "请输入客户ID"),
    productId: z.string({ required_error: "产品ID不能为空" }).min(1, "请输入产品ID"),
    transactionType: z.nativeEnum(TransactionType, { required_error: "请选择交易类型" }),
    quantity: z.coerce.number({ invalid_type_error: "数量必须是数字" }).min(0, "数量不能小于0"),
    unitPrice: z.coerce.number({ invalid_type_error: "单价必须是数字" }).min(0, "单价不能小于0"),
    totalAmount: z
      .union([z.coerce.number({ invalid_type_error: "总金额必须是数字" }).min(0, "总金额不能小于0"), z.literal("")])
      .optional(),
    transactionStatus: z.nativeEnum(TransactionStatus).optional(),
    paymentMethod: z.nativeEnum(PaymentMethod, { required_error: "请选择支付方式" }),
    expectedMaturityDate: z.string().optional().or(z.literal("")),
    actualReturnRate: z
      .union([z.coerce.number({ invalid_type_error: "实际收益率必须是数字" }), z.literal("")])
      .optional(),
    notes: z.string().optional().or(z.literal("")),
    completedAt: z.string().optional().or(z.literal("")),
  })
  .refine(
    (val) =>
      val.totalAmount === "" ||
      val.totalAmount === undefined ||
      (typeof val.totalAmount === "number" && val.totalAmount >= 0),
    {
      message: "总金额不能小于0",
      path: ["totalAmount"],
    },
  );

type EditTransactionForm = z.infer<typeof editTransactionSchema>;

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  transaction: Transaction | null;
  onUpdated?: () => void;
}) {
  const doFetch = useFetchWithAuth();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<EditTransactionForm>({
    resolver: zodResolver(editTransactionSchema),
    values: {
      customerId: transaction?.customerId ?? "",
      productId: transaction?.productId ?? "",
      transactionType: (transaction?.transactionType as any) ?? TransactionType.PURCHASE,
      quantity: transaction?.quantity ?? 0,
      unitPrice: transaction?.unitPrice ?? 0,
      totalAmount: transaction?.totalAmount ?? "",
      transactionStatus: (transaction?.transactionStatus as any) ?? TransactionStatus.PENDING,
      paymentMethod: (transaction?.paymentMethod as any) ?? PaymentMethod.BANK_TRANSFER,
      expectedMaturityDate: transaction?.expectedMaturityDate ?? "",
      actualReturnRate: (transaction?.actualReturnRate as any) ?? "",
      notes: transaction?.notes ?? "",
      completedAt: transaction?.completedAt ?? "",
    },
  });

  React.useEffect(() => {
    // 同步变更到表单
    form.reset({
      customerId: transaction?.customerId ?? "",
      productId: transaction?.productId ?? "",
      transactionType: (transaction?.transactionType as any) ?? TransactionType.PURCHASE,
      quantity: transaction?.quantity ?? 0,
      unitPrice: transaction?.unitPrice ?? 0,
      totalAmount: transaction?.totalAmount ?? "",
      transactionStatus: (transaction?.transactionStatus as any) ?? TransactionStatus.PENDING,
      paymentMethod: (transaction?.paymentMethod as any) ?? PaymentMethod.BANK_TRANSFER,
      expectedMaturityDate: transaction?.expectedMaturityDate ?? "",
      actualReturnRate: (transaction?.actualReturnRate as any) ?? "",
      notes: transaction?.notes ?? "",
      completedAt: transaction?.completedAt ?? "",
    });
  }, [transaction]);

  // 选项：客户/产品（打开时加载）
  type ApiResponse<T> = { success: boolean; data: T; message?: unknown };
  type ListData<T> = { data: T[]; total: number; page: number; limit: number; totalPages: number };
  async function swrFetcher<T>(url: string): Promise<ApiResponse<ListData<T>>> {
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
    return (await res.json()) as ApiResponse<ListData<T>>;
  }

  const { data: customersRes } = useSWR<ApiResponse<ListData<CustomerOption>>>(
    open ? "/api/v1/customers?page=1&limit=500&sortBy=createdAt&sortOrder=desc" : null,
    (url: string) => swrFetcher<CustomerOption>(url),
  );
  const { data: productsRes } = useSWR<ApiResponse<ListData<Product>>>(
    open ? "/api/v1/products?page=1&limit=500&sortBy=createdAt&sortOrder=desc" : null,
    (url: string) => swrFetcher<Product>(url),
  );
  const customers = customersRes?.data?.data ?? [];
  const products = productsRes?.data?.data ?? [];

  const onSubmit = async (values: EditTransactionForm) => {
    if (!transaction) return;
    setSubmitting(true);
    try {
      // 去除空字符串字段；若 totalAmount 为空则按数量*单价计算
      const payload: Record<string, unknown> = { ...values };
      const maybeEmpty: (keyof EditTransactionForm)[] = [
        "totalAmount",
        "expectedMaturityDate",
        "actualReturnRate",
        "notes",
        "completedAt",
      ];
      for (const key of maybeEmpty) {
        const k = key as string;
        const v = payload[k];
        if (v === "" || v === null) delete payload[k];
      }
      if (payload["totalAmount"] === undefined) {
        const calc = Number(values.quantity) * Number(values.unitPrice);
        if (!Number.isNaN(calc)) payload["totalAmount"] = calc;
      }

      const res = await doFetch(`/api/v1/transactions/${transaction.transactionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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
          return `更新失败: ${res.status} ${res.statusText}`;
        })();
        throw new Error(msg);
      }

      toast.success("交易已更新");
      onOpenChange(false);
      onUpdated?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "更新交易失败";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>编辑交易</DialogTitle>
          <DialogDescription>修改交易信息，ID 不可编辑。</DialogDescription>
        </DialogHeader>
        {/* 只展示只读的交易ID */}
        {transaction?.transactionId ? (
          <div className="text-muted-foreground -mt-2 mb-2 text-xs">交易ID：{transaction.transactionId}</div>
        ) : null}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>客户</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择客户" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.customerId} value={c.customerId}>
                          <span className="block break-words whitespace-normal">
                            {c.lastName}
                            {c.firstName ? c.firstName : ""}-{c.phone}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>产品</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择产品" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.productId} value={p.productId}>
                          <span className="block break-words whitespace-normal">{p.productName}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="transactionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>交易类型</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择交易类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TransactionType.PURCHASE}>申购（purchase）</SelectItem>
                      <SelectItem value={TransactionType.REDEEM}>赎回（redeem）</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>支付方式</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择支付方式" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={PaymentMethod.BANK_TRANSFER}>银行转账（bank_transfer）</SelectItem>
                      <SelectItem value={PaymentMethod.CARD}>银行卡/信用卡（card）</SelectItem>
                      <SelectItem value={PaymentMethod.OTHER}>其他（other）</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>数量</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" min={0} placeholder="例如：10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unitPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>单价</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min={0} placeholder="例如：100.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>总金额（可选，留空则按数量×单价）</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min={0} placeholder="自动计算" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transactionStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>交易状态（可选）</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择交易状态" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TransactionStatus.PENDING}>待处理（pending）</SelectItem>
                      <SelectItem value={TransactionStatus.CONFIRMED}>已确认（confirmed）</SelectItem>
                      <SelectItem value={TransactionStatus.COMPLETED}>已完成（completed）</SelectItem>
                      <SelectItem value={TransactionStatus.CANCELLED}>已取消（cancelled）</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expectedMaturityDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>预期到期日期（可选）</FormLabel>
                  <FormControl>
                    <Input type="date" placeholder="YYYY-MM-DD" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actualReturnRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>实际收益率（可选）</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="例如：5.25" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="completedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>完成时间（可选）</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" placeholder="YYYY-MM-DD HH:mm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>备注（可选）</FormLabel>
                  <FormControl>
                    <Textarea placeholder="补充说明，如渠道、特殊条款等" className="min-h-24" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-2 md:col-span-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "保存中..." : "保存修改"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
