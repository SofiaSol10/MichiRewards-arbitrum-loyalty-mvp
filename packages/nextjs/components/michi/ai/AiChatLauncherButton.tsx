"use client";

import type { LucideIcon } from "lucide-react";

type AiChatLauncherButtonProps = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
};

export function AiChatLauncherButton({ label, icon: Icon, onClick }: AiChatLauncherButtonProps) {
  return (
    <button type="button" className="btn btn-secondary gap-2 rounded-full shadow-md" onClick={onClick}>
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}
