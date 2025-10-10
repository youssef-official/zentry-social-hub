import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CoverUploadProps {
  currentUrl?: string;
  onUpload: (url: string) => void;
}

const CoverUpload = ({ currentUrl, onUpload }: CoverUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "خطأ",
        description: "يرجى رفع صورة فقط",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الصورة يجب أن يكون أقل من 10 ميجابايت",
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
        .from("covers")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("covers")
        .getPublicUrl(filePath);

      onUpload(data.publicUrl);

      toast({
        title: "تم!",
        description: "تم رفع صورة الغلاف بنجاح",
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

  return (
    <div className="relative h-48 bg-gradient-to-r from-primary to-primary/80 overflow-hidden">
      {currentUrl && (
        <img 
          src={currentUrl} 
          alt="Cover" 
          className="w-full h-full object-cover"
        />
      )}
      
      <Button
        size="icon"
        variant="secondary"
        className="absolute bottom-4 right-4"
        onClick={() => document.getElementById("cover-upload")?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </Button>
      
      <input
        id="cover-upload"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default CoverUpload;
