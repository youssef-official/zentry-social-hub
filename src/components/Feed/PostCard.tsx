import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PostCardProps {
  post: any;
  currentUserId: string;
  onUpdate: () => void;
}

const PostCard = ({ post, currentUserId, onUpdate }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isLiked = post.likes?.some((like: any) => like.user_id === currentUserId);
  const likesCount = post.likes?.length || 0;
  const commentsCount = post.comments?.length || 0;

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

  const handleComment = async () => {
    if (!comment.trim()) return;

    setLoading(true);
    try {
      await supabase.from("comments").insert({
        post_id: post.id,
        user_id: currentUserId,
        content: comment,
      });

      setComment("");
      toast({
        title: "تم!",
        description: "تم إضافة تعليقك",
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={post.profiles?.avatar_url || ""} />
            <AvatarFallback>{post.profiles?.display_name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{post.profiles?.display_name}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(post.created_at).toLocaleDateString("ar-EG")}
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
          <Button variant="ghost" size="sm" className="flex-1">
            <Share2 className="h-5 w-5 ml-2" />
          </Button>
        </div>

        {showComments && (
          <div className="mt-4 space-y-3">
            {post.comments?.map((c: any) => (
              <div key={c.id} className="bg-muted p-3 rounded-lg">
                <p className="font-semibold text-sm">{c.profiles?.display_name}</p>
                <p className="text-sm">{c.content}</p>
              </div>
            ))}
            <div className="flex gap-2">
              <Textarea
                placeholder="اكتب تعليقاً..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button onClick={handleComment} disabled={loading}>
                إرسال
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PostCard;
