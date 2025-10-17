"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Heart, MessageCircle, Share2 } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

const VideoPlayer = ({ src, poster, autoPlay = false, muted = false, loop = false }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [progress, setProgress] = useState(0);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    setLikes(prev => (liked ? prev - 1 : prev + 1));
  };

  return (
    <div
      className="relative w-full max-w-sm mx-auto aspect-[9/16] rounded-xl overflow-hidden bg-black shadow-lg group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* الفيديو */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline
        onClick={togglePlay}
        className="w-full h-full object-cover cursor-pointer"
      />

      {/* الكنترولز السفلي */}
      <div className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div 
          className="h-1 bg-white/30 rounded-full cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleProgressClick(e);
          }}
        >
          <div 
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="text-white hover:text-primary transition-colors"
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className="text-white hover:text-primary transition-colors"
            >
              {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </button>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="text-white hover:text-primary transition-colors"
          >
            <Maximize className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* أزرار اللايك والكومنت والشير (يمين الشاشة) */}
      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5 text-white">
        <button onClick={handleLike} className={`p-2 rounded-full ${liked ? 'bg-red-600/70' : 'bg-black/50'} hover:bg-red-600/90 transition`}>
          <Heart className={`h-7 w-7 ${liked ? 'fill-red-600 text-red-600' : ''}`} />
        </button>
        <span className="text-sm">{likes}</span>

        <button onClick={() => setComments(prev => prev + 1)} className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition">
          <MessageCircle className="h-7 w-7" />
        </button>
        <span className="text-sm">{comments}</span>

        <button className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition">
          <Share2 className="h-7 w-7" />
        </button>
      </div>
    </div>
  );
};

export default VideoPlayer;
