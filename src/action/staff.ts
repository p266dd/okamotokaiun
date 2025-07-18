"use server";
import prisma from "@/lib/prisma";
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
      return { error: "No staff found." };
    }

    return { error: null, data: staff };
  } catch (error) {
    console.error("Error fetching staff data:", error);
    return { error: "Error fetching staff data" };
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
      return { error: "Error deleting staff." };
    }

    revalidatePath("/staff");
    revalidatePath("/");
    return { error: null, data: result };
  } catch (error) {
    console.error("Error deleting staff:", error);
    return { error: "Error deleting staff." };
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
      return { error: "Error updating staff." };
    }

    revalidatePath("/staff");
    revalidatePath("/");
    return { error: null, data: result };
  } catch (error) {
    console.error("Error updating staff:", error);
    return { error: "Error updating staff." };
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
      return { error: "Error creating staff." };
    }

    revalidatePath("/staff");
    revalidatePath("/");
    return { error: null, data: result };
  } catch (error) {
    console.error("Error updating staff:", error);
    return { error: "Error updating staff." };
  }
}
