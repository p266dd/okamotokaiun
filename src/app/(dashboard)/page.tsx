import Image from "next/image";
import { redirect, RedirectType } from "next/navigation";
import { getSession } from "@/lib/session";
import Calendar from "@/components/calendar/calendar";

// Ship calendar background.
import ShipBackground from "@/assets/jfe-n1.jpg";

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect("/auth/login", RedirectType.push);
  }
  return (
    <div className="-mt-32 print:mt-0">
      <Image
        priority
        src={ShipBackground}
        alt="Okamoto Kaiun Ship"
        className="w-full max-h-[400px] object-cover mask-b-from-0% mask-b-to-90% print:hidden"
      />

      <div className="relative z-10 sm:-mt-12 print:mt-0">
        <Calendar />
      </div>
    </div>
  );
}
