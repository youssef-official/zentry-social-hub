import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import TopNav from "@/components/Layout/TopNav";
import BottomNav from "@/components/Layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Friends = () => {
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchFriends(session.user.id);
        fetchRequests(session.user.id);
      }
      setLoading(false);
    });
  }, [navigate]);

  const fetchFriends = async (userId: string) => {
    const { data } = await supabase
      .from("friendships")
      .select("*, profiles!friendships_friend_id_fkey(display_name, avatar_url)")
      .eq("user_id", userId)
      .eq("status", "accepted");
    
    setFriends(data || []);
  };

  const fetchRequests = async (userId: string) => {
    const { data } = await supabase
      .from("friendships")
      .select("*, profiles!friendships_user_id_fkey(display_name, avatar_url)")
      .eq("friend_id", userId)
      .eq("status", "pending");
    
    setRequests(data || []);
  };

  const handleAccept = async (requestId: string) => {
    try {
      await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", requestId);

      toast({ title: "تم قبول الطلب!" });
      fetchFriends(user.id);
      fetchRequests(user.id);
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
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
      
      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {requests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>طلبات الصداقة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={request.profiles?.avatar_url} />
                      <AvatarFallback>{request.profiles?.display_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold">{request.profiles?.display_name}</span>
                  </div>
                  <Button size="sm" onClick={() => handleAccept(request.id)}>
                    قبول
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>الأصدقاء</CardTitle>
          </CardHeader>
          <CardContent>
            {friends.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">لا يوجد أصدقاء بعد</p>
              </div>
            ) : (
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => navigate(`/profile/${friend.friend_id}`)}
                    >
                      <Avatar>
                        <AvatarImage src={friend.profiles?.avatar_url} />
                        <AvatarFallback>{friend.profiles?.display_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold">{friend.profiles?.display_name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/chat/${friend.friend_id}`)}
                    >
                      مراسلة
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
};

export default Friends;
