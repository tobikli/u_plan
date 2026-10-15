"use client";

import { useState, type ReactNode } from "react";
import { Trash2, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function EditSection({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="min-w-0 space-y-4 border-0 p-0">
      {title && (
        <legend className="mb-1 text-sm font-semibold tracking-tight">
          {title}
        </legend>
      )}
      {description && (
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      )}
      {children}
    </fieldset>
  );
}

export function DeleteRecordButton({
  kind,
  name,
  onDelete,
  disabled,
}: {
  kind: "course" | "program" | "account" | "examination";
  name: string;
  onDelete: () => Promise<boolean>;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) setOpen(next);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          disabled={disabled}
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 aria-hidden="true" />
          Delete {kind}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        onEscapeKeyDown={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {kind}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes{" "}
            <span className="font-medium text-foreground">{name}</span>
            {kind === "program"
              ? " and its courses"
              : kind === "account"
                ? " and all your study data"
                : kind === "examination"
                  ? ""
                  : " and its notes"}
            . This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Keep {kind}</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={async (event) => {
              event.preventDefault();
              setPending(true);
              try {
                if (await onDelete()) setOpen(false);
              } catch {
                toast.error(`Unable to delete ${kind}. Please try again.`);
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? (
              <>
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
                Deleting…
              </>
            ) : (
              `Delete ${kind}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
