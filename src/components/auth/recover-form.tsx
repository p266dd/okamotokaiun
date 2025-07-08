"use client";

import Link from "next/link";
import { useActionState } from "react";

import { RecoverAction } from "@/action/recover";

// Shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { ArrowLeftIcon, Info, LoaderCircleIcon, Lock } from "lucide-react";

export default function RecoverForm() {
  const [state, formAction, isPending] = useActionState(RecoverAction, {
    error: null,
    success: null,
    message: null,
  });

  return (
    <>
      <form action={formAction} className="p-6 md:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold">新しいパスワードを設定する</h1>
            <p className="text-muted-foreground text-balance"></p>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="email">アカウントのメールアドレスを入力してください。</Label>
            <Input id="email" name="email" type="email" placeholder="" required />
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant={isPending ? "outline" : "default"}
              type="submit"
              className="w-full"
            >
              {isPending ? <LoaderCircleIcon className="animate-spin" /> : null}
              再設定リンクを送信
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/auth/login" className="flex items-center gap-2">
                <ArrowLeftIcon /> ログイン画面へ戻る
              </Link>
            </Button>
          </div>

          {state && state.success && (
            <>
              <Alert className="bg-blue-50">
                <Info />
                <AlertTitle>{state.message}</AlertTitle>
              </Alert>
            </>
          )}
          {state && state.error && (
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
