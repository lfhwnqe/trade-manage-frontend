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
import { useFetchWithAuth } from "@/utils/fetch-with-auth";

import { CustomerStatus, IdType, RiskLevel } from "./schema";

const phoneRegex = /^(\+86\s?)?1[3-9]\d{9}$/;

const createCustomerSchema = z.object({
  email: z.string({ required_error: "邮箱地址不能为空" }).email({ message: "请输入有效的邮箱地址" }),
  username: z
    .string()
    .min(3, "登录账号至少需要3个字符")
    .max(30, "登录账号不能超过30个字符")
    .optional()
    .or(z.literal("")),
  password: z.string().min(8, "登录密码至少需要8个字符").optional().or(z.literal("")),
  phone: z.string({ required_error: "手机号码不能为空" }).regex(phoneRegex, "请输入有效的中国大陆手机号码"),
  firstName: z.string({ required_error: "名不能为空" }).min(1, "名至少需要1个字符").max(50, "名不能超过50个字符"),
  lastName: z.string({ required_error: "姓不能为空" }).min(1, "姓至少需要1个字符").max(50, "姓不能超过50个字符"),
  idType: z.enum([IdType.ID_CARD, IdType.PASSPORT, IdType.OTHER], { required_error: "身份证件类型不能为空" }),
  idNumber: z
    .string({ required_error: "身份证件号码不能为空" })
    .min(6, "身份证件号码至少需要6个字符")
    .max(30, "身份证件号码不能超过30个字符"),
  dateOfBirth: z
    .string({ required_error: "出生日期不能为空" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "请输入有效的日期格式 (YYYY-MM-DD)"),
  address: z
    .string({ required_error: "联系地址不能为空" })
    .min(5, "联系地址至少需要5个字符")
    .max(200, "联系地址不能超过200个字符"),
  riskLevel: z.enum([RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH], { required_error: "风险承受等级不能为空" }),
  status: z.enum([CustomerStatus.ACTIVE, CustomerStatus.INACTIVE, CustomerStatus.SUSPENDED]).optional(),
  remarks: z.string().max(1000, "备注信息不能超过1000个字符").optional().or(z.literal("")),
  wechatId: z.string().min(1, "微信号至少需要1个字符").max(50, "微信号不能超过50个字符").optional().or(z.literal("")),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export function CreateCustomerDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}) {
  const fetchWithAuth = useFetchWithAuth();
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      phone: "",
      firstName: "",
      lastName: "",
      idType: IdType.ID_CARD,
      idNumber: "",
      dateOfBirth: "",
      address: "",
      riskLevel: RiskLevel.MEDIUM,
      status: CustomerStatus.ACTIVE,
      remarks: "",
      wechatId: "",
    },
  });

  const onSubmit = async (values: CreateCustomerInput) => {
    setSubmitting(true);
    try {
      // 清理可选的空字符串字段为 undefined
      const payload: Record<string, unknown> = { ...values };
      if (!payload.username) delete payload.username;
      if (!payload.password) delete payload.password;
      if (!payload.remarks) delete payload.remarks;
      if (!payload.wechatId) delete payload.wechatId;

      const res = await fetchWithAuth("/api/v1/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}) as any);
        const msg = err?.message?.message || err?.message || `创建失败: ${res.status} ${res.statusText}`;
        throw new Error(msg);
      }
      toast.success("客户创建成功");
      onOpenChange(false);
      form.reset();
      onCreated?.();
    } catch (e: any) {
      toast.error(e?.message || "创建客户失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>新增客户</DialogTitle>
          <DialogDescription>填写客户基础信息，提交后将创建新客户。</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="customer@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>手机号码</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：13800138000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名</FormLabel>
                  <FormControl>
                    <Input placeholder="小明" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>姓</FormLabel>
                  <FormControl>
                    <Input placeholder="张" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="idType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>证件类型</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择证件类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={IdType.ID_CARD}>身份证</SelectItem>
                      <SelectItem value={IdType.PASSPORT}>护照</SelectItem>
                      <SelectItem value={IdType.OTHER}>其他</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="idNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>证件号码</FormLabel>
                  <FormControl>
                    <Input placeholder="110101199001011234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>出生日期</FormLabel>
                  <FormControl>
                    <Input type="date" placeholder="YYYY-MM-DD" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>联系地址</FormLabel>
                  <FormControl>
                    <Input placeholder="北京市朝阳区某某街道123号" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="riskLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>风险等级</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择风险等级" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={RiskLevel.LOW}>低</SelectItem>
                      <SelectItem value={RiskLevel.MEDIUM}>中</SelectItem>
                      <SelectItem value={RiskLevel.HIGH}>高</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>客户状态</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择客户状态" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={CustomerStatus.ACTIVE}>活跃</SelectItem>
                      <SelectItem value={CustomerStatus.INACTIVE}>非活跃</SelectItem>
                      <SelectItem value={CustomerStatus.SUSPENDED}>暂停</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>登录账号（可选）</FormLabel>
                  <FormControl>
                    <Input placeholder="customer01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>登录密码（可选）</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="至少8位" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wechatId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>微信号（可选）</FormLabel>
                  <FormControl>
                    <Input placeholder="wechat_user123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>备注（可选）</FormLabel>
                  <FormControl>
                    <Textarea placeholder="重要客户，需要特别关注" className="min-h-24" {...field} />
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
                {submitting ? "提交中..." : "创建客户"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
