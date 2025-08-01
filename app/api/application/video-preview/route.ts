import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");
    const videoId = searchParams.get("videoId");

    if (!applicationId && !videoId) {
      return NextResponse.json(
        { error: "Either applicationId or videoId is required" },
        { status: 400 }
      );
    }

    let videos;

    if (videoId) {
      // Get specific video
      const video = await prisma.applicationVideo.findUnique({
        where: { id: videoId },
        include: {
          application: {
            select: {
              id: true,
              startupName: true,
            },
          },
        },
      });

      if (!video) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
      }

      videos = [video];
    } else {
      // Get all videos for application
      videos = await prisma.applicationVideo.findMany({
        where: applicationId ? { applicationId } : {},
        include: {
          application: {
            select: {
              id: true,
              startupName: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      videos: videos.map((video) => ({
        id: video.id,
        title: video.title,
        videoType: video.videoType,
        videoUrl: video.videoUrl,
        fileSize: video.fileSize,
        createdAt: video.createdAt,
        application: video.application,
      })),
    });
  } catch (error) {
    console.error("Video preview error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve video" },
      { status: 500 }
    );
  }
}
