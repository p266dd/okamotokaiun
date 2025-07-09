"use client";

import { useState } from "react";

// Shadcn.
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";

// Helper function to format Japanese date.
function formatDate(date: Date | undefined) {
  if (!date) {
    return "";
  }
  return format(date, "MMM do", { locale: ja });
}

// Helper function to check validity.
function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

export default function DatePicker({
  handleChange,
  selected,
  id,
}: {
  handleChange: (date: Date | undefined) => void;
  selected: Date | null;
  id: string;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(selected || undefined);
  const [month, setMonth] = useState<Date | undefined>(date);
  const [value, setValue] = useState(formatDate(date));

  return (
    <div className="relative flex gap-2">
      <Input
        id={id}
        value={value}
        placeholder="日付の選択"
        className="bg-background pr-10"
        onChange={(e) => {
          const newRawDate = new Date(e.target.value);
          setValue(e.target.value);
          let newValidDate: Date | undefined = undefined;
          if (isValidDate(newRawDate)) {
            newValidDate = newRawDate;
            setDate(newValidDate);
            setMonth(newValidDate);
          }
          handleChange(newValidDate);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date-picker"
            variant="ghost"
            className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
          >
            <CalendarIcon className="size-3.5 stroke-primary" />
            <span className="sr-only">日付</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto overflow-hidden p-0"
          align="end"
          alignOffset={-8}
          sideOffset={10}
        >
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            month={month}
            onMonthChange={setMonth}
            onSelect={(date) => {
              setDate(date);
              setValue(formatDate(date));
              setOpen(false);
              handleChange(date);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
