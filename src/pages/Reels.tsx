import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import TopNav from "@/components/Layout/TopNav";
import BottomNav from "@/components/Layout/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Film } from "lucide-react";

const Reels = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopNav />
      
      <main className="max-w-md mx-auto h-[calc(100vh-140px)] flex items-center justify-center p-4">
        <Card className="w-full border-dashed">
          <CardContent className="p-12 text-center">
            <div className="bg-muted/50 rounded-full h-24 w-24 mx-auto mb-6 flex items-center justify-center">
              <Film className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-3">لا توجد ريلز بعد</h2>
            <p className="text-muted-foreground mb-6">
              كن أول من ينشر فيديو قصير! شارك لحظاتك المميزة مع أصدقائك
            </p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">قريباً سيتم إضافة:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>📹 رفع الفيديوهات القصيرة</li>
                <li>🎵 إضافة الموسيقى والمؤثرات</li>
                <li>✨ فلاتر وتأثيرات مميزة</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default Reels;
