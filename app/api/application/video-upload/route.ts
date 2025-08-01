// app/api/application/video-upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type");

    let applicationId: string;
    let videoType: "UPLOAD" | "YOUTUBE" | "VIMEO";
    let videoUrl: string;
    let title: string | null = null;
    let fileSize: number | null = null;

    if (contentType?.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get("file") as File;
      applicationId = formData.get("applicationId") as string;
      title = formData.get("title") as string;

      if (!file || !applicationId) {
        return NextResponse.json(
          { error: "File and applicationId are required" },
          { status: 400 }
        );
      }

      // Upload video to Cloudinary
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadResult: any = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "video",
              folder: "startup-videos",
              public_id: `${applicationId}-video-${Date.now()}`,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(buffer);
      });

      videoType = "UPLOAD";
      videoUrl = uploadResult.secure_url;
      fileSize = file.size;
    } else {
      // Handle URL submission
      const {
        applicationId: appId,
        videoUrl: url,
        title: videoTitle,
      } = await request.json();

      applicationId = appId;
      videoUrl = url;
      title = videoTitle;

      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        videoType = "YOUTUBE";
      } else if (url.includes("vimeo.com")) {
        videoType = "VIMEO";
      } else {
        return NextResponse.json(
          { error: "Invalid video URL. Only YouTube and Vimeo are supported" },
          { status: 400 }
        );
      }
    }

    // Verify application exists
    const application = await prisma.startupApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Save video metadata to database
    const applicationVideo = await prisma.applicationVideo.create({
      data: {
        applicationId,
        videoType,
        videoUrl,
        title,
        fileSize,
      },
    });

    return NextResponse.json(
      {
        success: true,
        videoId: applicationVideo.id,
        videoUrl: applicationVideo.videoUrl,
        videoType: applicationVideo.videoType,
        message: "Video uploaded successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Video upload error:", error);
    return NextResponse.json({ error: "Video upload failed" }, { status: 500 });
  }
}
