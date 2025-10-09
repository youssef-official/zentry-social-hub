import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Image, Video, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileUploaded: (url: string) => void;
  currentFile?: string;
}

const FileUpload = ({ onFileUploaded, currentFile }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentFile || "");
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast({
        title: "خطأ",
        description: "يرجى رفع صورة أو فيديو فقط",
        variant: "destructive",
      });
      return;
    }

    // التحقق من حجم الملف (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الملف يجب أن يكون أقل من 50 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("post-media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("post-media")
        .getPublicUrl(filePath);

      setPreview(data.publicUrl);
      onFileUploaded(data.publicUrl);

      toast({
        title: "تم!",
        description: "تم رفع الملف بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setPreview("");
    onFileUploaded("");
  };

  return (
    <div className="space-y-2">
      {!preview && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={uploading}
            onClick={() => document.getElementById("image-upload")?.click()}
          >
            <Image className="h-5 w-5 ml-2" />
            صورة
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={uploading}
            onClick={() => document.getElementById("video-upload")?.click()}
          >
            <Video className="h-5 w-5 ml-2" />
            فيديو
          </Button>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            id="video-upload"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {uploading && (
        <div className="text-sm text-muted-foreground">جاري الرفع...</div>
      )}

      {preview && (
        <div className="relative">
          {preview.includes("video") || preview.includes(".mp4") ? (
            <video src={preview} controls className="w-full rounded-lg max-h-96" />
          ) : (
            <img src={preview} alt="Preview" className="w-full rounded-lg max-h-96 object-cover" />
          )}
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2"
            onClick={removeFile}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
