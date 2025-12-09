"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export type TagInputProps = {
  label?: string;
  placeholder?: string;
  selected: string[];
  onChange: (tags: string[]) => void;
  available?: string[];
};

export function TagInput({
  label = "Tags",
  placeholder = "Press Enter to add tag",
  selected,
  onChange,
  available = [],
}: TagInputProps) {
  const [input, setInput] = useState("");
  const labelId = useId();

  const normalizedAvailable = useMemo(
    () =>
      Array.from(
        new Set(
          available
            .map((t) => t.trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [available]
  );

  const addTag = (value: string) => {
    const next = value.trim();
    if (!next) return;
    const exists = selected.some((t) => t.toLowerCase() === next.toLowerCase());
    if (exists) {
      setInput("");
      return;
    }
    onChange([...selected, next]);
    setInput("");
  };

  const removeTag = (value: string) => {
    onChange(selected.filter((tag) => tag !== value));
  };

  const suggestions = useMemo(() => {
    const term = input.trim().toLowerCase();
    const pool = normalizedAvailable.filter(
      (tag) => !selected.some((t) => t.toLowerCase() === tag.toLowerCase())
    );

    if (!term) return pool.slice(0, 8);

    return pool
      .filter((tag) => tag.toLowerCase().includes(term))
      .slice(0, 8);
  }, [input, normalizedAvailable, selected]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && !input && selected.length > 0) {
      removeTag(selected[selected.length - 1]);
    }
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={labelId}>{label}</Label>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-xs font-medium text-muted-foreground"
                aria-label={`Remove tag ${tag}`}
              >
                x
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Input
        id={labelId}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="uppercase tracking-wide text-[11px]">Suggestions</span>
          {suggestions.map((tag) => (
            <Button
              key={tag}
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => addTag(tag)}
            >
              {tag}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
