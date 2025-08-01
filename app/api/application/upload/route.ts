import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "dah6so0qb",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const applicationId = formData.get("applicationId") as string;
    const fileType = formData.get("fileType") as "RESUME" | "PITCH_DECK";

    if (!file || !applicationId || !fileType) {
      return NextResponse.json(
        { error: "File, applicationId, and fileType are required" },
        { status: 400 }
      );
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

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await new Promise<{
      public_id: string;
      secure_url: string;
    }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "raw",
            folder: "startup-applications",
            public_id: `${applicationId}-${fileType}-${Date.now()}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as { public_id: string; secure_url: string });
          }
        )
        .end(buffer);
    });

    // Save file metadata to database
    const applicationFile = await prisma.applicationFile.create({
      data: {
        applicationId,
        fileName: uploadResult.public_id,
        originalName: file.name,
        fileType,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl: uploadResult.secure_url,
      },
    });

    return NextResponse.json(
      {
        success: true,
        fileId: applicationFile.id,
        fileUrl: applicationFile.fileUrl,
        message: "File uploaded successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
