"use client";

import { useState, useEffect } from "react";
import { startOfDay, endOfDay, max, min, differenceInCalendarDays } from "date-fns";

// Shadcn
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Types
import { Prisma } from "@/lib/prisma/generate";
import { EllipsisIcon } from "lucide-react";
import { getScheduleQuery } from "@/action/schedule";
type ProcessedSchedule = {
  shipName: string;
  days: number;
};

export default function TotalDaysPopover({
  staffId,
  shipId,
  days = 0,
  start,
  finish,
}: {
  staffId: string;
  shipId: string;
  days: number;
  start: Date | null;
  finish: Date | null;
}) {
  const [totalDaysSchedule, setTotalDaysSchedule] = useState<ProcessedSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (start === null || finish === null || staffId === "") {
      return;
    }

    const fetchData = async () => {
      // Clear previous state and set loading.
      setTotalDaysSchedule([]);
      setError("");
      setLoading(true);

      try {
        // Normalize payroll period dates to start/end of day for consistent comparison
        const payrollStart = startOfDay(start);
        const payrollFinish = endOfDay(finish);

        // Query schedules that overlap with the payroll period
        const scheduleQueryWhere: Prisma.ScheduleWhereInput = {
          staffId,
          embark: {
            // Schedule must embark on or before the payroll finish date.
            lte: payrollFinish,
          },
          OR: [
            {
              desembark: {
                // Schedule must disembark on or after the payroll start date
                gte: payrollStart,
              },
            },
            {
              desembark: null, // Or the staff is still embarked
            },
          ],
          // Conditionally add shipId filter if it's not "all".
          ...(shipId &&
            shipId !== "all" && {
              shipId: shipId,
            }),
        };

        const schedulesResult = await getScheduleQuery(scheduleQueryWhere);

        if (!schedulesResult) {
          setError("Could not retrieve schedule data.");
          setTotalDaysSchedule([]);
          return;
        }

        const processedSchedules: ProcessedSchedule[] = [];

        schedulesResult.forEach((schedule) => {
          // Normalize schedule dates to start/end of day for calculation.
          const scheduleEmbark = startOfDay(new Date(schedule.embark));
          const scheduleDesembark = schedule.desembark
            ? endOfDay(new Date(schedule.desembark)) // Use endOfDay for desembark.
            : payrollFinish; // If still embarked, cap at payrollFinish.

          // Determine the effective period of work within the payroll dates.
          const effectiveStart = max([scheduleEmbark, payrollStart]);
          const effectiveEnd = min([scheduleDesembark, payrollFinish]);

          if (effectiveStart <= effectiveEnd) {
            // differenceInCalendarDays gives the number of full days between two dates.
            // Add 1 to make it inclusive of start and end day.
            const daysWorkedInSegment =
              differenceInCalendarDays(effectiveEnd, effectiveStart) + 1;

            if (daysWorkedInSegment > 0) {
              processedSchedules.push({
                shipName: schedule.ship?.name || "Unknown Ship",
                days: daysWorkedInSegment,
              });
            }
          }
        });

        setTotalDaysSchedule(processedSchedules);
      } catch (error) {
        setTotalDaysSchedule([]); // Clear data on error
        setError("Could not get data.");
        console.error(error);
      } finally {
        setLoading(false); // Always set loading to false
      }
    };
    fetchData();

    return () => {
      setTotalDaysSchedule([]);
      setError("");
      setLoading(false);
    };
  }, [staffId, shipId, start, finish]);

  if (start === null || finish === null || staffId === "") {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger>
        <span className="flex items-center gap-2">
          <EllipsisIcon color="#cccccc" />
          {days} 日
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="print:hidden">
        <h4 className="text-base">勤務日数の内訳</h4>
        {loading === true ? (
          "Loading..."
        ) : (
          <div className="my-2 space-y-1">
            {error ? ( // Display error message if there's an error
              <div className="text-red-500">{error}</div>
            ) : totalDaysSchedule.length > 0 ? ( // Check if there are schedules to display
              totalDaysSchedule.map((schedule, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span>{schedule.shipName}</span>{" "}
                  <span className="font-medium">{schedule.days} 日</span>
                </div>
              ))
            ) : (
              // Message if no schedules found
              <div>この期間の詳細なスケジュールは見つかりません</div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
