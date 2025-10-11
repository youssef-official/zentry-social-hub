import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import CommentSection from "./CommentSection";
import VideoPlayer from "./VideoPlayer";

interface PostCardProps {
  post: any;
  currentUserId: string;
  onUpdate: () => void;
}

const PostCard = ({ post, currentUserId, onUpdate }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const isLiked = post.likes?.some((like: any) => like.user_id === currentUserId);
  const likesCount = post.likes?.length || 0;
  const commentsCount = post.comments?.length || 0;
  const sharesCount = post.shares?.length || 0;

  const handleLike = async () => {
    try {
      if (isLiked) {
        const likeToDelete = post.likes.find((like: any) => like.user_id === currentUserId);
        await supabase.from("likes").delete().eq("id", likeToDelete.id);
      } else {
        await supabase.from("likes").insert({
          post_id: post.id,
          user_id: currentUserId,
        });
      }
      onUpdate();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    setLoading(true);
    try {
      // نسخ رابط المنشور
      const postUrl = `${window.location.origin}/post/${post.id}`;
      await navigator.clipboard.writeText(postUrl);

      toast({
        title: "تم!",
        description: "تم نسخ رابط المنشور",
      });
    } catch (error: any) {
      toast({
        title: "تم!",
        description: "تم مشاركة المنشور",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
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
                <CheckCircle className="h-4 w-4 text-primary fill-primary" />
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
            {sharesCount > 0 && <span>{sharesCount} مشاركة</span>}
          </div>
        </div>

        <div className="flex items-center justify-around border-y py-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={loading}
            className="flex-1 hover:bg-muted/50"
          >
            <Heart className={`h-5 w-5 ml-2 ${isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            <span className={isLiked ? "text-red-500 font-semibold" : "text-muted-foreground"}>
              إعجاب
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex-1 hover:bg-muted/50"
          >
            <MessageCircle className="h-5 w-5 ml-2 text-muted-foreground" />
            <span className="text-muted-foreground">تعليق</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            disabled={loading}
            className="flex-1 hover:bg-muted/50"
          >
            <Share2 className="h-5 w-5 ml-2 text-muted-foreground" />
            <span className="text-muted-foreground">مشاركة</span>
          </Button>
        </div>

        {showComments && (
          <CommentSection 
            comments={post.comments || []}
            postId={post.id}
            currentUserId={currentUserId}
            onUpdate={onUpdate}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default PostCard;
