"use server";

import prisma from "@/lib/prisma";

export async function getCalendarContent({
  firstDay,
  lastDay,
}: {
  firstDay: Date;
  lastDay: Date;
}) {
  try {
    // Fetch schedule based on shipId.
    const scheduleList = await prisma.schedule.findMany({
      where: {
        OR: [
          {
            embark: {
              gte: new Date(firstDay),
              lte: new Date(lastDay),
            },
          },
          {
            desembark: {
              gte: new Date(firstDay),
              lte: new Date(lastDay),
            },
          },
        ],
      },
      orderBy: {
        staff: {
          lastName: "asc",
        },
      },
      include: {
        staff: true,
        ship: true,
      },
    });

    // console.log(scheduleList);

    if (scheduleList.length === 0) {
      console.warn("No schedules found.");
      return [];
    }

    return scheduleList;
  } catch (error) {
    console.error("Error fetching schedule data: ", error);
    return [];
  }
}
