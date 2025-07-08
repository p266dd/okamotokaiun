"use server";
import prisma from "@/lib/prisma";

// Type
import { Prisma } from "@/lib/prisma/generate";
export type TStaffWithSchedule = Prisma.StaffGetPayload<{
  include: {
    schedule: {
      include: {
        staff: {
          omit: {
            status: true;
            code: true;
          };
        };
      };
    };
  };
}>;

export async function fetchStaffWithSchedule(start: Date, end: Date) {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: {
        lastName: "asc",
      },
      include: {
        schedule: {
          include: {
            staff: {
              omit: {
                status: true,
                code: true,
              },
            },
          },
          where: {
            OR: [
              {
                embark: {
                  gte: new Date(start),
                  lte: new Date(end),
                },
              },
              {
                desembark: {
                  gte: new Date(start),
                  lte: new Date(end),
                },
              },
            ],
          },
        },
        ship: true,
      },
    });

    if (!staff) {
      console.error("Error fetching staff data.");
      return null;
    }

    return staff as TStaffWithSchedule[];
  } catch (error) {
    console.error("Error fetching staff data:", error);
    return null;
  }
}
