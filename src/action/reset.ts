"use server";

import { z } from "zod/v4";
import { hashSync } from "bcryptjs";
import prisma from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { User } from "@/lib/validation";

// Type
export interface ResetState {
  error?: string | null;
  success?: boolean | null;
  message?: string | null;
}

export const ResetAction = async function (
  _prevState: ResetState,
  formData: FormData
): Promise<ResetState> {
  // Get data.
  const data = {
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    token: formData.get("token"),
  };

  // Vallidate data.
  const resetSchema = z.object({
    password: z
      .string()
      .min(1, { message: "パスワードは空にできません。" })
      .min(6, { message: "パスワードは6文字以上である必要があります。" }),
    confirmPassword: z
      .string()
      .min(1, { message: "パスワードは空にできません。" })
      .min(6, { message: "パスワードは6文字以上である必要があります。" }),
    token: z.string(),
  });
  const validateSchema = resetSchema.safeParse(data);
  if (validateSchema.error) {
    console.log(validateSchema.error);
    return { error: "入力が無効です。" };
  }

  // Check if both passwords match.
  const { password, confirmPassword } = validateSchema.data;
  if (password !== confirmPassword) {
    return { error: "パスワードが一致しません。" };
  }

  // Hash password.
  const hashPassword = hashSync(password, 10);

  try {
    // Update user.
    const updateUser = await prisma.user.update({
      where: { token: validateSchema.data.token },
      data: { password: hashPassword, token: null },
    });

    if (!updateUser) {
      return { error: "ユーザー情報を更新できませんでした。" };
    }

    const user = updateUser as User;

    // Create session.
    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
    });

    // Redirect user to top page.
    return { success: true, message: "パスワードが正常にリセットされました。" };
  } catch (error) {
    console.error("Reset error: ", error);
    return { error: "パスワードのリセット中に予期しないエラーが発生しました。" };
  }
};
