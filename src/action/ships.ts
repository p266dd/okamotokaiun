"use server";

import prisma from "@/lib/prisma";

export async function fetchShips() {
  "use server";
  const result = await prisma.ship.findMany();

  if (!result) {
    return null;
  }

  return result;
}
