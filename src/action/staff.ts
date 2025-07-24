"use server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/prisma/generate";
import { revalidatePath } from "next/cache";

export async function fetchStaff() {
  try {
    const staff = await prisma.staff.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        department: true,
        salary: true,
        code: true,
        ship: true,
      },
      orderBy: {
        lastName: "asc",
      },
    });

    if (!staff || staff.length === 0) {
      return { error: "アカウントが見つかりません。" };
    }

    return { error: null, data: staff };
  } catch (error) {
    console.error("Error fetching staff data:", error);
    return { error: "アカウント情報が取得できません。" };
  }
}

export async function deleteStaff(id: string) {
  try {
    const result = await prisma.staff.delete({
      where: {
        id: id,
      },
      select: {
        id: true,
      },
    });

    if (!result) {
      return { error: "削除できませんでした。" };
    }

    revalidatePath("/staff");
    revalidatePath("/");
    return { error: null, data: result };
  } catch (error) {
    console.error("Error deleting staff:", error);
    return { error: "削除できませんでした。" };
  }
}

export async function updateStaff(
  id: string,
  values: {
    firstName: string;
    lastName: string;
    ship?: string | undefined;
    phone: string;
    role: string;
    department: string;
    salary: number;
    code: string;
  }
) {
  try {
    const result = await prisma.staff.update({
      data: {
        ...values,
        ship: {
          connect: {
            id: values.ship,
          },
        },
      },
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!result) {
      return { error: "更新できませんでした。" };
    }

    revalidatePath("/staff");
    revalidatePath("/");
    return { error: null, data: result };
  } catch (error) {
    console.error("Error updating staff:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return { error: "既に同じ社員番号が使用されています。" };
      }
    }
    return { error: "更新できませんでした。" };
  }
}

export async function createStaff(values: {
  firstName: string;
  lastName: string;
  ship?: string | undefined;
  phone: string;
  role: string;
  department: string;
  salary: number;
  code: string;
}) {
  try {
    const result = await prisma.staff.create({
      data: {
        ...values,
        ship: {
          connect: {
            id: values.ship,
          },
        },
      },
      select: { id: true },
    });

    if (!result) {
      return { error: "既に同じ社員番号が使用されています。" };
    }

    revalidatePath("/staff");
    revalidatePath("/");
    return { error: null, data: result };
  } catch (error) {
    console.error("Error creating staff:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return { error: "既に同じ社員番号が使用されています。" };
      }
    }
    return { error: "既に同じ社員番号が使用されています。" };
  }
}
