"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateScheduleData(schedule: {
  shipID?: string;
  embark?: Date | null | undefined;
  desembark?: Date | null | undefined;
  scheduleId: string;
}) {
  try {
    // 1. Fetch the current state of the schedule.
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: schedule.scheduleId },
      select: { shipId: true, staffId: true },
    });

    if (!existingSchedule) {
      const errorMsg = "乗降情報が見つかりません。";
      console.error("Error fetching existing schedule:", errorMsg);
      return { error: errorMsg };
    }

    const currentSchedule = existingSchedule;
    const staffId = currentSchedule.staffId;

    // 2. If new ship id is different, and staffId exists, update staff's shipId for this schedule.
    if (
      staffId &&
      schedule.shipID !== undefined &&
      schedule.shipID !== currentSchedule.shipId
    ) {
      const scheduleUpdateShip = await prisma.schedule.update({
        data: {
          shipId: schedule.shipID,
        },
        where: { id: schedule.scheduleId },
      });

      if (!scheduleUpdateShip) {
        console.error(`Error updating shipId in schedule.`);
        return { error: `更新できませんでした。` };
      }
    }

    // 2.5 Desembark date exists, change staff status to false.
    if (schedule.desembark !== null) {
      await prisma.staff.update({
        data: {
          status: schedule.desembark === null ? true : false,
        },
        where: { id: staffId },
      });
    }

    let updatedScheduleData;
    if (Object.keys(schedule).length > 0) {
      const scheduleUpdateDbResult = await prisma.schedule.update({
        data: {
          embark: schedule.embark || undefined,
          desembark: schedule.desembark || undefined,
          shipId: schedule.shipID,
        },
        where: { id: schedule.scheduleId },
      });

      if (!scheduleUpdateDbResult) {
        const errorMsg = "更新できませんでした。";
        console.error("Error updating schedule data:", errorMsg);
        return { error: errorMsg };
      }
      updatedScheduleData = scheduleUpdateDbResult;
    }

    revalidatePath("/payroll");
    revalidatePath("/");
    return { error: null, data: updatedScheduleData };
  } catch (error: unknown) {
    console.error("Unexpected error in updateScheduleData:", error);
    const errorMessage = "エラーが発生しました。";
    return { error: errorMessage };
  }
}

export async function deleteSchedule(scheduleId: string) {
  try {
    const deletedSchedule = await prisma.schedule.delete({
      where: { id: scheduleId },
    });

    if (!deleteSchedule) {
      const errorMsg = "削除できませんでした。";
      console.error("Error deleting schedule:", errorMsg);
      return { error: errorMsg };
    }

    revalidatePath("/payroll");
    revalidatePath("/");
    return { error: null, data: deletedSchedule };
  } catch (error) {
    console.error("Unexpected error in updateScheduleData:", error);
    const errorMessage = "削除できませんでした。";
    return { error: errorMessage };
  }
}
