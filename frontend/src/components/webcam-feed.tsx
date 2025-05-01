"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CameraIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WebcamFeedProps {
  onCapture: (imageSrc: string) => void;
  streamUrl: string;
  snapshotUrl: string;
  zoomLevel: number;
  resolution: string;
}

export function WebcamFeed({
  onCapture,
  snapshotUrl,
  zoomLevel,
}: WebcamFeedProps) {
  const [streamError, setStreamError] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string>(snapshotUrl);

  // Refresh the image every 500ms to create a pseudo-stream
  useEffect(() => {
    const refreshImage = () => {
      setImageSrc(`${snapshotUrl}&t=${new Date().getTime()}`); // Add timestamp to prevent caching
    };

    const interval = setInterval(refreshImage, 500); // Refresh every 500ms
    return () => clearInterval(interval); // Cleanup on unmount
  }, [snapshotUrl]);

  const capture = useCallback(async () => {
    try {
      const response = await fetch(snapshotUrl);
      if (!response.ok) throw new Error("Failed to capture image");
      const blob = await response.blob();
      const imageSrc = URL.createObjectURL(blob);
      onCapture(imageSrc);
    } catch (error) {
      console.error("Error capturing image:", error);
      alert("Failed to capture image");
    }
  }, [snapshotUrl, onCapture]);

  return (
    <div className="relative aspect-video bg-gray-900 flex items-center justify-center rounded-md overflow-hidden">
      {streamError ? (
        <div className="text-white text-center p-6">
          <p>Error loading camera feed: {streamError}</p>
          <p>Check the ESP32-CAM IP and network connection.</p>
        </div>
      ) : (
        <img
          src={imageSrc}
          alt="Camera Feed"
          className="w-full h-full object-cover"
          style={{ transform: `scale(${zoomLevel})` }}
          onError={(e) => {
            console.error("Error loading stream:", e);
            setStreamError("Failed to load stream");
          }}
          onLoad={() => setStreamError(null)}
        />
      )}

      {/* Camera controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="text-white text-sm">
            <Badge
              variant="outline"
              className="bg-green-700 text-white border-green-600"
            >
              Live
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={capture}
            >
              <CameraIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
