import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import CommentSection from "./CommentSection";

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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar 
            className="cursor-pointer"
            onClick={() => navigate(`/profile/${post.user_id}`)}
          >
            <AvatarImage src={post.profiles?.avatar_url || ""} />
            <AvatarFallback>{post.profiles?.display_name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <p 
              className="font-semibold cursor-pointer hover:underline"
              onClick={() => navigate(`/profile/${post.user_id}`)}
            >
              {post.profiles?.display_name}
            </p>
            <p className="text-sm text-muted-foreground">
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
      <CardContent>
        <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
        {post.image_url && (
          <img
            src={post.image_url}
            alt="Post"
            className="w-full rounded-lg mb-4"
          />
        )}

        <div className="flex items-center gap-4 py-3 border-y">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className="flex-1"
          >
            <Heart className={`h-5 w-5 ml-2 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            {likesCount > 0 && likesCount}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex-1"
          >
            <MessageCircle className="h-5 w-5 ml-2" />
            {commentsCount > 0 && commentsCount}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1"
            onClick={handleShare}
            disabled={loading}
          >
            <Share2 className="h-5 w-5 ml-2" />
            {sharesCount > 0 && sharesCount}
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
