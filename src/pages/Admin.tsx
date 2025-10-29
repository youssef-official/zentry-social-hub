import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import TopNav from "@/components/Layout/TopNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roles) {
        toast({
          title: "غير مصرح",
          description: "ليس لديك صلاحيات الوصول لهذه الصفحة",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      fetchAllUsers();
    } catch (error: any) {
      console.error(error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleVerifyUser = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from("profiles")
        .update({ is_verified: !currentStatus })
        .eq("user_id", userId);

      if (error) throw error;

      // إرسال إشعار للمستخدم
      if (!currentStatus) {
        await (supabase as any).from("notifications").insert({
          user_id: userId,
          type: "verification",
          title: "تم توثيق حسابك",
          message: "تم توثيق حسابك بنجاح! استمتع بالتوثيق والمزايا الحصرية مع تحيات فريق Cura Social",
        });
      }

      toast({
        title: !currentStatus ? "تم التوثيق!" : "تم إلغاء التوثيق",
        description: !currentStatus ? "تم توثيق الحساب بنجاح" : "تم إلغاء توثيق الحساب",
      });

      fetchAllUsers();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const searchUserByEmail = async () => {
    if (!searchEmail.trim()) {
      fetchAllUsers();
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("user_id", `%${searchEmail}%`);

      if (error) throw error;
      setUsers(data || []);
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

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-muted pb-20">
      <TopNav />
      
      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              لوحة التحكم - المشرف
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="ابحث بالبريد الإلكتروني..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUserByEmail()}
              />
              <Button onClick={searchUserByEmail}>بحث</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المستخدمين ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>{user.display_name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{user.display_name}</p>
                        {user.is_verified && (
                          <CheckCircle2 className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.user_id}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleVerifyUser(user.user_id, user.is_verified)}
                    variant={user.is_verified ? "outline" : "default"}
                  >
                    {user.is_verified ? "إلغاء التوثيق" : "توثيق الحساب"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
