import { getRankForLevel } from "../lib/points";

type RankBadgeProps = {
  level: number;
  className?: string;
};

export function RankBadge({ level, className = "" }: RankBadgeProps) {
  const rank = getRankForLevel(level);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${rank.badgeClass} ${className}`}
      title={`Level ${rank.minLevel.toLocaleString("id-ID")}–${rank.maxLevel.toLocaleString("id-ID")}`}
    >
      <span aria-hidden="true">{rank.icon}</span>
      {rank.name}
    </span>
  );
}
