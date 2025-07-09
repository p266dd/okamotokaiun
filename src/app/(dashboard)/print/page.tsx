"use client";

import useSWR from "swr";
import { useState, useMemo, useEffect } from "react";
import { fetchStaffWithSchedule } from "@/action/staff";
import { sortStaff } from "@/lib/calendar-functions";
import { fetchShips } from "@/action/ships";

import {
  setDefaultOptions,
  eachDayOfInterval,
  startOfDay,
  subMonths,
  isSunday,
  isSaturday,
  isSameDay,
  format,
  isWithinInterval,
} from "date-fns";
import { ja } from "date-fns/locale";

// Shadcn
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DatePicker from "@/components/date-picker";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LoaderCircleIcon, PrinterIcon } from "lucide-react";
import CalendarDialog from "@/components/calendar/dialog";

export default function PrintCalendarPage() {
  // Set the default date-fns locale to Japan.
  setDefaultOptions({ locale: ja });
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Fetch ships.
  const { data: availableShips } = useSWR("fetchShips", fetchShips);

  // Filter by ship.
  const [selectedShipId, setSelectedShipId] = useState<string | undefined>(undefined);

  const [displayedDays, _setDisplayedDays] = useState<Date[]>(() => {
    const startDate = subMonths(startOfDay(selectedDate), 1);
    const endDate = startOfDay(selectedDate);
    return eachDayOfInterval({ start: startDate, end: endDate });
  });

  useEffect(() => {
    const startDate = subMonths(startOfDay(selectedDate), 1);
    const endDate = startOfDay(selectedDate);
    _setDisplayedDays(eachDayOfInterval({ start: startDate, end: endDate }));
  }, [selectedDate]);

  const firstDay = useMemo(() => displayedDays[0], [displayedDays]);
  const lastDay = useMemo(() => displayedDays[displayedDays.length - 1], [displayedDays]);

  // Fetch all users and their schedule given the date range.
  const { data: staffList, isLoading: loadingStaffList } = useSWR(
    {
      key: "fetchStaffWithSchedule",
      firstDay: firstDay.toISOString(),
      lastDay: lastDay.toISOString(),
    },
    () => fetchStaffWithSchedule(firstDay, lastDay)
  );

  // Fetch available ships.
  const { data: shipList } = useSWR("fetchShips", fetchShips);

  if (loadingStaffList === true || !staffList) {
    return (
      <div className="flex tems-center justify-center gap-3">
        <LoaderCircleIcon className="animate-spin" />
        Loading...
      </div>
    );
  }

  // Sort the fetched data by dept, role and shipId.
  const sortedStaff = sortStaff(staffList, selectedShipId, shipList ? shipList : []);

  const printPage = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="px-6 sm:px-12 md:px-20 flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14 print:mb-6">
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

        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="shipSelect">船舶</Label>
            <Select
              value={selectedShipId}
              onValueChange={(value) => {
                if (value === "all") {
                  setSelectedShipId(undefined);
                  return;
                } else if (value) {
                  setSelectedShipId(value);
                }
              }}
            >
              <SelectTrigger id="shipSelect" className="w-[180px]">
                <SelectValue placeholder="船舶" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All</SelectItem>
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
              selected={selectedDate}
              handleChange={(
                date // date is Date | undefined
              ) => setSelectedDate(date ? date : today)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div>
          <div className="flex">
            <div className="relative">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-gray-100 text-xs">スタッフ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStaff.map((staff, i) => {
                    if ("type" in staff && staff.type === "Ship") {
                      // Return the Ship Name.
                      return (
                        <TableRow key={staff.name.toLocaleLowerCase()}>
                          <TableCell className="text-xs">{staff.name}</TableCell>
                        </TableRow>
                      );
                    } else if ("type" in staff && staff.type === "Department") {
                      // Return the Department.
                      return (
                        <TableRow key={i}>
                          <TableCell className="text-xs">{staff.name}</TableCell>
                        </TableRow>
                      );
                    } else if ("type" in staff && staff.type === "Role") {
                      return null;
                    }
                    return (
                      <TableRow key={staff.id}>
                        <TableCell className="text-xs">{`${staff.lastName} ${staff.firstName}`}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="relative">
              <Table>
                <TableHeader>
                  <TableRow>
                    {displayedDays.map((day) => {
                      let customStyle: string = "";
                      if (isSunday(day)) {
                        customStyle = "bg-gray-200";
                      } else if (isSaturday(day)) {
                        customStyle = "bg-gray-100";
                      } else {
                        customStyle = "bg-gray-50";
                      }
                      return (
                        <TableHead
                          key={day.toISOString()}
                          className={`relative w-[30px] text-xs ${customStyle}`}
                        >
                          <div>{format(day, "EEE")}</div>
                          <div>{format(day, "M/d")}</div>
                          {isSameDay(today, day) && (
                            <span className="w-full bg-[#ecb011] text-white rounded-full absolute -top-7 left-0 z-30 print:hidden">
                              今日
                            </span>
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStaff.map((staff, i) => {
                    if ("type" in staff && staff.type === "Ship") {
                      return (
                        <TableRow key={staff.name.toLocaleLowerCase()}>
                          <TableCell colSpan={displayedDays.length} className="text-xs">
                            <span className="text-transparent">{staff.name}</span>
                          </TableCell>
                        </TableRow>
                      );
                    } else if ("type" in staff && staff.type === "Department") {
                      return (
                        <TableRow key={i} className="bg-gray-50">
                          <TableCell
                            colSpan={displayedDays.length}
                            className="text-xs text-transparent"
                          >
                            {staff.name}
                          </TableCell>
                        </TableRow>
                      );
                    } else if ("type" in staff && staff.type === "Role") {
                      // Don't show role row.
                      return null;
                    } else {
                      return (
                        <TableRow key={staff.id}>
                          {displayedDays.map((day, i) => {
                            // Find relevant schedule.
                            const currentDay = startOfDay(day);
                            const schedule = staff.schedule.find(
                              (s) =>
                                s.embark &&
                                typeof s.shipId === "string" &&
                                isWithinInterval(currentDay, {
                                  start: startOfDay(s.embark),
                                  end: s.desembark
                                    ? startOfDay(s.desembark)
                                    : startOfDay(new Date(Date.now())),
                                })
                            );

                            // Change the background if day is a weekend.
                            let customBackground: string = "";
                            if (isSunday(day)) {
                              customBackground = "bg-gray-200";
                            } else if (isSaturday(day)) {
                              customBackground = "bg-gray-100";
                            }

                            // Create what will be shown.
                            let cellContent: React.ReactElement | null = null;

                            if (schedule && schedule.embark) {
                              const scheduleStart = startOfDay(schedule.embark);
                              const scheduleEnd = schedule.desembark
                                ? startOfDay(schedule.desembark)
                                : "";

                              if (
                                // Either the start or end of schedule.
                                isSameDay(currentDay, scheduleStart) &&
                                isSameDay(currentDay, scheduleEnd)
                              ) {
                                cellContent = (
                                  <div className="absolute inset-0 flex items-center justify-end">
                                    <span className="absolute z-20 flex items-center justify-center top-0 right-0 w-full h-full">
                                      <span className="rounded-full w-4 h-4 bg-primary text-primary-foreground text-xs" />
                                    </span>
                                  </div>
                                );
                              } else if (
                                // The start of schedule.
                                isSameDay(currentDay, scheduleStart)
                              ) {
                                cellContent = (
                                  <div className="absolute inset-0 flex items-center justify-end">
                                    <span className="block w-1/2 h-1 bg-primary"></span>
                                    <span className="absolute z-20 flex items-center justify-center top-0 right-0 w-full h-full">
                                      <span className="rounded-full w-4 h-4 bg-primary text-primary-foreground text-xs" />
                                    </span>
                                  </div>
                                );
                              } else if (
                                // The end of schedule.
                                scheduleEnd &&
                                isSameDay(currentDay, scheduleEnd)
                              ) {
                                cellContent = (
                                  <div className="absolute inset-0 flex items-center justify-start">
                                    <span className="block w-1/2 h-1 bg-primary"></span>
                                    <span className="absolute z-20 flex items-center justify-center top-0 right-0 w-full h-full">
                                      <span className="rounded-full w-4 h-4 bg-primary text-primary-foreground text-xs" />
                                    </span>
                                  </div>
                                );
                              } else {
                                cellContent = (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="block w-full h-1 bg-primary"></span>
                                  </div>
                                );
                              }

                              return (
                                <TableCell
                                  key={`${day.toISOString()}`}
                                  className={`relative text-center p-0 h-[30px] ${customBackground}`}
                                >
                                  <CalendarDialog
                                    cellContent={cellContent}
                                    schedule={schedule}
                                    shipList={shipList}
                                    setRefresh={() => null}
                                  />
                                </TableCell>
                              );
                            } else {
                              return (
                                <TableCell
                                  key={`${staff.id}-${day.toISOString()}-${i}-data`}
                                  className={`relative text-center p-0 ${customBackground}`}
                                ></TableCell>
                              );
                            }
                          })}
                        </TableRow>
                      );
                    }
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
