"use client";

import useSWR from "swr";
import { useState, useEffect, useMemo } from "react";
import { startOfMonth, endOfMonth, differenceInCalendarDays, max, min } from "date-fns";
import TotalDaysPopover from "@/components/total-days-popover";
import { fetchShips } from "@/action/ships";
import { getScheduleData } from "@/action/schedule";

// Shadcn
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DatePicker from "@/components/date-picker";
import { Label } from "@/components/ui/label";
import { ShipIcon, ArrowUpDownIcon, PrinterIcon } from "lucide-react";

// Types
import { Staff } from "@/lib/prisma/generate";
import { Schedule } from "@/lib/prisma/generate";
import { Button } from "@/components/ui/button";

type Ships = {
  id: string;
  name: string;
};

type PayrollForm = {
  shipID: string;
  start: Date | null;
  finish: Date | null;
};

// Type for the raw data fetched from getScheduleData.
type FetchedScheduleData = {
  staff: Staff[];
  schedules: Schedule[];
};

type StaffPayrollRow = Staff & {
  workedDays: number;
};

type SortKey = "name" | "role" | "workedDays" | "salary";
type SortOrder = "asc" | "desc";
type SortConfig = {
  key: SortKey | null;
  order: SortOrder;
};

// Default date range (e.g., current month)
const initialDefaultStart = startOfMonth(new Date());
const initialDefaultEnd = endOfMonth(new Date());

