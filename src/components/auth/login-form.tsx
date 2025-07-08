"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { LoadingIndicator } from "@/components/loading-indicator";
import { LoginAction } from "@/action/login";

import CompanyLogo from "@/assets/logo-color.png";

// Shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader, Lock } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

export default function LoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(LoginAction, {
    error: null,
  });

  useEffect(() => {
    if (state && state.error !== null && typeof state.error === "string") {
      toast.error(state.error);
      return;
    }
    if (state && "successs" in state) {
      router.push("/");
    }
  }, [state]);

  return (
    <>
      <form action={formAction} className="p-6 md:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center text-center">
            <Image
              priority
              src={CompanyLogo}
              alt="Okamoto Kaiun Logo"
              className="max-w-40 mt-4 mb-8 sm:hidden"
            />
            <h1 className="text-2xl font-bold">ようこそ!</h1>
            <p className="text-muted-foreground text-balance"></p>
          </div>
          <div className="grid gap-3">
            <Label htmlFor="email">メール</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder=""
              required
            />
          </div>
          <div className="grid gap-3">
            <div className="flex items-center">
              <Label htmlFor="password">パスワード</Label>
              <Link
                href="/login?action=recover"
                className="ml-auto text-sm underline-offset-2 hover:underline text-slate-400"
              >
                <span className="flex items-center gap-2">
                  <LoadingIndicator />
                  パスワードを忘れた方はこちら
                </span>
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder=""
              required
            />
          </div>
          <Button
            variant={isPending ? "outline" : "default"}
            type="submit"
            className="w-full"
          >
            ログイン {isPending && <Loader className="animate-spin" />}
          </Button>
          <Link className="text-primary" href="/login?action=embark" prefetch={true}>
            <span className="flex items-center gap-2">
              <LoadingIndicator />
              乗降船登録はこちら
            </span>
          </Link>
          {state?.error && (
            <Alert variant="destructive" className="bg-red-50">
              <Lock />
              <AlertTitle>{state.error}</AlertTitle>
            </Alert>
          )}
        </div>
      </form>
    </>
  );
}
