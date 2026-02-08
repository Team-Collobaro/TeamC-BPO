import { useMemo, useState } from 'react';

// Helper function to extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
};

// Extract Google Drive file ID from view/open links (e.g. drive.google.com/file/d/ID/view)
const getGoogleDriveFileId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const m = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
            url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
};

export const VideoPlayer = ({ bunnyEmbedUrl, youtubeUrl, thumbnailUrl, onVideoComplete, videoCompleted }) => {
  const [thumbnailOverlayDismissed, setThumbnailOverlayDismissed] = useState(false);

  const videoUrl = youtubeUrl || bunnyEmbedUrl;
  const youtubeVideoId = useMemo(() => getYouTubeVideoId(videoUrl), [videoUrl]);
  const googleDriveFileId = useMemo(() => getGoogleDriveFileId(videoUrl), [videoUrl]);
  const isYouTube = !!youtubeVideoId;
  const isGoogleDrive = !!googleDriveFileId;

  const youtubeEmbedSrc = isYouTube
    ? `https://www.youtube.com/embed/${youtubeVideoId}?rel=0&modestbranding=1`
    : null;
  const googleDriveEmbedSrc = isGoogleDrive
    ? `https://drive.google.com/file/d/${googleDriveFileId}/preview`
    : null;

  const resolvedThumbnailUrl = thumbnailUrl || (youtubeVideoId ? `https://img.youtube.com/vi/${youtubeVideoId}/sddefault.jpg` : null);
  const showThumbnailOverlay = resolvedThumbnailUrl && videoUrl && !thumbnailOverlayDismissed;

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Video Lesson</h2>

      <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
        {youtubeEmbedSrc && (
          <iframe
            src={youtubeEmbedSrc}
            className="w-full h-full absolute inset-0"
            frameBorder="0"
            allowFullScreen
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            title="Video lesson"
          />
        )}

        {!isYouTube && googleDriveEmbedSrc && (
          <iframe
            src={googleDriveEmbedSrc}
            className="w-full h-full absolute inset-0"
            frameBorder="0"
            allowFullScreen
            allow="autoplay"
            title="Video lesson"
          />
        )}

        {!isYouTube && !isGoogleDrive && videoUrl && (
          <iframe
            src={videoUrl}
            className="w-full h-full absolute inset-0"
            frameBorder="0"
            allowFullScreen
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            title="Video lesson"
          />
        )}

        {showThumbnailOverlay && (
          <button
            type="button"
            className="absolute inset-0 z-10 w-full h-full block cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
            onClick={() => setThumbnailOverlayDismissed(true)}
            aria-label="Show video player"
          >
            <img
              src={resolvedThumbnailUrl}
              alt=""
              className="w-full h-full object-cover pointer-events-none"
              onError={(e) => e.target.style.display = 'none'}
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors pointer-events-none">
              <span className="bg-black/60 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Click to watch
              </span>
            </span>
          </button>
        )}

        {!videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">No video available</p>
              <p className="text-sm text-gray-400">Please add a YouTube URL, Google Drive link, or Bunny Stream URL</p>
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
          <p className="text-green-800 font-medium">✓ Video completed! You can now access the MCQ questions below. You can also re-watch this video anytime.</p>
        </div>
      )}
    </div>
  );
};
