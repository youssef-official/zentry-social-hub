import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const PostSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </Card>
  );
};

export default PostSkeleton;