export default function PayrollPage() {
  // State to hold the processed list of staff with their worked days for the table.
  const [payrollStaffList, setPayrollStaffList] = useState<StaffPayrollRow[]>([]);
  const [payroll, setPayroll] = useState<PayrollForm>({
    shipID: "all", // Default ship ID
    start: initialDefaultStart,
    finish: initialDefaultEnd,
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    order: "asc",
  });

  // Fetch ships.
  const { data: availableShips } = useSWR("fetchShips", fetchShips);

  const sortedPayrollStaffList = useMemo(() => {
    const sortableItems = [...payrollStaffList];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let valA: string | number = "";
        let valB: string | number = "";

        if (sortConfig.key === "name") {
          valA = `${a.firstName} ${a.lastName}`.toLowerCase();
          valB = `${b.firstName} ${b.lastName}`.toLowerCase();
        } else if (sortConfig.key === "role") {
          valA = a.role?.toLowerCase() || "";
          valB = b.role?.toLowerCase() || "";
        } else if (sortConfig.key === "workedDays") {
          valA = a.workedDays;
          valB = b.workedDays;
        } else if (sortConfig.key === "salary") {
          valA = a.salary;
          valB = b.salary;
        }

        if (valA < valB) return sortConfig.order === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.order === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [payrollStaffList, sortConfig]);

  useEffect(() => {
    const fetchAndProcessScheduleData = async () => {
      if (!payroll.start || !payroll.finish || !payroll.shipID) {
        setPayrollStaffList([]); // Clear data if inputs are incomplete.
        return;
      }

      try {
        // Fetches staff and all their schedules for the given ship
        // that potentially overlap with the payroll period.
        const fetchedData: FetchedScheduleData = await getScheduleData(
          payroll.start,
          payroll.finish,
          payroll.shipID === "all" ? undefined : payroll.shipID
        );

        if (!fetchedData || !fetchedData.staff || !fetchedData.schedules) {
          setPayrollStaffList([]);
          return;
        }

        const { staff: allStaffForShip, schedules: allSchedulesForShip } = fetchedData;
        const workedDaysByStaffId: Map<string, number> = new Map();

        allSchedulesForShip.forEach((schedule) => {
          const scheduleStart = new Date(schedule.embark);
          // If desembark is null, staff is currently on board.
          // For calculation, cap at payroll.finish.
          const scheduleEnd = schedule.desembark
            ? new Date(schedule.desembark)
            : payroll.finish!;

          // Determine the effective period of work within the payroll dates
          const effectiveStart = max([scheduleStart, payroll.start!]);
          const effectiveEnd = min([scheduleEnd, payroll.finish!]);

          if (effectiveStart <= effectiveEnd) {
            // differenceInCalendarDays gives the number of full days between two dates.
            // Add 1 to make it inclusive of start and end day.
            const daysWorkedInSegment =
              differenceInCalendarDays(effectiveEnd, effectiveStart) + 1;
            if (daysWorkedInSegment > 0) {
              workedDaysByStaffId.set(
                schedule.staffId,
                (workedDaysByStaffId.get(schedule.staffId) || 0) + daysWorkedInSegment
              );
            }
          }
        });

        const newPayrollStaffList: StaffPayrollRow[] = allStaffForShip
          .map((staffMember) => {
            const workedDays = workedDaysByStaffId.get(staffMember.id) || 0;
            // Only include staff who actually worked during the selected period
            return workedDays > 0 ? { ...staffMember, workedDays } : null;
          })
          .filter(Boolean) as StaffPayrollRow[]; // Filter out nulls

        setPayrollStaffList(newPayrollStaffList);
      } catch (error) {
        console.error("Error fetching or processing schedule data:", error);
        setPayrollStaffList([]); // Clear data on error.
      }
    };

    fetchAndProcessScheduleData();
  }, [payroll.start, payroll.finish, payroll.shipID]); // Refetch when these dependencies change

  const requestSort = (key: SortKey) => {
    let order: SortOrder = "asc";
    if (sortConfig.key === key && sortConfig.order === "asc") {
      order = "desc";
    }
    setSortConfig({ key, order });
  };

  const getSortIndicator = (key: SortKey) =>
    sortConfig.key === key ? (sortConfig.order === "asc" ? " ▲" : " ▼") : "";

  const printPage = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="px-6 sm:px-12 md:px-20 flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14 print:mb-6">
        <div className="flex items-end gap-4 print:hidden">
          <Card>
            <CardContent className="flex flex-col gap-2">
              <div>
                <ShipIcon />
              </div>
              <div>
                <p className="text-lg">
                  {payroll.shipID === "all"
                    ? "全て"
                    : (availableShips &&
                        availableShips.find((s) => s.id === payroll.shipID)?.name) ||
                      "Loading..."}
                </p>
                <p className="text-xs text-gray-400">選択中の船舶</p>
              </div>
            </CardContent>
          </Card>
          <div>
            <Button
              className="cursor-pointer"
              type="button"
              variant="ghost"
              onClick={printPage}
            >
              <PrinterIcon /> 印刷
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="shipSelect">船舶</Label>
            <Select
              value={payroll.shipID}
              onValueChange={(value) => {
                if (value) {
                  setPayroll((prev) => ({ ...prev, shipID: value }));
                }
              }}
            >
              <SelectTrigger id="shipSelect" className="w-[180px]">
                <SelectValue placeholder="船舶" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">全て</SelectItem>
                {availableShips &&
                  availableShips.length > 0 &&
                  availableShips.map((ship) => (
                    <SelectItem key={ship.id} value={ship.id}>
                      {ship.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dateFrom">From</Label>
            <DatePicker
              id="dateFrom"
              selected={payroll.start}
              handleChange={(
                date // date is Date | undefined
              ) => setPayroll((prev) => ({ ...prev, start: date || null }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dateTo">To</Label>
            <DatePicker
              id="dateTo"
              selected={payroll.finish}
              handleChange={(
                date // date is Date | undefined
              ) => setPayroll((prev) => ({ ...prev, finish: date || null }))}
            />
          </div>
        </div>
      </div>
      <div className="px-6 sm:px-12 md:px-20 mb-12 sm:mb-20">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => requestSort("name")}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  名前 <ArrowUpDownIcon className="h-3 w-3" />
                  <span className="text-sm text-blue-500">
                    {getSortIndicator("name")}
                  </span>
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => requestSort("role")}
                  className="flex items-center gap-1 hover:text-primary"
                >
                  所属 <ArrowUpDownIcon className="h-3 w-3" />
                  <span className="text-sm text-blue-500">
                    {getSortIndicator("role")}
                  </span>
                </button>
              </TableHead>

              <TableHead className="text-right">
                <button
                  onClick={() => requestSort("workedDays")}
                  className="flex items-center gap-1 hover:text-primary justify-end w-full"
                >
                  勤務日数 <ArrowUpDownIcon className="h-3 w-3" />
                  <span className="text-sm text-blue-500">
                    {getSortIndicator("workedDays")}
                  </span>
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPayrollStaffList.length > 0 ? (
              sortedPayrollStaffList.map((staffMember) => (
                <TableRow key={staffMember.id}>
                  <TableCell>
                    {`${staffMember.lastName || ""} ${
                      staffMember.firstName || ""
                    }`.trim()}
                  </TableCell>

                  <TableCell className="capitalize">
                    {staffMember.role || "N/A"}
                  </TableCell>

                  <TableCell className="text-right">
                    <TotalDaysPopover
                      staffId={staffMember.id}
                      shipId={payroll.shipID}
                      days={staffMember.workedDays}
                      start={payroll.start}
                      finish={payroll.finish}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  スタッフデータがありません。船舶と日付の範囲を選択してください。
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
