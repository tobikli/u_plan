"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { degreeType } from "@/types/study-program"

export const degreeTypes: degreeType[] = [
  "Bachelor",
  "Master",
  "Phd",
  "Associate",
  "Diploma",
  "Certificate",
  "Other",
]

type DegreeDropProps = {
  value: degreeType | ""
  onChange: (value: degreeType | "") => void
  className?: string
}

export function DegreeDrop({ value, onChange, className }: DegreeDropProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value
            ? degreeTypes.find((degree) => degree === value)
            : "Select degree..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search framework..." className="h-9" />
          <CommandList>
            <CommandEmpty>No degree found.</CommandEmpty>
            <CommandGroup>
              {degreeTypes.map((degree) => (
                <CommandItem
                  key={degree}
                  value={degree}
                  onSelect={(currentValue) => {
                    const next = currentValue === value ? "" : currentValue
                    onChange(next as degreeType | "")
                    setOpen(false)
                  }}
                >
                  {degree}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === degree ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
