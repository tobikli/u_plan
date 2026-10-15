"use client";
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
export function CatalogCombobox({
  id,
  label,
  value,
  items,
  onSelect,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  items: { id: string; label: string; detail: string }[];
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = items.find((item) => item.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          variant="outline"
          disabled={disabled}
          className="h-auto min-h-9 w-full min-w-0 justify-between gap-2 text-left font-normal"
        >
          <span className="min-w-0 truncate">
            {selected?.label ?? (value ? `Curriculum ${value}` : label)}
          </span>
          <ChevronsUpDown
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search by name or code…" />
          <CommandList className="max-h-64">
            <CommandEmpty>No matching entries.</CommandEmpty>
            {items.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.label} ${item.detail} ${item.id}`}
                onSelect={() => {
                  onSelect(item.id);
                  setOpen(false);
                }}
                className="items-start gap-2"
              >
                <Check
                  aria-hidden="true"
                  className={`mt-0.5 size-4 shrink-0 ${value === item.id ? "opacity-100" : "opacity-0"}`}
                />
                <span className="min-w-0">
                  <span className="block break-words">{item.label}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {item.detail}
                  </span>
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
