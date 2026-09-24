import { timeAgo } from '@/lib/format';

export default function TimeAgo({ date, className }: { date: string; className?: string }) {
  return (
    <time dateTime={date} title={new Date(date).toLocaleString()} className={className} suppressHydrationWarning>
      {timeAgo(date)}
    </time>
  );
}
