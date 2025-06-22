import { MapPinned } from "lucide-react";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b bg-white/70 backdrop-blur">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <span className="inline-block w-2 h-2 bg-black rounded-full" />
        ChargeFinder
      </div>

      <a
        href="#map"
        className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
      >
        Map <MapPinned size={16} strokeWidth={2} />
      </a>
    </header>
  );
}
