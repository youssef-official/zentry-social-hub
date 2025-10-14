import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CommentSection from "@/components/Feed/CommentSection";
import VideoPlayer from "@/components/Feed/VideoPlayer";
import VerificationBadge from "@/components/Profile/VerificationBadge";

const Post = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      fetchPost();
    });
  }, [postId, navigate]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
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
        .eq("id", postId)
        .single();

      if (error) throw error;

      // جلب معلومات المستخدم
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, is_verified")
        .eq("user_id", data.user_id)
        .single();

      // جلب معلومات الملفات الشخصية للمعلقين
      const commentsWithProfiles = await Promise.all(
        (data.comments || []).map(async (comment: any) => {
          const { data: commentProfile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url, is_verified")
            .eq("user_id", comment.user_id)
            .single();

          return {
            ...comment,
            profiles: commentProfile
          };
        })
      );

      setPost({
        ...data,
        profiles: profile,
        comments: commentsWithProfiles
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "لم نتمكن من تحميل المنشور",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    const isLiked = post.likes?.some((like: any) => like.user_id === user?.id);

    try {
      if (isLiked) {
        const likeToDelete = post.likes.find((like: any) => like.user_id === user?.id);
        await supabase.from("likes").delete().eq("id", likeToDelete.id);
      } else {
        await supabase.from("likes").insert({
          post_id: post.id,
          user_id: user?.id,
        });
      }
      fetchPost();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `منشور من ${post.profiles?.display_name}`,
          text: post.content,
          url: postUrl,
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(postUrl);
        toast({
          title: "تم النسخ!",
          description: "تم نسخ رابط المنشور",
        });
      } catch (error) {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء نسخ الرابط",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post) return null;

  const isLiked = post.likes?.some((like: any) => like.user_id === user?.id);
  const likesCount = post.likes?.length || 0;
  const commentsCount = post.comments?.length || 0;

  return (
    <div className="min-h-screen bg-muted pb-6">
      <div className="sticky top-0 z-50 bg-background border-b p-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg">المنشور</h1>
        </div>
      </div>

      <main className="max-w-2xl mx-auto p-4">
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Avatar 
                className="h-10 w-10 cursor-pointer"
                onClick={() => navigate(`/profile/${post.user_id}`)}
              >
                <AvatarImage src={post.profiles?.avatar_url || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {post.profiles?.display_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <p 
                    className="font-semibold cursor-pointer hover:underline"
                    onClick={() => navigate(`/profile/${post.user_id}`)}
                  >
                    {post.profiles?.display_name}
                  </p>
                  {post.profiles?.is_verified && (
                    <VerificationBadge isVerified={true} size={18} />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString("ar-EG", {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {post.content && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
            )}

            {post.image_url && (
              <div className="rounded-lg overflow-hidden -mx-6">
                {post.image_url.includes("video") || post.image_url.includes(".mp4") ? (
                  <VideoPlayer src={post.image_url} />
                ) : (
                  <img src={post.image_url} alt="Post media" className="w-full object-cover" />
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
              <span>{likesCount > 0 && `${likesCount} إعجاب`}</span>
              <div className="flex gap-3">
                {commentsCount > 0 && <span>{commentsCount} تعليق</span>}
              </div>
            </div>

            <div className="flex items-center justify-around border-y py-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className="flex-1 hover:bg-muted/50 transition-all duration-300 active:scale-95"
              >
                <Heart className={`h-5 w-5 ml-2 transition-all duration-300 ${isLiked ? "fill-red-500 text-red-500 animate-in zoom-in-50" : "text-muted-foreground"}`} />
                <span className={isLiked ? "text-red-500 font-semibold" : "text-muted-foreground"}>
                  إعجاب
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 hover:bg-muted/50"
              >
                <MessageCircle className="h-5 w-5 ml-2 text-muted-foreground" />
                <span className="text-muted-foreground">تعليق</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="flex-1 hover:bg-muted/50"
              >
                <Share2 className="h-5 w-5 ml-2 text-muted-foreground" />
                <span className="text-muted-foreground">مشاركة</span>
              </Button>
            </div>

            <CommentSection 
              comments={post.comments || []}
              postId={post.id}
              currentUserId={user?.id}
              onUpdate={fetchPost}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Post;
