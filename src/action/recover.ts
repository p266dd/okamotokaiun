"use server";

import { z } from "zod/v4";
import prisma from "@/lib/prisma";
import { SignJWT } from "jose";
import { resetPassword } from "@/lib/emails/reset-password";

import { User } from "@/lib/validation";
import { revalidatePath } from "next/cache";

// Type
export interface RecoverState {
  error?: string | null;
  success?: boolean | null;
  message?: string | null;
}

export const RecoverAction = async function (
  _prevState: RecoverState,
  formData: FormData
): Promise<RecoverState> {
  "use server";

  // Get data.
  const data = {
    email: formData.get("email"),
  };

  // Create schema.
  const recoverSchema = z.object({
    email: z.email({ message: "メールアドレスが無効です。" }),
  });

  // Validate and handle error.
  const validateSchema = recoverSchema.safeParse(data);
  if (!validateSchema.success) {
    return { error: "メールアドレスが無効です。" };
  }

  // Safe data.
  const { email } = validateSchema.data;
  revalidatePath;
  try {
    // Find user by its email.
    const result = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!result) {
      return { error: "ユーザーが見つかりません。" };
    }

    const user = result as User;

    // Generate token.
    const secret = new TextEncoder().encode(process.env.SECRET);
    const token = await new SignJWT({ id: user.id })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(new Date(Date.now() + 3 * 60 * 60 * 1000))
      .sign(secret);

    // Insert token into user's data.
    const updateUser = await prisma.user.update({
      data: { token },
      where: { id: user.id },
    });

    if (!updateUser) {
      return { error: "ユーザー情報を更新できませんでした。" };
    }

    // Send token to email.
    await resetPassword({
      token: token,
      name: user.name,
      email: user.email,
    });

    // Refresh cache.
    revalidatePath("/login");

    // Return message to be displayed.
    return {
      success: true,
      message: "パスワードをリセットするためのリンクを送信しました。",
    };
  } catch (error) {
    console.error("Recover error: ", error);
    return { error: "回復中に予期しないエラーが発生しました。" };
  }
};
