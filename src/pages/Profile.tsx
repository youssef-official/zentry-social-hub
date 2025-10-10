import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import TopNav from "@/components/Layout/TopNav";
import BottomNav from "@/components/Layout/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AvatarUpload from "@/components/Profile/AvatarUpload";
import CoverUpload from "@/components/Profile/CoverUpload";
import PostCard from "@/components/Feed/PostCard";
import CreatePost from "@/components/Feed/CreatePost";

const Profile = () => {
  const { username } = useParams();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        if (username) {
          fetchProfileByUsername(username, session.user.id);
        } else {
          setIsOwnProfile(true);
          fetchProfile(session.user.id);
        }
      }
    });
  }, [navigate, username]);

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
      
      await fetchUserPosts(userId);
      setLoading(false);
    } catch (error: any) {
      console.error(error);
      setLoading(false);
    }
  };

  const fetchUserPosts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles:user_id (display_name, avatar_url),
          likes (*),
          comments (
            *,
            profiles:user_id (display_name, avatar_url)
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      console.error(error);
    }
  };

  const fetchProfileByUsername = async (username: string, currentUserId: string) => {
    try {
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", username)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name);
        setBio(data.bio || "");
        setIsOwnProfile(data.user_id === currentUserId);
      } else {
        throw new Error("لم يتم العثور على المستخدم");
      }
      setLoading(false);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "خطأ",
        description: "لم يتم العثور على هذا المستخدم",
        variant: "destructive",
      });
      navigate("/");
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

  const handleAvatarUpload = async (url: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile({ ...profile, avatar_url: url });
      toast({
        title: "تم!",
        description: "تم تحديث صورة الملف الشخصي",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCoverUpload = async (url: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ cover_url: url })
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile({ ...profile, cover_url: url });
      toast({
        title: "تم!",
        description: "تم تحديث صورة الغلاف",
      });
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
      
      <main className="max-w-4xl mx-auto p-4 space-y-4">
        <Card>
          {isOwnProfile ? (
            <CoverUpload 
              currentUrl={profile?.cover_url}
              onUpload={handleCoverUpload}
            />
          ) : (
            <div className="h-48 bg-gradient-to-r from-primary to-primary/80 overflow-hidden">
              {profile?.cover_url && (
                <img 
                  src={profile.cover_url} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          )}
          
          <CardContent className="relative">
            <div className="-mt-16 mb-4">
              {isOwnProfile ? (
                <AvatarUpload
                  currentUrl={profile?.avatar_url}
                  onUpload={handleAvatarUpload}
                  fallback={displayName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                />
              ) : (
                <div className="h-32 w-32 border-4 border-background rounded-full overflow-hidden bg-primary">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl text-primary-foreground">
                      {displayName?.[0] || "U"}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4">
              {editing && isOwnProfile ? (
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
                    {isOwnProfile && (
                      <Button size="sm" onClick={() => setEditing(true)}>
                        <Edit className="h-4 w-4 ml-2" />
                        تعديل
                      </Button>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-4">{profile?.bio || "لم يتم إضافة نبذة بعد"}</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {isOwnProfile && (
          <CreatePost 
            onPostCreated={() => fetchUserPosts(user.id)} 
            userId={user.id}
            userProfile={profile}
          />
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-bold px-2">المنشورات</h2>
          {posts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">لا توجد منشورات بعد</p>
            </Card>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.id}
                onUpdate={() => fetchUserPosts(profile.user_id)}
              />
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
