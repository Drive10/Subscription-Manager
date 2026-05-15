export function SubKeepLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path d="M8 22V10L12 14L16 10L20 14L24 10V22H8Z" fill="white" />
      <rect x="10" y="17" width="12" height="2" rx="1" fill="white" fillOpacity="0.5" />
    </svg>
  );
}
