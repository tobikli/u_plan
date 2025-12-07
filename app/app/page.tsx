import { SkeletonCard } from "@/components/skeleton-card";

export default function Page() {
  const skeletons = Array.from({ length: 1 });

  return (
    <div className="flex flex-1 flex-col m-5">
      <div className="@container/main flex flex-5 flex-col gap-2">
        <div className="grid gap-4 py-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {skeletons.map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}
