import { addDays, subDays, eachDayOfInterval } from "date-fns";
import { Prisma, Ship } from "@/lib/prisma/generate";

export type TSchedule = Prisma.ScheduleGetPayload<{
  include: {
    staff: true;
    ship: true;
  };
}>;
export type TDepartment = "甲板部" | "機関部" | "司厨部";
export type TSortedSchedule =
  | TSchedule
  | { type: "Ship"; name: string }
  | { type: "Department"; name: string }
  | { type: "Role"; name: string };

const DEPARTMENT_ORDER = ["甲板部", "機関部", "司厨部"];
const DECK_ORDER = ["船長", "一等航海士", "二等航海士", "三等航海士", "甲板部員"];
const ENGINE_ORDER = ["機関長", "二等機関士", "三等機関士", "機関部員"];
const KITCHEN_ORDER = ["一等機関士"];

const ROLE_ORDER: Record<TDepartment, string[]> = {
  甲板部: DECK_ORDER,
  機関部: ENGINE_ORDER,
  司厨部: KITCHEN_ORDER,
};
export function sortSchedules(
  ships: Ship[],
  scheduleList: TSchedule[]
): TSortedSchedule[] {
  const sorted: TSortedSchedule[] = [];

  for (const ship of ships) {
    const shipId = ship.id;

    // Schedule assigned to the ship
    const assignedSchedule = scheduleList.filter(
      (schedule) => schedule.shipId === shipId
    );

    // Push Ship Title
    sorted.push({ type: "Ship", name: ship.name });

    // Skip if no schedules for this ship
    if (assignedSchedule.length === 0) continue;

    // Group by Department
    for (const dept of DEPARTMENT_ORDER) {
      const staffInDept = assignedSchedule.filter(
        (schedule) => schedule.staff.department === dept
      );

      // Push Department Title
      sorted.push({ type: "Department", name: dept });

      if (staffInDept.length === 0) continue;

      // Group by Role within Department
      const roleOrder = ROLE_ORDER[dept as TDepartment];

      for (const role of roleOrder) {
        const staffInRole = staffInDept.filter(
          (schedule) => schedule.staff.role === role
        );

        // Push Role Title
        sorted.push({ type: "Role", name: role });

        if (staffInRole.length === 0) continue;

        // Push all Schedules for this role
        sorted.push(...staffInRole);
      }
    }
  }

  return sorted;
}

// Load previous days.
export function loadPreviousDays(
  displayedDays: Date[],
  setDisplayedDays: React.Dispatch<React.SetStateAction<Date[]>>,
  isLoadingPrev: boolean,
  setIsLoadingPrev: React.Dispatch<React.SetStateAction<boolean>>
) {
  // Wait previous load to complete before loading more days.
  if (isLoadingPrev) return;
  setIsLoadingPrev(true);

  const firstDay = displayedDays[0];
  const endDate = subDays(firstDay, 1);
  const startDate = subDays(endDate, 100 - 1);

  const newDays = eachDayOfInterval({ start: startDate, end: endDate });
  setDisplayedDays((prevDays) => [...newDays, ...prevDays]);
  setIsLoadingPrev(false);
}

export function loadNextDays(
  displayedDays: Date[],
  setDisplayedDays: React.Dispatch<React.SetStateAction<Date[]>>,
  isLoadingNext: boolean,
  setIsLoadingNext: React.Dispatch<React.SetStateAction<boolean>>
) {
  // Wait previous load to complete before loading more days.
  if (isLoadingNext || displayedDays.length === 0) return;
  setIsLoadingNext(true);

  const lastDay = displayedDays[displayedDays.length - 1];
  const startDate = addDays(lastDay, 1);
  const endDate = addDays(startDate, 100 - 1);

  const newDays = eachDayOfInterval({ start: startDate, end: endDate });
  setDisplayedDays((prevDays) => [...prevDays, ...newDays]);
  setIsLoadingNext(false);
}
