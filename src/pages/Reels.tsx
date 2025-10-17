import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import VerificationBadge from "@/components/Profile/VerificationBadge";
import VideoPlayer from "@/components/Feed/VideoPlayer";

const Reels = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

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
          likes ( id, user_id ),
          comments ( id )
        `)
        .not("image_url", "is", null)
        .or("image_url.ilike.%video%,image_url.ilike.%.mp4")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const postsWithProfiles = await Promise.all(
        (data || []).map(async (post) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url, is_verified")
            .eq("user_id", post.user_id)
            .single();

          return { ...post, profiles: profile };
        })
      );

      setVideos(postsWithProfiles);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  // ⚡ لايك لحظي بدون ريفريش
  const handleLike = async (videoId: string) => {
    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          const isLiked = v.likes?.some((like: any) => like.user_id === user?.id);
          if (isLiked) {
            return { ...v, likes: v.likes.filter((l: any) => l.user_id !== user?.id) };
          } else {
            return { ...v, likes: [...v.likes, { id: Date.now(), user_id: user?.id }] };
          }
        }
        return v;
      })
    );

    const video = videos.find((v) => v.id === videoId);
    const isLiked = video?.likes?.some((like: any) => like.user_id === user?.id);
    try {
      if (isLiked) {
        const likeToDelete = video.likes.find((like: any) => like.user_id === user?.id);
        await supabase.from("likes").delete().eq("id", likeToDelete.id);
      } else {
        await supabase.from("likes").insert({
          post_id: videoId,
          user_id: user?.id,
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <h1 className="text-white font-bold text-xl">Reels</h1>
      </div>

      <main
        ref={containerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {videos.length === 0 ? (
          <div className="h-screen flex items-center justify-center text-white">
            <div className="text-center">
              <p className="text-lg mb-2">لا توجد فيديوهات بعد</p>
              <p className="text-sm text-white/60">كن أول من ينشر فيديو!</p>
            </div>
          </div>
        ) : (
          videos.map((video, index) => {
            const isLiked = video.likes?.some((like: any) => like.user_id === user?.id);
            const likesCount = video.likes?.length || 0;
            const commentsCount = video.comments?.length || 0;

            return (
              <div
                key={video.id}
                className="h-screen w-full snap-start relative bg-black flex justify-center items-center"
              >
                {/* 🎥 مشغل الفيديو */}
                <VideoPlayer
                  src={video.image_url}
                  autoPlay
                  loop
                  muted
                  index={index}
                  containerRef={containerRef}
                />

                {/* 👤 معلومات المستخدم */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-start gap-3">
                    <Avatar
                      className="h-10 w-10 cursor-pointer border-2 border-white"
                      onClick={() => navigate(`/profile/${video.user_id}`)}
                    >
                      <AvatarImage src={video.profiles?.avatar_url} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {video.profiles?.display_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        <p
                          className="font-semibold text-white cursor-pointer"
                          onClick={() => navigate(`/profile/${video.user_id}`)}
                        >
                          {video.profiles?.display_name}
                        </p>
                        {video.profiles?.is_verified && (
                          <VerificationBadge isVerified={true} size={18} />
                        )}
                      </div>
                      {video.content && (
                        <p className="text-white text-sm">{video.content}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ❤️ أزرار لايك وكومنت وشير */}
                <div className="absolute right-4 bottom-24 flex flex-col gap-4">
                  <button
                    onClick={() => handleLike(video.id)}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="bg-white/10 hover:bg-white/20 transition rounded-full p-2">
                      <Heart
                        className={`h-6 w-6 ${
                          isLiked ? "fill-red-500 text-red-500" : "text-white"
                        }`}
                      />
                    </div>
                    <span className="text-white text-xs font-semibold">
                      {likesCount}
                    </span>
                  </button>

                  <button
                    onClick={() => navigate(`/post/${video.id}`)}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="bg-white/10 hover:bg-white/20 transition rounded-full p-2">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-white text-xs font-semibold">
                      {commentsCount}
                    </span>
                  </button>

                  <button
                    onClick={async () => {
                      if (navigator.share) {
                        await navigator.share({
                          title: `فيديو من ${video.profiles?.display_name}`,
                          url: `${window.location.origin}/post/${video.id}`,
                        });
                      }
                    }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="bg-white/10 hover:bg-white/20 transition rounded-full p-2">
                      <Share2 className="h-6 w-6 text-white" />
                    </div>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};

export default Reels;
