import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Story {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  expires_at: string;
  profiles: {
    display_name: string;
    avatar_url?: string;
  };
}

interface StoriesCarouselProps {
  currentUserId: string;
  onCreateStory?: () => void;
}

const StoriesCarousel = ({ currentUserId, onCreateStory }: StoriesCarouselProps) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(s => s.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);

        const storiesWithProfiles = data.map(story => ({
          ...story,
          profiles: profilesData?.find(p => p.user_id === story.user_id) || {
            display_name: "مستخدم",
            avatar_url: undefined
          }
        }));

        setStories(storiesWithProfiles as Story[]);
      } else {
        setStories([]);
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasCurrentUserStory = stories.some(s => s.user_id === currentUserId);

  return (
    <>
      <div className="bg-card border-b border-border overflow-x-auto">
        <div className="flex gap-3 p-4 max-w-screen-xl mx-auto">
          {/* Create Story Button */}
          <div
            onClick={onCreateStory}
            className="flex-shrink-0 cursor-pointer group"
          >
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-background">
                <AvatarImage src={stories.find(s => s.user_id === currentUserId)?.profiles?.avatar_url} />
                <AvatarFallback className="bg-muted">أنا</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center border-4 border-background">
                <Plus className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <p className="text-xs text-center mt-2 font-medium">إنشاء قصة</p>
          </div>

          {/* Stories */}
          {stories.map((story) => (
            <div
              key={story.id}
              onClick={() => setSelectedStory(story)}
              className="flex-shrink-0 cursor-pointer group"
            >
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-primary via-accent to-primary p-[3px]">
                  <Avatar className="h-full w-full border-4 border-background">
                    <AvatarImage src={story.profiles?.avatar_url} />
                    <AvatarFallback className="bg-muted">
                      {story.profiles?.display_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <p className="text-xs text-center mt-2 font-medium truncate w-20">
                {story.profiles?.display_name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Story Viewer Dialog */}
      <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
        <DialogContent className="max-w-md p-0 bg-black border-none">
          {selectedStory && (
            <div className="relative h-[80vh]">
              <button
                onClick={() => setSelectedStory(null)}
                className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-black/50 flex items-center justify-center text-white"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <Avatar className="h-10 w-10 border-2 border-white">
                  <AvatarImage src={selectedStory.profiles?.avatar_url} />
                  <AvatarFallback>
                    {selectedStory.profiles?.display_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-white">
                  <p className="font-semibold text-sm">{selectedStory.profiles?.display_name}</p>
                  <p className="text-xs opacity-75">
                    {new Date(selectedStory.created_at).toLocaleDateString("ar-EG")}
                  </p>
                </div>
              </div>

              <img
                src={selectedStory.image_url}
                alt="Story"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StoriesCarousel;
