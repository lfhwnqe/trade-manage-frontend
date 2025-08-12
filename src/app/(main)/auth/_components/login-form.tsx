"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { setAuthTokens } from "@/lib/auth";
import type { AuthTokens } from "@/types/auth";

const FormSchema = z.object({
  username: z.string().min(1, { message: "Username is required." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  remember: z.boolean().optional(),
});

export function LoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("登录成功！");

        // 后端使用了拦截器，实际数据在 result.data 中
        const authData = result.data as AuthTokens;

        if (authData && authData.access_token && authData.user) {
          setAuthTokens(authData);

          // 检查是否有登录后重定向的页面
          const redirectPath = localStorage.getItem("redirectAfterLogin");
          if (redirectPath) {
            localStorage.removeItem("redirectAfterLogin");
            router.push(redirectPath);
          } else {
            router.push("/dashboard");
          }
        } else {
          toast.error("登录响应格式错误，请联系管理员。");
        }
      } else {
        // 使用后端返回的错误信息（兼容 message 为对象或字符串的情况）
        const errorMessage = (() => {
          const msg = result?.message;
          if (typeof msg === "string" && msg.trim()) return msg;
          if (msg && typeof msg === "object") {
            if (typeof msg.message === "string" && msg.message.trim()) return msg.message;
            if (typeof msg.error === "string" && msg.error.trim()) return msg.error;
          }
          if (typeof result?.error === "string" && result.error.trim()) return result.error;
          // 根据常见 401 返回给出更友好的提示
          if (response.status === 401) return "用户名或密码错误";
          return "登录失败，请稍后重试。";
        })();
        toast.error(errorMessage as string);
      }
    } catch (error) {
      console.error("Login request failed:", error);
      toast.error("网络错误，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <fieldset disabled={isSubmitting} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input id="username" type="text" placeholder="your_username" autoComplete="username" {...field} />
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="remember"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center">
                <FormControl>
                  <Checkbox
                    id="login-remember"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="size-4"
                  />
                </FormControl>
                <FormLabel htmlFor="login-remember" className="text-muted-foreground ml-1 text-sm font-medium">
                  Remember me for 30 days
                </FormLabel>
              </FormItem>
            )}
          />
          <Button className="w-full" type="submit">
            {isSubmitting ? "登录中..." : "Login"}
          </Button>
        </fieldset>
      </form>
    </Form>
  );
}
