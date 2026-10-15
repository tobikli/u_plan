"use client";

import type { FormEventHandler, ReactNode } from "react";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function FormDialog({
  title,
  eyebrow,
  description,
  children,
  footer,
  onSubmit,
  busy = false,
  disabled = false,
}: {
  title: string;
  eyebrow: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  onSubmit: FormEventHandler<HTMLFormElement>;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <DialogContent
      className="max-h-[90dvh] overflow-hidden rounded-2xl p-0 sm:max-w-xl"
      showCloseButton={!busy}
      onInteractOutside={(event) => {
        if (busy) event.preventDefault();
      }}
      onEscapeKeyDown={(event) => {
        if (busy) event.preventDefault();
      }}
    >
      <form
        onSubmit={onSubmit}
        aria-busy={busy}
        className="flex max-h-[90dvh] min-h-0 min-w-0 flex-col"
      >
        <DialogHeader className="shrink-0 border-b bg-muted/20 px-6 py-5 pr-12 text-left">
          <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            {eyebrow}
          </p>
          <DialogTitle className="text-xl tracking-tight">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto">
          <fieldset
            disabled={busy || disabled}
            className="min-w-0 space-y-6 px-6 py-5"
          >
            {children}
          </fieldset>
        </div>
        <DialogFooter className="shrink-0 flex-row flex-wrap items-center justify-end gap-3 border-t bg-muted/20 px-6 py-4">
          {footer}
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
