"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

interface VideoPlayerProps {
    videoUrl: string;
    title: string;
    objectiveId: string;
    userId: string;
}

export function VideoPlayer({ videoUrl, title, objectiveId, userId }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [engagement, setEngagement] = useState(0);
    const lastUpdateTime = useRef(Date.now());

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleTimeUpdate = () => setCurrentTime(video.currentTime);
        const handleLoadedMetadata = () => setDuration(video.duration);
        const handleVisibilityChange = () => {
            if (document.hidden) {
                updateEngagement();
            }
        };

        video.addEventListener("play", handlePlay);
        video.addEventListener("pause", handlePause);
        video.addEventListener("timeupdate", handleTimeUpdate);
        video.addEventListener("loadedmetadata", handleLoadedMetadata);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            video.removeEventListener("play", handlePlay);
            video.removeEventListener("pause", handlePause);
            video.removeEventListener("timeupdate", handleTimeUpdate);
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    const updateEngagement = async () => {
        const now = Date.now();
        const timeDiff = now - lastUpdateTime.current;
        const watchTime = Math.min(timeDiff / 1000, 30); // Maximum 30 másodperc per frissítés

        if (watchTime > 0) {
            try {
                await api.progress.update({
                    userId,
                    objectiveId,
                    watchTime,
                    engagement: calculateEngagement(),
                });
                lastUpdateTime.current = now;
            } catch (error) {
                console.error("Hiba történt az engagement frissítése közben:", error);
            }
        }
    };

    const calculateEngagement = () => {
        if (duration === 0) return 0;
        const progress = (currentTime / duration) * 100;
        const engagementScore = Math.min(progress + (isPlaying ? 10 : 0), 100);
        return Math.round(engagementScore);
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                    ref={videoRef}
                    src={videoUrl}
                    title={title}
                    className="w-full h-full"
                    controls
                />
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                    <div
                        className="h-full bg-primary-500 transition-all duration-300"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                </div>
            </div>
            <div className="mt-4 flex justify-between items-center text-sm text-gray-400">
                <span>{title}</span>
                <span>Engagement: {engagement}%</span>
            </div>
        </div>
    );
} 