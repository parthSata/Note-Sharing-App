import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("rounded-xl border border-zinc-200 bg-white shadow-sm", className)}
      {...props}
    />
  );
}

export { Card };
