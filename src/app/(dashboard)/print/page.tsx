"use client";

import useSWR from "swr";
import { useState, useMemo, useEffect } from "react";
import { getCalendarContent } from "@/action/get-calendar";
import { sortSchedules, TSchedule } from "@/lib/calendar-functions";
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

  // Fetch available ships.
  const { data: availableShips } = useSWR("fetchShips", fetchShips);

  // Fetch all users and their schedule given the date range.
  const [prevData, setPrevData] = useState<TSchedule[] | null>(null);
  const { data, isLoading } = useSWR(
    { key: "fetchStaffWithSchedule", firstDay, lastDay },
    () => getCalendarContent({ firstDay, lastDay }),
    {
      onSuccess: (newData) => {
        setPrevData(newData);
      },
    }
  );

  if (isLoading === true || !data) {
    return (
      <div className="flex tems-center justify-center gap-3">
        <LoaderCircleIcon className="animate-spin" />
        Loading...
      </div>
    );
  }

  const scheduleList = (data as TSchedule[]) ?? (prevData as TSchedule[]);

  // Sort the fetched data by dept, role and shipId.
  const sortedStaff = availableShips ? sortSchedules(availableShips, selectedShipId, scheduleList) : scheduleList ?? [];

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
            <div className="flex items-center gap-4">
              <DatePicker
                id="dateFrom"
                selected={selectedDate}
                handleChange={(
                  date // date is Date | undefined
                ) => setSelectedDate(date ? date : today)}
              />
              <div className="flex items-center gap-3">
                <div>{format(firstDay, "yyyy MMMM do", { locale: ja })}から</div>
                <div>{format(lastDay, "yyyy MMMM do", { locale: ja })}まで</div>
              </div>
            </div>
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
                  {sortedStaff.map((schedule, i) => {
                    if ("type" in schedule && schedule.type === "Ship") {
                      // Return the Ship Name.
                      return (
                        <TableRow key={i} className="h-14">
                          <TableCell className="pl-2">
                            <span className="">{schedule.name}</span>
                          </TableCell>
                        </TableRow>
                      );
                    } else if ("type" in schedule && schedule.type === "Department") {
                      // Return the Department.
                      return (
                        <TableRow key={i} className="h-6 bg-slate-200/70">
                          <TableCell className="text-slate-700 pl-2 py-0.5 text-xs">
                            <span className="">{schedule.name}</span>
                          </TableCell>
                        </TableRow>
                      );
                    } else if ("type" in schedule && schedule.type === "Role") {
                      // Return without displaying the Role.
                      return null;
                      // return (
                      //   <TableRow
                      //     key={schedule.name.toLocaleLowerCase()}
                      //     className="h-4 bg-slate-200/70"
                      //   >
                      //     <TableCell className="text-slate-700 pl-2 py-0.5 text-xs">
                      //       {/* You can display item.roleName here if desired, or leave it for a visual break */}
                      //       <span className="">{schedule.name}</span>
                      //     </TableCell>
                      //   </TableRow>
                      // );
                    }
                    // Return the staff name.
                    return (
                      <TableRow key={i} className="hover:bg-gray-100 h-10">
                        <TableCell className="bg-blue-100 pr-4 sm:pr-12">{`${schedule.staff.lastName} ${schedule.staff.firstName}`}</TableCell>
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
                  {sortedStaff.map((schedule, i) => {
                    if ("type" in schedule && schedule.type === "Ship") {
                      return (
                        <TableRow key={i} className="h-14">
                          <TableCell colSpan={displayedDays.length} className="pl-2">
                            <span className="text-transparent">{schedule.name}</span>
                          </TableCell>
                        </TableRow>
                      );
                    } else if ("type" in schedule && schedule.type === "Department") {
                      return (
                        <TableRow key={i} className="h-6 bg-slate-200/70">
                          <TableCell
                            colSpan={displayedDays.length}
                            className="text-slate-700 pl-2 py-0.5 text-xs"
                          >
                            <span className="text-transparent">{schedule.name}</span>
                          </TableCell>
                        </TableRow>
                      );
                    } else if ("type" in schedule && schedule.type === "Role") {
                      // Don't show role row.
                      return null;
                    } else {
                      // Schedule colors.
                    const color =
                      schedule.ship.name === "JFE N1 / 清丸"
                        ? "bg-[#466dbe]"
                        : schedule.ship.name === "JFE N3 / 第三清丸"
                        ? "bg-[#e874cd]"
                        : schedule.ship.name === "扇鳳丸"
                        ? "bg-[#5ea64d]"
                        : schedule.ship.name === "千島丸" ? "bg-[#f5d60f]" : "bg-primary";

                      return (
                        <TableRow key={i} className="hover:bg-gray-100 h-10">
                          {displayedDays.map((day, i) => {
                            // Find relevant schedule.
                            const currentDay = startOfDay(day);

                            // Change the background if day is a weekend.
                            let customBackground: string = "";
                            if (isSunday(day)) {
                              customBackground = "bg-red-100";
                            } else if (isSaturday(day)) {
                              customBackground = "bg-blue-100";
                            } else {
                              customBackground = "bg-gray-50";
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
                                      <span
                                        className={`rounded-full w-4 h-4 ${color} text-primary-foreground text-xs`}
                                      />
                                    </span>
                                  </div>
                                );
                              } else if (
                                // The start of schedule.
                                isSameDay(currentDay, scheduleStart)
                              ) {
                                cellContent = (
                                  <div className="absolute inset-0 flex items-center justify-end">
                                    <span className={`block w-1/2 h-1 ${color}`}></span>
                                    <span className="absolute z-20 flex items-center justify-center top-0 right-0 w-full h-full">
                                      <span
                                        className={`rounded-full w-4 h-4 ${color} text-primary-foreground text-xs`}
                                      />
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
                                    <span className={`block w-1/2 h-1 ${color}`}></span>
                                    <span className="absolute z-20 flex items-center justify-center top-0 right-0 w-full h-full">
                                      <span
                                        className={`rounded-full w-4 h-4 ${color} text-primary-foreground text-xs`}
                                      />
                                    </span>
                                  </div>
                                );
                              } else if (
                                isWithinInterval(day, {
                                  start: scheduleStart,
                                  end: scheduleEnd,
                                })
                              ) {
                                cellContent = (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={`block w-full h-1 ${color}`}></span>
                                  </div>
                                );
                              } else {
                                cellContent = (
                                  <div className="absolute inset-0 flex items-center justify-center"></div>
                                );
                              }

                              return (
                                <TableCell
                                  key={`${day.toISOString()}`}
                                  className={`relative text-center p-0 ${customBackground}`}
                                >
                                  <CalendarDialog
                                    cellContent={cellContent}
                                    schedule={schedule}
                                    shipList={availableShips}
                                    setRefresh={() => null}
                                  />
                                </TableCell>
                              );
                            } else {
                              return (
                                <TableCell
                                  key={`${
                                    schedule.id + i
                                  }-${day.toISOString()}-${i}-data`}
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
