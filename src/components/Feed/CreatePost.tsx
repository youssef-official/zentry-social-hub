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
    <Card className="overflow-hidden shadow-sm">
      <CardContent className="p-4">
        <div className="flex gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userProfile?.avatar_url || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userProfile?.display_name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => document.getElementById("post-content")?.focus()}
            className="flex-1 text-right px-4 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors text-muted-foreground"
          >
            بم تفكر؟
          </button>
        </div>

        <div className="space-y-3">
          <Textarea
            id="post-content"
            placeholder="ما الذي تفكر فيه؟"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="resize-none min-h-[80px]"
          />

          <FileUpload onFileUploaded={setImageUrl} currentFile={imageUrl} />
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => document.getElementById("image-upload")?.click()}
            >
              <span className="text-green-500">📷</span>
              <span className="mr-2 text-sm">صورة</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => document.getElementById("video-upload")?.click()}
            >
              <span className="text-red-500">🎥</span>
              <span className="mr-2 text-sm">فيديو</span>
            </Button>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || (!content.trim() && !imageUrl)}
            size="sm"
            className="px-6"
          >
            {loading ? "جاري النشر..." : "نشر"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatePost;
