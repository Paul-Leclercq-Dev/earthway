interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  color?: string;
}

export default function ProgressBar({ value, max, label, color = 'bg-emerald-500' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm font-medium text-gray-700">
        <span>{label}</span>
        <span>{value} / {max}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`${color} h-3 rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
