import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import TopNav from "@/components/Layout/TopNav";
import BottomNav from "@/components/Layout/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

const Messages = () => {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      await fetchConversations(session.user.id);
      setLoading(false);
    };

    init();
  }, [navigate]);

  const fetchConversations = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from("conversations")
        .select(`
          *,
          messages (
            content,
            created_at
          )
        `)
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      
      // Get profile info for each conversation
      const conversationsWithProfiles = await Promise.all(
        (data || []).map(async (conv) => {
          const otherUserId = conv.participant1_id === userId ? conv.participant2_id : conv.participant1_id;
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("user_id", otherUserId)
            .single();
          
          return {
            ...conv,
            otherUser: profile,
            lastMessage: conv.messages?.[0],
          };
        })
      );

      setConversations(conversationsWithProfiles);
    } catch (error: any) {
      console.error(error);
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
      
      <main className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">الرسائل</h1>
        
        {conversations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">لا توجد محادثات بعد</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Card
                key={conv.id}
                className="cursor-pointer hover:bg-accent transition"
                onClick={() => navigate(`/chat/${conv.participant1_id === user.id ? conv.participant2_id : conv.participant1_id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                      {conv.otherUser?.display_name?.[0] || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{conv.otherUser?.display_name || "مستخدم"}</p>
                      {conv.lastMessage && (
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage.content}
                        </p>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(conv.lastMessage.created_at).toLocaleDateString("ar-EG")}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Messages;
