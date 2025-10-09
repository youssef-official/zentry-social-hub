import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "./FileUpload";

interface CreatePostProps {
  onPostCreated: () => void;
  userId: string;
  userProfile?: any;
}

const CreatePost = ({ onPostCreated, userId, userProfile }: CreatePostProps) => {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
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
          image_url: imageUrl || null,
        });

      if (error) throw error;

      setContent("");
      setImageUrl("");
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
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex gap-3 items-start mb-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userProfile?.avatar_url || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userProfile?.display_name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="ما الذي تفكر فيه؟"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none border-none focus-visible:ring-0 p-0 min-h-[60px]"
            />
          </div>
        </div>

        <FileUpload onFileUploaded={setImageUrl} currentFile={imageUrl} />

        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <div className="text-sm text-muted-foreground">
            {content.length > 0 && `${content.length} حرف`}
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || (!content.trim() && !imageUrl)}
            size="sm"
          >
            {loading ? "جاري النشر..." : "نشر"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatePost;
