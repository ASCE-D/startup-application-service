"use client";

import { useState, ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Upload, Loader2, Link, Video } from "lucide-react";
import { getSession } from "next-auth/react";
import { redirect } from "next/navigation";

// Type definitions
interface FormData {
  founderName: string;
  email: string;
  startupName: string;
  idea: string;
  sector: string;
  country: string;
  techStack: string;
}

interface UploadResult {
  success: boolean;
  message: string;
  fileUrl?: string;
}

interface UploadResults {
  resume: UploadResult | null;
  pitchDeck: UploadResult | null;
}

interface UploadingState {
  resume: boolean;
  pitchDeck: boolean;
}

type VideoMode = "upload" | "link";
type FileType = "resume" | "pitchDeck";

export default function FounderSubmissionPage() {
  const [formData, setFormData] = useState<FormData>({
    founderName: "",
    email: "",
    startupName: "",
    idea: "",
    sector: "",
    country: "",
    techStack: "",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  // File upload states
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<UploadingState>({
    resume: false,
    pitchDeck: false,
  });
  const [uploadResults, setUploadResults] = useState<UploadResults>({
    resume: null,
    pitchDeck: null,
  });

  // Video upload states
  const [videoMode, setVideoMode] = useState<VideoMode>("upload");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoTitle, setVideoTitle] = useState<string>("");
  const [videoUploading, setVideoUploading] = useState<boolean>(false);
  const [videoResult, setVideoResult] = useState<UploadResult | null>(null);

    useEffect(() => {
      async function fetchSession() {
        const session = await getSession();

        if (session?.user) {
          setFormData((prev) => ({
            ...prev,
            founderName: session?.user?.name || "",
            email: session?.user?.email || "",
          }));
        }else {
          redirect("/login");
        }
      }

      fetchSession();
    }, []);

  const handleSubmit = async (isDraft: boolean = false): Promise<void> => {
    setLoading(true);

    try {
      const response = await fetch("/api/application/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          isDraft,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setApplicationId(data.applicationId);
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = async (
    file: File | null,
    fileType: FileType
  ): Promise<void> => {
    if (!file) return;

    setUploading((prev) => ({ ...prev, [fileType]: true }));

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    if (applicationId !== null) {
      formDataUpload.append("applicationId", applicationId);
    }
    formDataUpload.append(
      "fileType",
      fileType === "resume" ? "RESUME" : "PITCH_DECK"
    );

    try {
      const response = await fetch("/api/application/upload", {
        method: "POST",
        body: formDataUpload,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadResults((prev) => ({
          ...prev,
          [fileType]: {
            success: true,
            message: data.message,
            fileUrl: data.fileUrl,
          },
        }));
      } else {
        setUploadResults((prev) => ({
          ...prev,
          [fileType]: { success: false, message: data.error },
        }));
      }
    } catch (error) {
      setUploadResults((prev) => ({
        ...prev,
        [fileType]: { success: false, message: "Upload failed" },
      }));
    } finally {
      setUploading((prev) => ({ ...prev, [fileType]: false }));
    }
  };

  const handleVideoUpload = async (): Promise<void> => {
    setVideoUploading(true);
    setVideoResult(null);

    try {
      let response: Response;

      if (videoMode === "upload" && videoFile) {
        const formDataVideo = new FormData();
        formDataVideo.append("file", videoFile);
        if (applicationId !== null) {
          formDataVideo.append("applicationId", applicationId);
        }
        formDataVideo.append("title", videoTitle);

        response = await fetch("/api/application/video-upload", {
          method: "POST",
          body: formDataVideo,
        });
      } else if (videoMode === "link" && videoUrl) {
        response = await fetch("/api/application/video-upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            applicationId,
            videoUrl,
            title: videoTitle,
          }),
        });
      } else {
        throw new Error("Invalid video upload configuration");
      }

      const data = await response.json();

      if (response.ok) {
        setVideoResult({ success: true, message: data.message });
      } else {
        setVideoResult({ success: false, message: data.error });
      }
    } catch (error) {
      setVideoResult({ success: false, message: "Video upload failed" });
    } finally {
      setVideoUploading(false);
    }
  };

  const handleFileInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void
  ): void => {
    const file = e.target.files?.[0] || null;
    setFile(file);
  };

  // Show application form if no applicationId
  if (!applicationId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Startup Application
              </CardTitle>
              <CardDescription className="text-center">
                Submit your startup details to join our accelerator program
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="founderName">Founder Name *</Label>
                  <Input
                    id="founderName"
                    name="founderName"
                    value={formData.founderName}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startupName">Startup Name *</Label>
                <Input
                  id="startupName"
                  name="startupName"
                  value={formData.startupName}
                  onChange={handleInputChange}
                  placeholder="Your startup name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idea">Startup Idea *</Label>
                <Textarea
                  id="idea"
                  name="idea"
                  value={formData.idea}
                  onChange={handleInputChange}
                  placeholder="Describe your startup idea, problem you're solving, and solution..."
                  className="min-h-24"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sector">Industry/Sector *</Label>
                  <Input
                    id="sector"
                    name="sector"
                    value={formData.sector}
                    onChange={handleInputChange}
                    placeholder="e.g., FinTech, HealthTech"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="Your country"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="techStack">Tech Stack *</Label>
                <Input
                  id="techStack"
                  name="techStack"
                  value={formData.techStack}
                  onChange={handleInputChange}
                  placeholder="e.g., React, Node.js, PostgreSQL"
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => handleSubmit(true)}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save as Draft"
                  )}
                </Button>

                <Button
                  onClick={() => handleSubmit(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show upload interface after successful application submission
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Application ID Display */}
        <Alert className="border-green-500 bg-green-50">
          <AlertDescription>
            <strong>Application submitted successfully!</strong>
            <br />
            Application ID: {applicationId}
          </AlertDescription>
        </Alert>

        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Documents
            </CardTitle>
            <CardDescription>
              Upload your resume and pitch deck (PDF or DOCX only)
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Resume Upload */}
            <div className="space-y-3">
              <Label htmlFor="resume">Resume *</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => handleFileInputChange(e, setResumeFile)}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleFileUpload(resumeFile, "resume")}
                  disabled={!resumeFile || uploading.resume}
                  size="sm"
                >
                  {uploading.resume ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Upload"
                  )}
                </Button>
              </div>
              {uploadResults.resume && (
                <Alert
                  className={
                    uploadResults.resume.success
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                  }
                >
                  <AlertDescription>
                    {uploadResults.resume.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Pitch Deck Upload */}
            <div className="space-y-3">
              <Label htmlFor="pitchDeck">Pitch Deck *</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="pitchDeck"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => handleFileInputChange(e, setPitchDeckFile)}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleFileUpload(pitchDeckFile, "pitchDeck")}
                  disabled={!pitchDeckFile || uploading.pitchDeck}
                  size="sm"
                >
                  {uploading.pitchDeck ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Upload"
                  )}
                </Button>
              </div>
              {uploadResults.pitchDeck && (
                <Alert
                  className={
                    uploadResults.pitchDeck.success
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                  }
                >
                  <AlertDescription>
                    {uploadResults.pitchDeck.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Video Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Video Pitch
            </CardTitle>
            <CardDescription>
              Upload a video file or provide YouTube/Vimeo link
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Video Mode Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Upload className="w-4 h-4" />
                <span>Upload Video File</span>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={videoMode === "link"}
                  onCheckedChange={(checked: boolean) =>
                    setVideoMode(checked ? "link" : "upload")
                  }
                />
                <Link className="w-4 h-4" />
                <span>YouTube/Vimeo Link</span>
              </div>
            </div>

            {/* Video Title */}
            <div className="space-y-2">
              <Label htmlFor="videoTitle">Video Title (Optional)</Label>
              <Input
                id="videoTitle"
                value={videoTitle}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setVideoTitle(e.target.value)
                }
                placeholder="Enter video title"
              />
            </div>

            {/* Video Upload/Link Input */}
            {videoMode === "upload" ? (
              <div className="space-y-2">
                <Label htmlFor="videoFile">Video File</Label>
                <Input
                  id="videoFile"
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileInputChange(e, setVideoFile)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="videoUrl">YouTube/Vimeo URL</Label>
                <Input
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setVideoUrl(e.target.value)
                  }
                  placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                />
              </div>
            )}

            <Button
              onClick={handleVideoUpload}
              disabled={
                videoUploading ||
                (videoMode === "upload" && !videoFile) ||
                (videoMode === "link" && !videoUrl)
              }
              className="w-full"
            >
              {videoUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading Video...
                </>
              ) : (
                `Upload ${videoMode === "upload" ? "Video File" : "Video Link"}`
              )}
            </Button>

            <Button onClick={()=> redirect("/founder")}></Button>

            {videoResult && (
              <Alert
                className={
                  videoResult.success
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                }
              >
                <AlertDescription>{videoResult.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
