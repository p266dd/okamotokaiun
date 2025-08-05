"use client";

import useSWR from "swr";
import Link from "next/link";
import { useRef, useState, useEffect, useMemo } from "react";
import CalendarDialog from "./dialog";

import {
  setDefaultOptions,
  addDays,
  subDays,
  eachDayOfInterval,
  startOfDay,
  isWithinInterval,
  isSameDay,
  isSunday,
  isSaturday,
  format,
  isFirstDayOfMonth,
} from "date-fns";
import { ja } from "date-fns/locale";

// Icons
import {
  ArrowDownIcon,
  ArrowDownLeftIcon,
  ChevronLeft,
  ChevronRight,
  Loader,
  LoaderCircleIcon,
  MinusCircleIcon,
  PlusCircleIcon,
  PrinterIcon,
} from "lucide-react";

// Shadcn
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// Actions
import {
  sortSchedules,
  TSchedule,
  loadPreviousDays,
  loadNextDays,
} from "@/lib/calendar-functions";
import { getCalendarContent } from "@/action/get-calendar";
import { fetchShips } from "@/action/ships";

export default function Calendar() {
  // Set the default date-fns locale to Japan.
  setDefaultOptions({ locale: ja });
  const today = new Date();

  // Element references.
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const todayColumnRef = useRef<HTMLTableCellElement | null>(null);

  const [hoveredColumnIndex, setHoveredColumnIndex] = useState<number | null>(null);
  const [isLoadingNext, setIsLoadingNext] = useState<boolean>(false);
  const [isLoadingPrev, setIsLoadingPrev] = useState<boolean>(false);
  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const [recenter, setRecenter] = useState<number>(0);
  const [refresh, setRefresh] = useState<number>(0);

  // Filter by ship.
  const [selectedShipId, setSelectedShipId] = useState<string | undefined>(undefined);

  const [displayedDays, setDisplayedDays] = useState<Date[]>(() => {
    const startDate = subDays(startOfDay(today), 120);
    const endDate = addDays(startOfDay(today), 20);
    return eachDayOfInterval({ start: startDate, end: endDate });
  });

  // Recenter today's date.
  useEffect(() => {
    if (scrollAreaRef.current && todayColumnRef.current) {
      const viewport = scrollAreaRef.current.querySelector<HTMLDivElement>(
        "[data-radix-scroll-area-viewport]"
      );

      if (viewport) {
        const todayCell = todayColumnRef.current;
        const containerWidth = viewport.offsetWidth;
        const cellOffsetLeft = todayCell.offsetLeft;
        const cellWidth = todayCell.offsetWidth;

        // Calculate the scroll position to center the cell.
        const scrollToPosition = cellOffsetLeft - containerWidth / 2 + cellWidth / 2;

        viewport.scrollTo({
          left: scrollToPosition,
          behavior: "smooth",
        });
      }
    }

    document.documentElement.style.zoom = String(currentZoom);
  }, [recenter, currentZoom, refresh]);

  const firstDay = useMemo(() => displayedDays[0], [displayedDays]);
  const lastDay = useMemo(() => displayedDays[displayedDays.length - 1], [displayedDays]);

  // Zoom Control
  function zoomIn() {
    setCurrentZoom((prev) => prev + 0.2);
  }
  function zoomOut() {
    setCurrentZoom((prev) => prev - 0.2);
  }

  // Fetch all users and their schedule given the date range.
  const [prevData, setPrevData] = useState<TSchedule[] | null>(null);
  const { data, isLoading } = useSWR(
    { key: "fetchStaffWithSchedule", firstDay, lastDay, refresh },
    () => getCalendarContent({ firstDay, lastDay }),
    {
      onSuccess: (newData) => {
        setPrevData(newData);
      },
    }
  );

  const scheduleList = (data as TSchedule[]) ?? (prevData as TSchedule[]);

  // Fetch available ships.
  const { data: shipList, isLoading: loadingShips } = useSWR("fetchShips", fetchShips);

  // Sort the fetched data by dept, role and shipId.
  const sortedStaff = shipList
    ? sortSchedules(shipList, selectedShipId, scheduleList)
    : scheduleList ?? [];

  return (
    <>
      <div className="flex flex-col md:flex-row items-center justify-between mb-2 md:mb-9 px-12 print:hidden">
        <div className="flex items-center justify-center flex-wrap gap-3 mb-4 md:mb-0">
          <div>
            <Button
              className="cursor-pointer"
              onClick={() => setSelectedShipId(undefined)}
              variant={selectedShipId === undefined ? "default" : "outline"}
            >
              All
            </Button>
          </div>

          {loadingShips === false && shipList && shipList.length > 0 ? (
            shipList.map((ship) => (
              <div key={ship.id}>
                <Button
                  variant={selectedShipId === ship.id ? "default" : "outline"}
                  onClick={() => setSelectedShipId(ship.id)}
                >
                  {ship.name}
                </Button>
              </div>
            ))
          ) : (
            <div>No available ships.</div>
          )}
        </div>

        <div>
          <Button
            variant="outline"
            type="button"
            onClick={() => setRecenter((prev) => prev + 1)}
          >
            <span>今日</span>
            <ArrowDownIcon />
          </Button>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/print">
              <PrinterIcon /> 印刷
            </Link>
          </Button>

          <Button variant="outline" type="button" onClick={() => zoomOut()}>
            <span>Zoom</span>
            <MinusCircleIcon />
          </Button>

          <Button variant="outline" type="button" onClick={() => zoomIn()}>
            <span>Zoom</span>
            <PlusCircleIcon />
          </Button>
        </div>
      </div>

      <div className="relative flex">
        {isLoading && (
          <div className="absolute h-full inset-0 -top-2 z-50 bg-white/80 flex justify-center my-8">
            <span className="flex items-center gap-2">
              <LoaderCircleIcon className="animate-spin" /> Loading...
            </span>
          </div>
        )}

        <div className="relative w-[150px]">
          <Table className="mt-7" onMouseLeave={() => setHoveredColumnIndex(null)}>
            <TableHeader>
              <TableRow>
                <TableHead className="h-16 bg-primary text-primary-foreground border-l border-r border-slate-200">
                  スタッフ
                </TableHead>
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

        <div className="relative w-[calc(100%-150px)]">
          <div
            onClick={() =>
              loadPreviousDays(
                displayedDays,
                setDisplayedDays,
                isLoadingPrev,
                setIsLoadingPrev
              )
            }
            className="absolute top-1/2 left-2 -translate-y-1/3 transition-all w-10 h-10 hover:h-20 bg-slate-600/30 hover:bg-slate-600 z-50 rounded-full flex items-center justify-center cursor-pointer print:hidden"
          >
            {isLoadingPrev ? (
              <Loader className="stroke-white animate-spin" />
            ) : (
              <ChevronLeft className="stroke-white" />
            )}
          </div>
          <div
            onClick={() =>
              loadNextDays(
                displayedDays,
                setDisplayedDays,
                isLoadingNext,
                setIsLoadingNext
              )
            }
            className="absolute top-1/2 right-2 -translate-y-1/3 transition-all w-10 h-10 hover:h-20 bg-slate-600/30 hover:bg-slate-600 z-50 rounded-full flex items-center justify-center cursor-pointer print:hidden"
          >
            {isLoadingNext ? (
              <Loader className="stroke-white animate-spin" />
            ) : (
              <ChevronRight className="stroke-white" />
            )}
          </div>
          <ScrollArea
            ref={scrollAreaRef}
            className="w-full whitespace-nowrap bg-background border-0"
            type="always"
          >
            <Table className="min-w-full mt-7">
              <TableHeader>
                <TableRow>
                  {displayedDays.map((day, i) => {
                    let customStyle: string = "";
                    if (isSunday(day)) {
                      customStyle = "bg-[#f84b4f] text-white";
                    } else if (isSaturday(day)) {
                      customStyle = "bg-[#2b7fff] text-white";
                    } else {
                      customStyle = "bg-gray-50 text-foreground";
                    }
                    return (
                      <TableHead
                        key={day.toISOString()}
                        ref={isSameDay(today, day) ? todayColumnRef : null}
                        onMouseEnter={() => setHoveredColumnIndex(i)}
                        className={`relative w-[50px] h-16 text-center border-l border-r border-slate-200 ${customStyle}`}
                      >
                        {isFirstDayOfMonth(day) ? (
                          <div
                            className={`absolute -top-8 ${
                              isSameDay(today, day) ? "pl-11" : "pl-3"
                            } left-0 text-lg text-black/50`}
                          >
                            <ArrowDownLeftIcon className="size-4 inline mr-3" />
                            {format(day, "MMMM yyyy")}
                          </div>
                        ) : null}
                        <div>{format(day, "EEE")}</div>
                        <div>{format(day, "M/d")}</div>
                        {isSameDay(today, day) && (
                          <span className="w-full bg-[#ecb011] text-white rounded-full absolute -top-7 left-0 z-30">
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
                        : schedule.ship.name === "千島丸"
                        ? "bg-[#f5d60f]"
                        : "bg-primary";

                    return (
                      <TableRow key={i} className="hover:bg-gray-100 h-10">
                        {displayedDays.map((day, i) => {
                          // Find relevant schedule.
                          const currentDay = startOfDay(day);

                          // Change the background if day is a weekend.
                          let customBackground: string = "";
                          if (isSunday(day)) {
                            customBackground =
                              hoveredColumnIndex === i ? "bg-red-200" : "bg-red-100";
                          } else if (isSaturday(day)) {
                            customBackground =
                              hoveredColumnIndex === i ? "bg-blue-200" : "bg-blue-100";
                          } else if (hoveredColumnIndex === i) {
                            customBackground = "bg-gray-100";
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
                                onMouseEnter={() => setHoveredColumnIndex(i)}
                                className={`relative text-center p-0 ${customBackground}`}
                              >
                                <CalendarDialog
                                  cellContent={cellContent}
                                  schedule={schedule}
                                  shipList={shipList}
                                  setRefresh={setRefresh}
                                />
                              </TableCell>
                            );
                          } else {
                            return (
                              <TableCell
                                key={`${schedule.id + i}-${day.toISOString()}-${i}-data`}
                                onMouseEnter={() => setHoveredColumnIndex(i)}
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
            <ScrollBar className="h-4 translate-y-6" orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    </>
  );
}
