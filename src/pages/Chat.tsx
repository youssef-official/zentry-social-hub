import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import TopNav from "@/components/Layout/TopNav";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Chat = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [friend, setFriend] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId } = useParams();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    if (userId) {
      await fetchFriend(userId);
      await findOrCreateConversation(session.user.id, userId);
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

  const findOrCreateConversation = async (userId1: string, userId2: string) => {
    try {
      // Try to find existing conversation
      const { data: existing } = await (supabase as any)
        .from("conversations")
        .select("*")
        .or(`and(participant1_id.eq.${userId1},participant2_id.eq.${userId2}),and(participant1_id.eq.${userId2},participant2_id.eq.${userId1})`)
        .single();

      if (existing) {
        setConversationId(existing.id);
        return;
      }

      // Create new conversation
      const { data: newConv, error } = await (supabase as any)
        .from("conversations")
        .insert({
          participant1_id: userId1,
          participant2_id: userId2,
        })
        .select()
        .single();

      if (error) throw error;
      setConversationId(newConv.id);
    } catch (error: any) {
      console.error("Error finding/creating conversation:", error);
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await (supabase as any)
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
    }
  };

  const subscribeToMessages = () => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !conversationId || !user) return;

    try {
      const { error } = await (supabase as any).from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: message.trim(),
      });

      if (error) throw error;

      setMessage("");
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
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

          <div className="h-[60vh] overflow-y-auto mb-4 p-4 bg-muted/30 rounded-lg space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground">
                لا توجد رسائل بعد. ابدأ المحادثة!
              </p>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        isMe
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {new Date(msg.created_at).toLocaleTimeString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="اكتب رسالة..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Chat;
