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
import PostSkeleton from "@/components/Feed/PostSkeleton";
import VerificationBadge from "@/components/Profile/VerificationBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Briefcase, MapPin, Calendar } from "lucide-react";

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
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
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

  const checkFriendship = async (currentUserId: string, profileUserId: string) => {
    const { data } = await supabase
      .from("friendships")
      .select("*")
      .or(`and(user_id.eq.${currentUserId},friend_id.eq.${profileUserId}),and(user_id.eq.${profileUserId},friend_id.eq.${currentUserId})`)
      .maybeSingle();

    if (data) {
      if (data.status === "accepted") {
        setIsFriend(true);
      } else if (data.user_id === currentUserId) {
        setFriendRequestSent(true);
      }
    }
  };

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
          likes (
            id,
            user_id
          ),
          comments (
            id,
            content,
            user_id,
            created_at
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // جلب معلومات الملفات الشخصية
      const postsWithProfiles = await Promise.all(
        (data || []).map(async (post) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url, is_verified")
            .eq("user_id", post.user_id)
            .single();

          // جلب معلومات الملفات الشخصية للمعلقين
          const commentsWithProfiles = await Promise.all(
            (post.comments || []).map(async (comment: any) => {
              const { data: commentProfile } = await supabase
                .from("profiles")
                .select("display_name, avatar_url, is_verified")
                .eq("user_id", comment.user_id)
                .single();

              return {
                ...comment,
                profiles: commentProfile
              };
            })
          );

          return {
            ...post,
            profiles: profile,
            comments: commentsWithProfiles
          };
        })
      );

      setPosts(postsWithProfiles);
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
        
        if (!isOwnProfile) {
          await checkFriendship(currentUserId, data.user_id);
        }
        await fetchUserPosts(data.user_id);
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

  const handleAddFriend = async () => {
    try {
      await supabase.from("friendships").insert({
        user_id: user.id,
        friend_id: profile.user_id,
        status: "pending",
      });

      await (supabase as any).from("notifications").insert({
        user_id: profile.user_id,
        type: "friend_request",
        title: "طلب صداقة جديد",
        message: `${user.email} أرسل لك طلب صداقة`,
      });

      setFriendRequestSent(true);
      toast({
        title: "تم!",
        description: "تم إرسال طلب الصداقة",
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
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold">
                        {profile?.display_name || "مستخدم جديد"}
                      </h1>
                      {profile?.is_verified && (
                        <VerificationBadge isVerified={true} size={20} />
                      )}
                    </div>
                    {isOwnProfile ? (
                      <Button size="sm" onClick={() => setEditing(true)}>
                        <Edit className="h-4 w-4 ml-2" />
                        تعديل
                      </Button>
                    ) : (
                      !isFriend && !friendRequestSent && (
                        <Button size="sm" onClick={handleAddFriend}>
                          <UserPlus className="h-4 w-4 ml-2" />
                          إضافة صديق
                        </Button>
                      )
                    )}
                  </div>
                  <p className="text-muted-foreground mb-4">{profile?.bio || "لم يتم إضافة نبذة بعد"}</p>
                  
                  {/* Details Section */}
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-bold mb-3">Details</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>انضم {new Date(profile?.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "long" })}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="reels">Reels</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4 mt-4">
            {isOwnProfile && (
              <CreatePost 
                onPostCreated={() => fetchUserPosts(user.id)} 
                userId={user.id}
                userProfile={profile}
              />
            )}
            {loading ? (
              <>
                <PostSkeleton />
                <PostSkeleton />
              </>
            ) : posts.length === 0 ? (
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
          </TabsContent>

          <TabsContent value="photos" className="mt-4">
            <div className="grid grid-cols-3 gap-1">
              {posts
                .filter((post) => post.image_url && !post.image_url.includes("video"))
                .map((post) => (
                  <div key={post.id} className="aspect-square overflow-hidden">
                    <img
                      src={post.image_url}
                      alt="Post"
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition"
                    />
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="reels" className="mt-4">
            <div className="grid grid-cols-3 gap-1">
              {posts
                .filter((post) => post.image_url && (post.image_url.includes("video") || post.image_url.includes(".mp4")))
                .map((post) => (
                  <div key={post.id} className="aspect-[9/16] overflow-hidden bg-black relative">
                    <video
                      src={post.image_url}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
