interface IconProps {
  className?: string;
}

export function ChatIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 15a3 3 0 0 1-3 3H9l-5 3v-5.5A7 7 0 0 1 3 12V8a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v7Z" />
      <path d="M8 10h8M8 13h5" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function SendIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.4 20.4 21.85 12 3.4 3.6l-.02 6.53L16.56 12 3.38 13.87l.02 6.53Z" />
    </svg>
  );
}
