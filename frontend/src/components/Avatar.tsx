import { getMediaUrl } from "@/lib/api/client";

export default function Avatar({
  src,
}: {
  src?: string | null;
}) {
  return (
    <div className="size-16 aspect-square overflow-hidden rounded-full bg-gradient-to-tr from-ig-orange to-ig-red p-0.5">
      <img
        className="w-full h-full object-cover rounded-full bg-white dark:bg-black"
        src={getMediaUrl(src)}
        alt="Avatar"
      />
    </div>
  );
}