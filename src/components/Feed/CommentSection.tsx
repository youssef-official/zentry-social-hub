import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import VerificationBadge from "@/components/Profile/VerificationBadge";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at?: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
    is_verified?: boolean;
  };
  replies?: Reply[];
}

interface Reply {
  id: string;
  content: string;
  user_id: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
    is_verified?: boolean;
  };
}

interface CommentSectionProps {
  comments: Comment[];
  postId: string;
  currentUserId: string;
  onUpdate: () => void;
}

const CommentSection = ({ comments, postId, currentUserId, onUpdate }: CommentSectionProps) => {
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await supabase.from("comments").insert({
        post_id: postId,
        user_id: currentUserId,
        content: newComment,
      });

      setNewComment("");
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

  const handleAddReply = async (commentId: string) => {
    if (!replyContent.trim()) return;

    setLoading(true);
    try {
      // مؤقتاً سيتم إضافة الرد ككومنت عادي حتى يتم إنشاء جدول الردود
      await supabase.from("comments").insert({
        post_id: postId,
        user_id: currentUserId,
        content: `↪️ ${replyContent}`,
      });

      setReplyContent("");
      setReplyTo(null);
      toast({
        title: "تم!",
        description: "تم إضافة ردك",
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
    <div className="space-y-3 pt-3">
      {comments.map((comment) => (
        <div key={comment.id} className="space-y-2">
          <div className="flex gap-2 items-start">
            <Avatar 
              className="h-8 w-8 cursor-pointer"
              onClick={() => navigate(`/profile/${comment.user_id}`)}
            >
              <AvatarImage src={comment.profiles?.avatar_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {comment.profiles?.display_name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="bg-muted rounded-2xl px-3 py-2">
                <div className="flex items-center gap-1">
                  <p 
                    className="font-semibold text-sm cursor-pointer hover:underline"
                    onClick={() => navigate(`/profile/${comment.user_id}`)}
                  >
                    {comment.profiles?.display_name}
                  </p>
                  {comment.profiles?.is_verified && (
                    <VerificationBadge isVerified={true} size={14} />
                  )}
                </div>
                <p className="text-sm leading-relaxed">{comment.content}</p>
              </div>
              <div className="flex gap-3 px-3 mt-1">
                <button className="text-xs text-muted-foreground hover:underline font-semibold">
                  إعجاب
                </button>
                <button 
                  className="text-xs text-muted-foreground hover:underline font-semibold"
                  onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                >
                  رد
                </button>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.created_at).toLocaleDateString("ar-EG")}
                </span>
              </div>
            </div>
          </div>

          {comment.replies && comment.replies.length > 0 && (
            <div className="mr-10 space-y-2">
              {comment.replies.map((reply: Reply) => (
                <div key={reply.id} className="flex gap-2 items-start">
                  <Avatar 
                    className="h-7 w-7 cursor-pointer"
                    onClick={() => navigate(`/profile/${reply.user_id}`)}
                  >
                    <AvatarImage src={reply.profiles?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {reply.profiles?.display_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-muted rounded-2xl px-3 py-2">
                      <p 
                        className="font-semibold text-xs cursor-pointer hover:underline"
                        onClick={() => navigate(`/profile/${reply.user_id}`)}
                      >
                        {reply.profiles?.display_name}
                      </p>
                      <p className="text-xs">{reply.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {replyTo === comment.id && (
            <div className="mr-10 flex gap-2 items-center">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">أنت</AvatarFallback>
              </Avatar>
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="اكتب رداً..."
                className="flex-1 px-4 py-2 rounded-full bg-muted text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                onKeyPress={(e) => e.key === "Enter" && handleAddReply(comment.id)}
              />
              <Button
                size="sm"
                onClick={() => handleAddReply(comment.id)}
                disabled={loading || !replyContent.trim()}
                className="rounded-full"
              >
                إرسال
              </Button>
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-2 items-center pt-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">أنت</AvatarFallback>
        </Avatar>
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="اكتب تعليقاً..."
          className="flex-1 px-4 py-2 rounded-full bg-muted text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
        />
        <Button
          size="sm"
          onClick={handleAddComment}
          disabled={loading || !newComment.trim()}
          className="rounded-full px-4"
        >
          إرسال
        </Button>
      </div>
    </div>
  );
};

export default CommentSection;
