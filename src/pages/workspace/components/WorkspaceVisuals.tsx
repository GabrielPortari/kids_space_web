import type { ReactNode } from "react";

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function toHslColor(value: string): string {
  const hash = hashString(value);
  const hue = hash % 360;
  const saturation = 54 + (hash % 10);
  const lightness = 42 + (hash % 8);

  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

export function getInitial(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "?";
  }

  return trimmed.charAt(0).toUpperCase();
}

export function getAvatarStyle(value: string): { backgroundColor: string } {
  return { backgroundColor: toHslColor(value || "avatar") };
}

export function RecordAvatar({ name }: { name: string }) {
  return (
    <span
      className="record-avatar"
      aria-hidden="true"
      style={getAvatarStyle(name)}
    >
      {getInitial(name)}
    </span>
  );
}

export function ModalIconWrap({ children }: { children: ReactNode }) {
  return <div className="profile-modal-icon">{children}</div>;
}

function IconShell({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function PersonIcon() {
  return (
    <IconShell>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </IconShell>
  );
}

export function GroupIcon() {
  return (
    <IconShell>
      <path d="M17 21a5 5 0 0 0-10 0" />
      <circle cx="7.5" cy="9" r="3" />
      <circle cx="16.5" cy="9.5" r="2.5" />
    </IconShell>
  );
}

export function AttendanceIcon() {
  return (
    <IconShell>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
      <path d="M9 3.5 12 2l3 1.5" />
    </IconShell>
  );
}

export function PlusIcon() {
  return (
    <IconShell>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconShell>
  );
}

export function LinkIcon() {
  return (
    <IconShell>
      <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" />
      <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" />
    </IconShell>
  );
}

export function EditIcon() {
  return (
    <IconShell>
      <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10Z" />
      <path d="m13.5 6.5 4 4" />
    </IconShell>
  );
}

export function TrashIcon() {
  return (
    <IconShell>
      <path d="M4 7h16" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </IconShell>
  );
}

export function RefreshIcon() {
  return (
    <IconShell>
      <path d="M20 12a8 8 0 0 0-14.5-4.5" />
      <path d="M4 4v5h5" />
      <path d="M4 12a8 8 0 0 0 14.5 4.5" />
      <path d="M20 20v-5h-5" />
    </IconShell>
  );
}
