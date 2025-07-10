"use server";

import prisma from "@/lib/prisma";

export async function fetchShips() {
  "use server";
  const result = await prisma.ship.findMany({
    orderBy: {
      name: "asc",
    },
  });

  if (!result) {
    return null;
  }

  return result;
}

export async function updateShip(ship: { id: string; name: string }) {
  try {
    const result = await prisma.ship.update({
      data: {
        name: ship.name,
      },
      where: {
        id: ship.id,
      },
    });

    if (!result) {
      return null;
    }

    return result;
  } catch (_e) {
    console.log("Error updating ship.", _e);
    return null;
  }
}

export async function createShip(ship: { name: string }) {
  try {
    const result = await prisma.ship.create({
      data: {
        name: ship.name,
      },
    });

    if (!result) {
      return null;
    }

    return result;
  } catch (_e) {
    console.log("Error creating ship.", _e);
    return null;
  }
}

export async function deleteShip(shipId: string) {
  try {
    const result = await prisma.ship.delete({
      where: {
        id: shipId,
      },
    });

    if (!result) {
      return null;
    }

    return result;
  } catch (_e) {
    console.log("Error deleting ship.", _e);
    return null;
  }
}
