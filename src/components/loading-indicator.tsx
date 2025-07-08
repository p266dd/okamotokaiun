"use client";

import { useLinkStatus } from "next/link";
import { LoaderCircleIcon } from "lucide-react";

export function LoadingIndicator() {
  const { pending } = useLinkStatus();

  return pending ? (
    <span className="inline">
      <LoaderCircleIcon className="animate-spin" />
    </span>
  ) : null;
}
