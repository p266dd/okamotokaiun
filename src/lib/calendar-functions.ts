import { addDays, subDays, startOfDay, eachDayOfInterval } from "date-fns";

import { TStaffWithSchedule } from "@/action/staff";

export type TDepartment = "甲板部" | "機関部" | "司厨部";
export type TSortedStaff =
  | TStaffWithSchedule
  | { type: "Department"; name: TDepartment }
  | { type: "Role"; name: string };

// Sorting order.
const DECK_ORDER = ["船長", "一等航海士", "二等航海士", "三等航海士", "甲板部員"];
const ENGINE_ORDER = ["機関長", "二等機関士", "三等機関士", "機関部員"];
const KITCHEN_ORDER = ["一等機関士"];
const DEPARTMENT_ORDER = ["甲板部", "機関部", "司厨部"];
const ROLE_ORDER: Record<TDepartment, string[]> = {
  甲板部: DECK_ORDER,
  機関部: ENGINE_ORDER,
  司厨部: KITCHEN_ORDER,
};

// Sort Function
export function sortStaff(
  staffData: TStaffWithSchedule[],
  shipId?: string
): TSortedStaff[] {
  const sortedStaff: TSortedStaff[] = [];

  // Sort by Depatment and Role.
  for (const department of DEPARTMENT_ORDER) {
    const staffInDept = staffData.filter(
      (s) =>
        s.department === department && (shipId !== undefined ? s.shipId === shipId : true)
    );

    if (staffInDept.length === 0) continue;

    sortedStaff.push({ type: "Department", name: department as TDepartment });

    const roleOrder = ROLE_ORDER[department as TDepartment];

    for (const role of roleOrder) {
      const staffInRole = staffInDept.filter((s) => s.role === role);
      if (staffInRole.length === 0) continue;

      sortedStaff.push({ type: "Role", name: role });
      sortedStaff.push(...staffInRole);
    }
  }

  return sortedStaff;
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
  const startDate = subDays(endDate, 15 - 1);

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
  const endDate = addDays(startDate, 15 - 1);

  const newDays = eachDayOfInterval({ start: startDate, end: endDate });
  setDisplayedDays((prevDays) => [...prevDays, ...newDays]);
  setIsLoadingNext(false);
}
