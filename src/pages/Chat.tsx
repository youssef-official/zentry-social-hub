import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import TopNav from "@/components/Layout/TopNav";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Chat = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [friend, setFriend] = useState<any>(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId } = useParams();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    if (userId) {
      fetchFriend(userId);
    }
    setLoading(false);
  };

  const fetchFriend = async (friendId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", friendId)
        .single();

      if (error) throw error;
      setFriend(data);
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
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <main className="max-w-4xl mx-auto p-4">
        <Card className="p-4">
          {friend && (
            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
              <Avatar className="h-12 w-12">
                <AvatarImage src={friend.avatar_url} />
                <AvatarFallback>{friend.display_name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">{friend.display_name}</h2>
                <p className="text-sm text-muted-foreground">نشط الآن</p>
              </div>
            </div>
          )}

          <div className="h-[60vh] overflow-y-auto mb-4 p-4 bg-muted/30 rounded-lg">
            <p className="text-center text-muted-foreground">
              قريباً... سيتم إضافة نظام الرسائل هنا
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="اكتب رسالة..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
            />
            <Button>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Chat;
