"use client";

import { IconCrane } from "@tabler/icons-react";

export default function Page() {
  return (
    <div className="flex justify-center items-center h-full">
      <div className="grid gap-4 align-items-center justify-items-center">
        <IconCrane className="size-32 text-muted-foreground" />
        <p className="text-xl font-bold">Under Construction</p>
      </div>
    </div>
  );
}
