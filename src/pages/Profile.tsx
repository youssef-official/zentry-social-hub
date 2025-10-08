import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import TopNav from "@/components/Layout/TopNav";
import BottomNav from "@/components/Layout/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    });
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name);
        setBio(data.bio || "");
      }
      setLoading(false);
    } catch (error: any) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (profile) {
        const { error } = await supabase
          .from("profiles")
          .update({ display_name: displayName, bio })
          .eq("id", profile.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("profiles")
          .insert({ user_id: user.id, display_name: displayName, bio });

        if (error) throw error;
      }

      toast({
        title: "تم الحفظ!",
        description: "تم تحديث معلومات الملف الشخصي",
      });
      setEditing(false);
      fetchProfile(user.id);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted pb-20">
      <TopNav />
      
      <main className="max-w-4xl mx-auto p-4">
        <Card>
          <div className="h-48 bg-gradient-to-r from-primary to-primary/80 relative">
            <Button size="icon" variant="secondary" className="absolute bottom-4 right-4">
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          
          <CardContent className="relative">
            <Avatar className="h-32 w-32 -mt-16 border-4 border-background">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="text-3xl">
                {displayName?.[0] || user?.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="mt-4">
              {editing ? (
                <div className="space-y-4 max-w-md">
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="الاسم الكامل"
                  />
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="نبذة عنك..."
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSave}>حفظ</Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      إلغاء
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl font-bold">
                      {profile?.display_name || "مستخدم جديد"}
                    </h1>
                    <Button size="sm" onClick={() => setEditing(true)}>
                      <Edit className="h-4 w-4 ml-2" />
                      تعديل
                    </Button>
                  </div>
                  <p className="text-muted-foreground">{profile?.bio || "لم يتم إضافة نبذة بعد"}</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
