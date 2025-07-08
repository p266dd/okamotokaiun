"use server";

import { z } from "zod/v4";
import prisma from "@/lib/prisma";
import { compareSync } from "bcryptjs";
import { createSession } from "@/lib/session";

import { User } from "@/lib/validation";

// Type
export interface LoginState {
  error?: string | null;
  success?: boolean | null;
}

export const LoginAction = async function (
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  // Get data.
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  if (data.email === null || data.password === null) {
    return { error: "資格情報が無効です。" };
  }

  // Create schema.
  const loginSchema = z.object({
    email: z.email({ message: "メールアドレスが無効です。" }),
    password: z.string().min(1, { message: "パスワードは空にできません。" }),
  });

  // Validate and handle error.
  const validateSchema = loginSchema.safeParse(data);
  if (!validateSchema.success) {
    return { error: "資格情報が無効です。" };
  }

  // Safe data.
  const { email, password } = validateSchema.data;

  try {
    // Find user by its email.
    const result = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!result) {
      return { error: "ユーザーが見つかりません。" };
    }

    const user = result as User;

    // Compare password.
    const passwordsMatch = compareSync(password, user.password);
    if (!passwordsMatch) {
      return { error: "メールアドレスまたはパスワードが間違っています。" };
    }

    // Create session.
    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
    });

    return { success: true };
  } catch (error) {
    console.error("Login error: ", error);
    return { error: "ログイン中に予期しないエラーが発生しました。" };
  }
};
