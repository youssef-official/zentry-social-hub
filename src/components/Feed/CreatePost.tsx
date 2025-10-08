import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, Smile } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreatePostProps {
  onPostCreated: () => void;
  userId: string;
}

const CreatePost = ({ onPostCreated, userId }: CreatePostProps) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى كتابة محتوى المنشور",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("posts")
        .insert({
          content,
          user_id: userId,
        });

      if (error) throw error;

      setContent("");
      toast({
        title: "تم النشر!",
        description: "تم نشر منشورك بنجاح",
      });
      onPostCreated();
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
      <CardContent className="p-4">
        <Textarea
          placeholder="ماذا يدور في ذهنك؟"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mb-4 resize-none"
          rows={3}
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Image className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Smile className="h-5 w-5" />
            </Button>
          </div>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "جاري النشر..." : "نشر"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatePost;
