"use client";

import { useState, useMemo } from "react";
import StaffForm from "@/components/staff-form";
import useSWR, { mutate } from "swr";
import { fetchStaff, deleteStaff } from "@/action/staff";
import { toast } from "sonner";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertCircleIcon,
  EllipsisIcon,
  LoaderCircleIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpDownIcon,
} from "lucide-react";

import { StaffInterface } from "@/components/staff-form";

export default function StaffPage() {
  const [edit, setEdit] = useState<StaffInterface | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { data: staffList, isLoading: loadingStaffList } = useSWR(
    "fetchStaff",
    fetchStaff
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      // toggle order
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedStaff = useMemo(() => {
    if (!staffList?.data) return [];

    const sorted = [...staffList.data];

    if (sortField) {
      const field = sortField as "lastName" | "code" | "ship" | "role" | "department";
      sorted.sort((a, b) => {
        const valA = a[field] || "";
        const valB = b[field] || "";

        if (typeof valA === "string" && typeof valB === "string") {
          return sortOrder === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        return 0;
      });
    }
    return sorted;
  }, [staffList, sortField, sortOrder]);

  if (loadingStaffList) {
    return (
      <div className="flex items-center justify-center gap-3">
        <LoaderCircleIcon className="animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  if (!loadingStaffList && staffList && staffList.error !== null) {
    toast.error(staffList.error);
    return (
      <div className="flex items-center justify-center gap-3">
        <AlertCircleIcon />
        <span>Error loading staff.</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="px-6 sm:px-12 md:px-20">
        <StaffForm
          edit={edit}
          setEdit={setEdit}
          department={selectedDepartment}
          setDepartment={setSelectedDepartment}
        />
      </div>
      <div className="px-6 sm:px-12 md:px-20 mb-12 sm:mb-20">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("lastName")}
              >
                名
              </TableHead>
              <TableHead className="cursor-pointer">電話番号</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("code")}>
                社員番号 <ArrowUpDownIcon className="inline h-4 w-4" />
              </TableHead>
              <TableHead className="cursor-pointer">船舶</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("department")}
              >
                所属
              </TableHead>
              <TableHead className="cursor-pointer">階級</TableHead>
              <TableHead className="text-right w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStaff.map((staff, i) => (
              <TableRow key={i}>
                <TableCell>{`${staff.lastName} ${staff.firstName}`}</TableCell>
                <TableCell>{staff.phone}</TableCell>
                <TableCell>{staff.code}</TableCell>
                <TableCell>{staff?.ship?.name}</TableCell>
                <TableCell>{staff.department}</TableCell>
                <TableCell>{staff.role}</TableCell>
                <TableCell className="text-right w-12">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <EllipsisIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>オプション</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setEdit({
                            id: staff.id,
                            firstName: staff.firstName,
                            lastName: staff.lastName,
                            ship: staff.ship?.id,
                            phone: staff.phone || "",
                            role: staff.role,
                            department: staff.department,
                            salary: String(staff.salary),
                            code: staff.code,
                          });
                          setSelectedDepartment(staff.department);
                        }}
                      >
                        <PencilIcon /> スタッフを編集
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          deleteStaff(staff.id).then(() =>
                            toast.success("Staff has been deleted.")
                          );
                          mutate("fetchStaff");
                        }}
                      >
                        <TrashIcon /> スタッフを削除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
