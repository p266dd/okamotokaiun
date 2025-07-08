"use client";

import { string } from "zod/v4-mini";
import { useActionState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { ResetAction } from "@/action/reset";

// Shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Info, Lock } from "lucide-react";

export default function ResetForm() {
  const [state, formAction, isPending] = useActionState(ResetAction, {
    error: null,
    success: null,
    message: null,
  });
  const searchParams = useSearchParams();
  const token = string().parse(searchParams.get("token"));
  const router = useRouter();

  return (
    <>
      <form action={formAction} className="p-6 md:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold">新しいパスワード！</h1>
            <p className="text-muted-foreground text-balance"></p>
          </div>
          <div className="grid gap-3">
            <div className="flex items-center">
              <Label htmlFor="password">パスワード</Label>
            </div>
            <input type="hidden" name="token" value={token} />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder=""
              disabled={Boolean(state?.success)}
              required
            />
          </div>

          <div className="grid gap-3">
            <div className="flex items-center">
              <Label htmlFor="confirmPassword">パスワードを認証する</Label>
            </div>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder=""
              disabled={Boolean(state?.success)}
              required
            />
          </div>
          {state?.success ? (
            <Button
              variant="secondary"
              type="button"
              onClick={() => router.push("/")}
              className="w-full"
            >
              ダッシュボードへ移動
            </Button>
          ) : (
            <Button
              variant={isPending ? "outline" : "default"}
              type="submit"
              className="w-full"
            >
              新しいパスワードを保存
            </Button>
          )}

          {state?.success && (
            <Alert className="bg-blue-50">
              <Info />
              <AlertTitle>{state.message}</AlertTitle>
            </Alert>
          )}
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
