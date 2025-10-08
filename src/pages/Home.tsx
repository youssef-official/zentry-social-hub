import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import TopNav from "@/components/Layout/TopNav";
import BottomNav from "@/components/Layout/BottomNav";
import CreatePost from "@/components/Feed/CreatePost";
import PostCard from "@/components/Feed/PostCard";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  };
  likes: { id: string; user_id: string }[];
  comments: { id: string; content: string; user_id: string; profiles: { display_name: string } }[];
}

const Home = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      if (postsData) {
        const postsWithDetails = await Promise.all(
          postsData.map(async (post) => {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("display_name, avatar_url")
              .eq("user_id", post.user_id)
              .single();

            const { data: likesData } = await supabase
              .from("likes")
              .select("id, user_id")
              .eq("post_id", post.id);

            const { data: commentsData } = await supabase
              .from("comments")
              .select("*")
              .eq("post_id", post.id);

            const commentsWithProfiles = await Promise.all(
              (commentsData || []).map(async (comment) => {
                const { data: commentProfile } = await supabase
                  .from("profiles")
                  .select("display_name")
                  .eq("user_id", comment.user_id)
                  .single();

                return {
                  ...comment,
                  profiles: commentProfile || { display_name: "مستخدم" },
                };
              })
            );

            return {
              ...post,
              profiles: profileData || { display_name: "مستخدم", avatar_url: null },
              likes: likesData || [],
              comments: commentsWithProfiles,
            };
          })
        );

        setPosts(postsWithDetails);
      }
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل المنشورات",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted pb-20">
      <TopNav />
      
      <main className="max-w-2xl mx-auto p-4">
        <CreatePost onPostCreated={fetchPosts} userId={user?.id || ""} />
        
        <div className="space-y-4 mt-6">
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUserId={user?.id || ""} 
              onUpdate={fetchPosts}
            />
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Home;
