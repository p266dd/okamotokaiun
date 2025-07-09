"use client";

import { z } from "zod/v4";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import useSWR, { mutate } from "swr";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { updateStaff, createStaff } from "@/action/staff";
import { fetchShips } from "@/action/ships";

// Shadcn
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SaveIcon, PlusCircleIcon } from "lucide-react";

const formSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().trim(),
  lastName: z.string().trim(),
  ship: z.string().optional(),
  phone: z.string().trim(),
  role: z.string().trim(),
  department: z.string().trim(),
  salary: z.string(),
  code: z.string().min(6, "6桁番号を設定してください").trim(),
});
export type StaffInterface = z.infer<typeof formSchema>;

export default function StaffForm({
  edit,
  setEdit,
  department,
  setDepartment,
}: {
  edit: StaffInterface | null;
  setEdit: React.Dispatch<React.SetStateAction<StaffInterface | null>>;
  department: string | null;
  setDepartment: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  // Get list of ships.
  const { data: shipList, isLoading: loadingShips } = useSWR("fetchShips", fetchShips);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate staff code.
  const generateSixDigitNumber = useMemo((): string => {
    return String(Math.floor(100000 + Math.random() * 900000));
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      firstName: edit ? edit?.firstName : "",
      lastName: edit ? edit?.lastName : "",
      ship: edit ? edit?.ship : "",
      phone: edit ? edit?.phone : "",
      role: edit ? edit?.role : "",
      department: edit ? edit?.department : "",
      salary: edit ? String(edit?.salary) : "",
      code: edit ? edit?.code : generateSixDigitNumber || "",
    },
  });

  async function onSubmit(values: StaffInterface) {
    setErrorMessage(null);
    if (edit && edit?.id) {
      const response = await updateStaff(edit.id, {
        ...values,
        salary: parseInt(values.salary.toString()),
      });

      if (!response || response.error !== null) {
        toast.error("An error occured.");
        setErrorMessage(response.error);
        return;
      }

      toast.success("New staff has been added.");
      form.reset();

      mutate("fetchStaff");

      return;
    }

    const response = await createStaff({
      ...values,
      salary: parseInt(values.salary.toString()),
    });
    if (!response || response.error !== null) {
      toast.error("A problem happen while adding a new staff.");
      setErrorMessage(response.error);
      return;
    }

    toast.success("New staff has been added.");
    form.reset();

    mutate("fetchStaff");
    return;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-start gap-4 flex-wrap">
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>姓</FormLabel>
                <FormControl>
                  <Input placeholder="" autoComplete="off" required {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>名</FormLabel>
                <FormControl>
                  <Input placeholder="" autoComplete="off" required {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-start gap-4 flex-wrap">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>電話番号</FormLabel>
                <FormControl>
                  <Input placeholder="" autoComplete="off" {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>社員番号</FormLabel>
                <FormControl>
                  <Input
                    placeholder="6桁番号を設定してください"
                    autoComplete="off"
                    required
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-start gap-4">
          <FormField
            control={form.control}
            name="ship"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>船舶</FormLabel>
                <Select onValueChange={field.onChange} required {...field}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="船舶を選択" {...field} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loadingShips ? (
                      <SelectItem value="loading">Loading...</SelectItem>
                    ) : (
                      shipList &&
                      shipList.map((ship) => (
                        <SelectItem value={ship.id} key={ship.id}>
                          {ship.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>所属</FormLabel>
                <Select
                  onValueChange={(e) => {
                    field.onChange(e);
                    setDepartment(e);
                  }}
                  required
                  {...field}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="所属部署を選択" {...field} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="甲板部">甲板部</SelectItem>
                    <SelectItem value="機関部">機関部</SelectItem>
                    <SelectItem value="司厨部">司厨部</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} required {...field}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Role" {...field} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {department ? (
                      department === "司厨部" ? (
                        <SelectItem value="一等機関士">一等機関士"</SelectItem>
                      ) : department === "甲板部" ? (
                        <>
                          <SelectItem value="船長">船長</SelectItem>
                          <SelectItem value="一等航海士">一等航海士</SelectItem>
                          <SelectItem value="二等航海士">二等航海士</SelectItem>
                          <SelectItem value="三等航海士">三等航海士</SelectItem>
                          <SelectItem value="甲板部員">甲板部員</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="機関長">機関長</SelectItem>
                          <SelectItem value="二等機関士">二等機関士</SelectItem>
                          <SelectItem value="三等機関士">三等機関士"</SelectItem>
                          <SelectItem value="機関部員">機関部員"</SelectItem>
                        </>
                      )
                    ) : (
                      <span>Select a Department</span>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>日給</FormLabel>
                <FormControl>
                  <Input placeholder="¥" autoComplete="off" required {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        {errorMessage && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertDescription>
              <p>{errorMessage}.</p>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-5 my-9">
          {edit ? (
            <>
              <Button type="submit" variant="success">
                <SaveIcon /> 変更を保存
              </Button>
              <Button variant="outline" type="button" onClick={() => setEdit(null)}>
                キャンセル
              </Button>
            </>
          ) : (
            <Button type="submit">
              <PlusCircleIcon /> 追加
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
