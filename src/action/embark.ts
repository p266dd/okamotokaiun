"use server";

import { z } from "zod/v4";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Type
import { Prisma } from "@/lib/prisma/generate";
export type StaffWithShip = Prisma.StaffGetPayload<{
  include: { ship: true };
}>;

// Actions
export interface EmbarkState {
  error: string | null;
  success?: string | null;
  staff?: Partial<StaffWithShip> | null;
}

export const EmbarkAction = async function (
  _prevState: EmbarkState,
  formData: FormData
): Promise<EmbarkState> {
  // Helper functions

  async function embarkStaff(
    staffId: string,
    shipToEmbarkId: string
  ): Promise<StaffWithShip | null> {
    console.log(staffId, shipToEmbarkId);
    try {
      // const alreadyEmbarked = await prisma.schedule.findFirst({
      //   where: {
      //     staffId: staffId,
      //     shipId: shipToEmbarkId,
      //   },
      // });

      // if (alreadyEmbarked?.embark !== null && alreadyEmbarked?.desembark !== null) {
      // const timeNow = Date.now();
      // if (timeNow >= alreadyEmbarked?.embark.getMilliseconds && timeNow <= alreadyEmbarked?.desembark) {
      //   console.log("Cannot complete, already embarked and disembarked");
      // }
      // }

      const result = await prisma.staff.update({
        data: {
          status: true,
          shipId: shipToEmbarkId,
          schedule: {
            create: {
              embark: new Date(),
              ship: { connect: { id: shipToEmbarkId } },
            },
          },
        },
        where: { id: staffId },
        include: { ship: true },
      });
      if (!result) {
        return null;
      }

      revalidatePath("/login");
      return result;
    } catch (error) {
      console.error("Embark error: ", error);
      return null;
    }
  }

  async function disembarkStaff(
    staffId: string
  ): Promise<StaffWithShip | { error: string }> {
    const scheduleResult = await prisma.schedule.findMany({
      where: {
        staffId: staffId,
        desembark: null,
      },
      orderBy: { embark: "desc" },
      take: 1,
    });

    if (!scheduleResult || scheduleResult.length === 0) {
      console.error("Active schedule not found for disembarkation: ", staffId);
      return {
        error:
          "有効なスケジュールが見つかりません。スタッフは既に下船しているか、データに不整合がある可能性があります。",
      };
    }
    const activeSchedule = scheduleResult[0];

    const result = await prisma.staff.update({
      data: {
        status: false,
        schedule: {
          update: {
            where: { id: activeSchedule.id },
            data: { desembark: new Date() },
          },
        },
      },
      where: { id: staffId },
      include: { ship: true },
    });

    if (!result) {
      console.error("Disembark error.");
      return {
        error:
          "有効なスケジュールが見つかりません。スタッフは既に下船しているか、データに不整合がある可能性があります。",
      };
    }

    const data = result as StaffWithShip;
    revalidatePath("/login");

    return data;
  }

  function getCurrentStaffUIState(
    staffDb: StaffWithShip,
    inputCode: string
  ): EmbarkState["staff"] {
    return {
      id: staffDb.id,
      firstName: staffDb.firstName,
      lastName: staffDb.lastName,
      ship: {
        id: staffDb.ship?.id || "",
        name: staffDb.ship?.name || "",
      },
      department: staffDb.department,
      role: staffDb.role,
      code: inputCode,
      status: staffDb.status,
    };
  }

  // Get data.
  const data = {
    code: formData.get("code"),
    ship: formData.get("ship"),
    status:
      formData.get("status") === "true"
        ? true
        : formData.get("status") === "false"
        ? false
        : null,
  };

  // Data schema.
  const dataSchema = z.object({
    code: z.string().length(6, { message: "Wrong staff code." }),
    status: z.boolean().nullable(),
    ship: z.string().min(1, "Please select a ship.").nullable(),
  });

  // Validate data.
  const validateSchema = dataSchema.safeParse(data);
  if (validateSchema?.error) {
    return { error: "アカウントが見つかりません。" };
  }

  const { code, status: newDesiredStatus, ship: shipIdFromForm } = validateSchema.data;

  // Fetch staff by its code number.
  const staffResult = await prisma.staff.findUnique({
    where: { code: code },
    include: { ship: true },
  });

  console.log("staff", staffResult);

  const lastSchedule = (
    await prisma.schedule.findMany({
      where: {
        staffId: staffResult?.id,
      },
      orderBy: {
        embark: "desc",
      },
      take: 1,
    })
  )[0];

  if (!staffResult) {
    return { error: "Staff not found." };
  }

  const staff = staffResult as StaffWithShip;

  // Initial step: Only code submitted, return current staff status
  if (newDesiredStatus === null) {
    return {
      error: null,
      staff: getCurrentStaffUIState(staff, code),
    };
  }

  let operationResult: StaffWithShip | null = null;

  if (newDesiredStatus === true) {
    const lastScheduleDesembark = lastSchedule?.desembark;

    if (lastScheduleDesembark !== null) {
      if (lastScheduleDesembark > new Date()) {
        return {
          error:
            "あなたの乗船期間は管理者によって登録されています。管理者へご確認ください。",
          staff: getCurrentStaffUIState(staff, code),
        };
      }
    }

    // Attempting to embark
    if (!shipIdFromForm) {
      return {
        error: "乗船するには船舶の選択が必要です。",
        staff: getCurrentStaffUIState(staff, code),
      };
    }
    if (staff.status === true) {
      return {
        error: "スタッフは既に他の船に乗船中です。",
        staff: getCurrentStaffUIState(staff, code),
      };
    }
    operationResult = await embarkStaff(staff.id || "", shipIdFromForm);
  } else {
    // Attempting to disembark (newDesiredStatus === false)
    if (staff.status === false) {
      return {
        error: "スタッフは既に下船しています。",
        staff: getCurrentStaffUIState(staff, code),
      };
    }
    const result = await disembarkStaff(staff.id || "");
    if ("error" in result) {
      operationResult = null;
    } else {
      operationResult = result;
    }
  }

  if (!operationResult) {
    // Null means a Prisma/DB error occurred in helper
    return {
      error: "内部データベースエラーのため、スタッフ情報を更新できませんでした。",
      staff: getCurrentStaffUIState(staff, code),
    };
  }

  const updatedStaff = operationResult as StaffWithShip;

  // Refresh cache.
  revalidatePath("/login");

  // Return staff object and success message.
  return {
    error: null,
    success: "ありがとうございます！",
    staff: getCurrentStaffUIState(updatedStaff, code),
  };
};
