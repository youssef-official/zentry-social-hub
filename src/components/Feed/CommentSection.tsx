import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
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
    <div className="mt-4 space-y-3">
      {comments.map((comment) => (
        <div key={comment.id} className="space-y-2">
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.profiles?.avatar_url || ""} />
                <AvatarFallback>{comment.profiles?.display_name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p 
                  className="font-semibold text-sm cursor-pointer hover:underline"
                  onClick={() => navigate(`/profile/${comment.user_id}`)}
                >
                  {comment.profiles?.display_name}
                </p>
                <p className="text-sm mt-1">{comment.content}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-auto p-0 text-xs"
                  onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                >
                  <MessageCircle className="h-3 w-3 ml-1" />
                  رد
                </Button>
              </div>
            </div>
          </div>

          {comment.replies && comment.replies.length > 0 && (
            <div className="mr-8 space-y-2">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="bg-muted/30 p-2 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={reply.profiles?.avatar_url || ""} />
                      <AvatarFallback>{reply.profiles?.display_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p 
                        className="font-semibold text-xs cursor-pointer hover:underline"
                        onClick={() => navigate(`/profile/${reply.user_id}`)}
                      >
                        {reply.profiles?.display_name}
                      </p>
                      <p className="text-xs mt-1">{reply.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {replyTo === comment.id && (
            <div className="mr-8 flex gap-2">
              <Textarea
                placeholder="اكتب رداً..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={2}
                className="flex-1 text-sm"
              />
              <div className="flex flex-col gap-1">
                <Button 
                  onClick={() => handleAddReply(comment.id)} 
                  disabled={loading}
                  size="sm"
                >
                  رد
                </Button>
                <Button 
                  onClick={() => setReplyTo(null)} 
                  variant="outline"
                  size="sm"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-2 pt-2">
        <Textarea
          placeholder="اكتب تعليقاً..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={2}
          className="flex-1"
        />
        <Button onClick={handleAddComment} disabled={loading}>
          إرسال
        </Button>
      </div>
    </div>
  );
};

export default CommentSection;
