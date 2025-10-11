import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import TopNav from "@/components/Layout/TopNav";
import BottomNav from "@/components/Layout/BottomNav";
import PostCard from "@/components/Feed/PostCard";
import { Card, CardContent } from "@/components/ui/card";
import { Film } from "lucide-react";

const Reels = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      fetchVideos();
    });
  }, [navigate]);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles!posts_user_id_fkey (
            display_name,
            avatar_url,
            is_verified
          ),
          likes (
            id,
            user_id
          ),
          comments (
            id,
            content,
            user_id,
            created_at
          )
        `)
        .not("image_url", "is", null)
        .or("image_url.ilike.%video%,image_url.ilike.%.mp4")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopNav />
      
      {videos.length === 0 ? (
        <main className="max-w-md mx-auto h-[calc(100vh-140px)] flex items-center justify-center p-4">
          <Card className="w-full border-dashed">
            <CardContent className="p-12 text-center">
              <div className="bg-muted/50 rounded-full h-24 w-24 mx-auto mb-6 flex items-center justify-center">
                <Film className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-3">لا توجد ريلز بعد</h2>
              <p className="text-muted-foreground mb-6">
                كن أول من ينشر فيديو! شارك لحظاتك المميزة مع أصدقائك
              </p>
            </CardContent>
          </Card>
        </main>
      ) : (
        <main className="max-w-2xl mx-auto p-4 space-y-6">
          <h1 className="text-2xl font-bold mb-4">الريلز</h1>
          {videos.map((video) => (
            <PostCard
              key={video.id}
              post={video}
              currentUserId={user?.id}
              onUpdate={fetchVideos}
            />
          ))}
        </main>
      )}

      <BottomNav />
    </div>
  );
};

export default Reels;
