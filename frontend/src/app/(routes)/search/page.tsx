import ExploreFeed from "@/components/ExploreFeed";

export default function SearchPage({
  searchParams,
}: {
  searchParams?: { query?: string };
}) {
  const query = searchParams?.query || '';
  return <ExploreFeed defaultQuery={query} />;
}