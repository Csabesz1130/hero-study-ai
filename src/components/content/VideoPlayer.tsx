"use client";

import { useEffect, useRef, useState } from "react";
import { VideoContent, ContentProgress } from "@/types/content";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";

interface VideoPlayerProps {
    content: VideoContent;
    onProgressUpdate: (progress: ContentProgress) => void;
}

export function VideoPlayer({ content, onProgressUpdate }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [engagementPoints, setEngagementPoints] = useState<number[]>([]);
    const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());

    useEffect(() => {
        // Engagement pontok betöltése
        const points = content.engagementPoints.map(point => point.timestamp);
        setEngagementPoints(points);

        // Progress mentése 30 másodpercenként
        const interval = setInterval(() => {
            if (videoRef.current && isPlaying) {
                const currentProgress = (videoRef.current.currentTime / content.duration) * 100;
                setProgress(currentProgress);
                onProgressUpdate({
                    contentId: content.id,
                    type: "video",
                    progress: currentProgress,
                    completed: currentProgress >= 100,
                    lastAccessed: new Date(),
                    engagement: {
                        watchTime: Math.floor(videoRef.current.currentTime),
                    },
                });
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [content, isPlaying, onProgressUpdate]);

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const currentTime = videoRef.current.currentTime;
            setCurrentTime(currentTime);

            // Engagement pontok ellenőrzése
            const currentPoint = content.engagementPoints.find(
                point => Math.abs(point.timestamp - currentTime) < 1
            );

            if (currentPoint) {
                toast(currentPoint.content, {
                    duration: 5000,
                    position: "top-center",
                });
            }
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const time = parseFloat(e.target.value);
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                    ref={videoRef}
                    src={content.url}
                    className="w-full h-full"
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handlePlayPause}
                            className="text-white hover:text-gray-300"
                        >
                            {isPlaying ? "⏸️" : "▶️"}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max={content.duration}
                            value={currentTime}
                            onChange={handleSeek}
                            className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-white text-sm">
                            {formatTime(currentTime)} / {formatTime(content.duration)}
                        </span>
                    </div>
                </div>
            </div>
            {content.description && (
                <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                    <p className="text-gray-300">{content.description}</p>
                </div>
            )}
        </div>
    );
} 
} 