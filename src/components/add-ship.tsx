"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";
import { string } from "zod/v4-mini";
import { fetchShips, updateShip, deleteShip, createShip } from "@/action/ships";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PencilIcon, PlusCircleIcon, SaveIcon, ShipIcon, TrashIcon } from "lucide-react";

// Type
import { Ship } from "@/lib/prisma/generate";

const NewFormInput = () => {
  const [newName, setNewName] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleSave = async () => {
    if (!newName || newName === "") {
      toast.error("No ship name provided.");
      return;
    }
    const validateName = string().safeParse(newName);
    if (!validateName.success) {
      toast.error("Invalid ship name.");
      return;
    }

    // Save ship name.
    const createdShip = await createShip({ name: newName });

    if (!createdShip) {
      toast.error("An error occured.");
      return;
    }

    toast.success("Ship has been created.");
    mutate("fetchShips");
    setNewName(null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="success">
          <PlusCircleIcon /> 新規船舶
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-sm text-slate-500 mb-2">New Ship</p>
        <div className="flex items-center gap-2">
          <Input
            name="shipName"
            type="text"
            autoComplete="off"
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button type="button" variant="success" onClick={handleSave}>
            <SaveIcon />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const EditFormInput = ({ ship }: { ship: Ship }) => {
  const [newName, setNewName] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleSave = async () => {
    if (!newName || newName === "") {
      toast.error("No ship name provided.");
      return;
    }
    const validateName = string().safeParse(newName);
    if (!validateName.success) {
      toast.error("Invalid ship name.");
      return;
    }

    // Save ship name.
    const updatedShip = await updateShip({ id: ship.id, name: newName });

    if (!updatedShip) {
      toast.error("An error occured.");
      return;
    }

    toast.success("Ship name has been updated.");
    mutate("fetchShips");
    setNewName(null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" className="cursor-pointer">
          <PencilIcon className="text-primary" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-sm text-slate-500 mb-2">Editing: {ship.name}</p>
        <div className="flex items-center gap-2">
          <Input
            name="shipName"
            type="text"
            autoComplete="off"
            onChange={(e) => setNewName(e.target.value)}
            defaultValue={ship.name}
          />
          <Button type="button" variant="success" onClick={handleSave}>
            <SaveIcon />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default function AddShip() {
  const { data: ships, isLoading: loadingShips } = useSWR("fetchShips", fetchShips);

  const handleDelete = async (shipId: string) => {
    if (!shipId || shipId === "") {
      toast.error("No ship id provided.");
      return;
    }
    const validateId = string().safeParse(shipId);
    if (!validateId.success) {
      toast.error("Invalid ship id.");
      return;
    }

    // Save ship name.
    const deletedShip = await deleteShip(validateId.data);

    if (!deletedShip) {
      toast.error("An error occured.");
      return;
    }

    toast.success("Ship has been deleted.");
    mutate("fetchShips");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="default">
          <ShipIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        {loadingShips ? (
          "LoadingIndicator..."
        ) : (
          <div>
            <div className="flex flex-col gap-1">
              {ships &&
                ships.map((ship) => (
                  <div key={ship.id} className="flex items-center justify-between">
                    <div>{ship.name}</div>
                    <div className="flex items-center gap-2">
                      <EditFormInput ship={ship} />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleDelete(ship.id)}
                        className="cursor-pointer"
                      >
                        <TrashIcon className="text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              <NewFormInput />
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
