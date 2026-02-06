import { useEffect, useRef, useState } from 'react';

// Helper function to extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

// Load YouTube IFrame API script
const loadYouTubeAPI = () => {
  return new Promise((resolve, reject) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }
    
    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      reject(new Error('YouTube API loading timeout'));
    }, 10000);
    
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout);
      resolve();
    };
    
    tag.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to load YouTube API'));
    };
  });
};

// Helper function to resolve thumbnail URL
// Thumbnails are stored as Base64 data URLs directly in Firestore
const resolveThumbnailUrl = (thumbnailUrl) => {
  if (!thumbnailUrl) return null;
  
  // Base64 data URLs (data:image/...) are used directly
  // Also support http/https URLs for backward compatibility
  return thumbnailUrl;
};

export const VideoPlayer = ({ bunnyEmbedUrl, youtubeUrl, thumbnailUrl, onVideoComplete, videoCompleted }) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);
  const [brandingOverlayVisible, setBrandingOverlayVisible] = useState(true);

  const videoUrl = youtubeUrl || bunnyEmbedUrl;
  const youtubeVideoId = getYouTubeVideoId(videoUrl);
  const isYouTube = !!youtubeVideoId;
  
  // Thumbnail URL is Base64 string stored directly in Firestore (no conversion needed)
  const resolvedThumbnailUrl = thumbnailUrl;

  useEffect(() => {
    if (!isYouTube || !youtubeVideoId) {
      setIsLoading(false);
      return;
    }

    const initPlayer = async () => {
      try {
        await loadYouTubeAPI();
        
        if (!containerRef.current) {
          console.error('Container ref not available');
          setIsLoading(false);
          return;
        }

        // Ensure container is ready
        if (!window.YT || !window.YT.Player) {
          console.error('YouTube API not available');
          setIsLoading(false);
          return;
        }

        try {
          playerRef.current = new window.YT.Player(containerRef.current, {
              videoId: youtubeVideoId,
              playerVars: {
                controls: 0,           // Hide YouTube controls
                modestbranding: 1,     // Minimal branding
                rel: 0,                // No related videos
                showinfo: 0,           // Hide video info (deprecated but may help)
                iv_load_policy: 3,     // Hide annotations
                fs: 0,                 // Hide fullscreen button
                disablekb: 1,          // Disable keyboard controls
                playsinline: 1,        // Play inline on mobile
                cc_load_policy: 0,     // Hide captions by default
                autohide: 1,           // Auto-hide controls
                enablejsapi: 1,        // Enable JS API
                origin: window.location.origin,
                widget_referrer: window.location.origin
              },
              events: {
                onReady: (event) => {
                  setPlayerReady(true);
                  setIsLoading(false);
                  try {
                    setDuration(event.target.getDuration());
                    event.target.setVolume(volume);
                  } catch (err) {
                    console.error('Error in onReady:', err);
                  }
                },
                onStateChange: (event) => {
                  // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0
                  const playing = event.data === 1;
                  setIsPlaying(playing);

                  if (playing) {
                    // Keep branding overlay for first 5 seconds of playback
                    setBrandingOverlayVisible(true);
                    setTimeout(() => {
                      // Only hide if still playing
                      if (playerRef.current && playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING) {
                        setBrandingOverlayVisible(false);
                      }
                    }, 5000);
                  } else {
                    // When paused or ended, show overlay again
                    setBrandingOverlayVisible(true);
                    if (event.data === 0) {
                      // Video ended
                      setIsPlaying(false);
                    }
                  }
                },
                onError: (event) => {
                  console.error('YouTube player error:', event.data);
                  setIsLoading(false);
                  setPlayerReady(false);
                }
              }
            });
          } catch (err) {
            console.error('Error creating YouTube player:', err);
            setIsLoading(false);
            setPlayerReady(false);
          }
      } catch (err) {
        console.error('Error loading YouTube API:', err);
        setIsLoading(false);
        setPlayerReady(false);
      }
    };

    initPlayer();

    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (err) {
          console.error('Error destroying player:', err);
        }
      }
    };
  }, [youtubeVideoId, isYouTube, volume]);

  // Update current time
  useEffect(() => {
    if (!playerReady || !isYouTube) return;

    const interval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [playerReady, isYouTube]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (!playerReady) return;
    
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch (err) {
      console.error('Error toggling play:', err);
    }
  };

  const handleSeek = (e) => {
    if (!playerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    playerRef.current.seekTo(newTime, true);
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current?.parentElement;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Video Lesson</h2>
      
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4 group youtube-player-wrapper">
        {/* Video Container */}
        <div 
          ref={containerRef}
          className="w-full h-full relative"
          style={{ minHeight: '400px' }}
        />
        
        {/* YouTube branding overlays removed - no black bars */}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}

        {/* Custom Thumbnail Overlay (when paused) - Shows custom thumbnail instead of YouTube's */}
        {!isLoading && !isPlaying && resolvedThumbnailUrl && (
          <div 
            className="absolute inset-0 z-12"
          >
            <img 
              src={resolvedThumbnailUrl} 
              alt="Video thumbnail" 
              className="w-full h-full object-cover"
            />
            {/* Dark overlay for better play button visibility */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors pointer-events-none" />
          </div>
        )}

        {/* Large Play Button Overlay (when paused) */}
        {!isLoading && !isPlaying && (isYouTube ? playerReady : true) && (
          <div 
            className="absolute inset-0 flex items-center justify-center z-15 cursor-pointer group/play"
            onClick={(e) => {
              e.stopPropagation();
              if (isYouTube) togglePlay();
            }}
          >
            <div className="bg-black/60 rounded-full p-6 group-hover/play:bg-black/80 transition-colors">
              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
        )}

        {/* Custom Controls Overlay */}
        {!isLoading && isYouTube && (
          <div className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity z-20 ${
            !isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            {/* Progress Bar */}
            <div 
              className="w-full h-1.5 bg-white/30 cursor-pointer hover:h-2 transition-all"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-primary-500 transition-all relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Control Bar */}
            <div className="flex items-center gap-3 p-4">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-primary-400 transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Time Display */}
              <span className="text-white text-sm font-mono min-w-[100px]">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              {/* Volume Control */}
              <div className="flex items-center gap-2 flex-1 max-w-[150px]">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-primary-400 transition-colors"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.618 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.618l3.765-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  ) : volume < 50 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.618 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.618l3.765-3.793a1 1 0 011.617.793zM12.293 7.293a1 1 0 011.414 0A3.983 3.983 0 0115 10a3.983 3.983 0 01-1.293 2.707 1 1 0 01-1.414-1.414A1.983 1.983 0 0013 10c0-.546-.133-1.06-.293-1.293z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.618 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.618l3.765-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="flex-1 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                />
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-primary-400 transition-colors ml-auto"
                aria-label="Fullscreen"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Fallback for non-YouTube videos (Bunny Stream) */}
        {!isYouTube && videoUrl && (
          <iframe
            src={videoUrl}
            className="w-full h-full absolute inset-0"
            frameBorder="0"
            allowFullScreen
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            title="Video lesson"
          />
        )}

        {/* No Video Message */}
        {!videoUrl && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">No video available</p>
              <p className="text-sm text-gray-400">Please add a YouTube URL or Bunny Stream URL</p>
            </div>
          </div>
        )}

        {/* Error Message for YouTube */}
        {isYouTube && !isLoading && !playerReady && youtubeVideoId && (
          <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900 z-20">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">Video failed to load</p>
              <p className="text-sm text-gray-400">Please check the video URL or try refreshing the page</p>
            </div>
          </div>
        )}
      </div>
      
      {!videoCompleted && (
        <div className="border-t pt-4">
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              id="watched-checkbox"
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">I have watched the video fully</span>
          </label>
          
          <button
            onClick={onVideoComplete}
            className="btn-primary w-full"
          >
            Mark Video as Completed
          </button>
        </div>
      )}
      
      {videoCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">✓ Video completed! Now take the MCQ below.</p>
        </div>
      )}
    </div>
  );
};
