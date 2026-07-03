import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-32 w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
