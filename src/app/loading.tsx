"use client";

import Image from "next/image";
import Logo from "@/assets/company_logo.png";
import { LoaderCircleIcon } from "lucide-react";

export default function LoadingPage() {
  return (
    <div className="h-screen flex flex-col gap-6 items-center justify-center bg-primary text-primary-foreground">
      <Image src={Logo} alt="Okamoto Kaiun" className="max-w-32" />
      <LoaderCircleIcon className="animate-spin" />
    </div>
  );
}
