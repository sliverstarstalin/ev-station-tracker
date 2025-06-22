import { Search, X } from "lucide-react";

export default function SearchBar({ value, onChange, onClear }) {
  return (
    <div className="flex items-center gap-2 bg-rose-100/60 focus-within:bg-white py-3 px-4 rounded-full shadow-sm transition">
      <Search size={18} className="text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search city or address…"
        className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
      />
      {value && (
        <button
          onClick={onClear}
          className="p-1 rounded-full hover:bg-rose-200/70 transition"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
