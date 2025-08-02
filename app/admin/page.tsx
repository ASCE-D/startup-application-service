"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Star,
  FileText,
  Video,
  Loader2,
  Download,
  ExternalLink,
  File,
  Copy,
  Eye,
} from "lucide-react";

// Type definitions
interface ApplicationFile {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

interface ApplicationVideo {
  id: string;
  videoType: string;
  videoUrl: string;
  title: string;
  fileSize: number;
  createdAt: string;
}

interface Application {
  id: string;
  startupName: string;
  founderName: string;
  email: string;
  sector: string;
  status: ApplicationStatus;
  createdAt: string;
  idea: string;
  country?: string;
  techStack?: string;
  files?: ApplicationFile[];
  videos?: ApplicationVideo[];
}

type ApplicationStatus = "APPLIED" | "SHORTLISTED" | "SELECTED" | "REJECTED";

interface ScoreData {
  reviewerId: string;
  score: string;
  feedback: string;
}

interface LoadingState {
  score: boolean;
  status: boolean;
}

type StatusVariants = {
  [K in ApplicationStatus]: string;
};

export default function AdminReviewPanel() {
  const [applications, setApplications] = useState<Application[] | []>();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [scoreData, setScoreData] = useState<ScoreData>({
    reviewerId: "reviewer-001",
    score: "",
    feedback: "",
  });
  const [statusUpdate, setStatusUpdate] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<LoadingState>({
    score: false,
    status: false,
  });
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>(
    {}
  );

  useEffect(() => {
    const fetchApplications = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/application");
        if (!response.ok) {
          throw new Error("Failed to fetch applications");
        }
        const data = await response.json();
        console.log("Fetched applications:", data.applications);
        setApplications(data.applications || []);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        console.error("Error fetching applications:", error);
      }
    };

    fetchApplications();
  }, []);

  const getStatusBadge = (status: ApplicationStatus) => {
    const variants: StatusVariants = {
      APPLIED: "bg-blue-100 text-blue-800",
      SHORTLISTED: "bg-yellow-100 text-yellow-800",
      SELECTED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    return <Badge className={variants[status]}>{status}</Badge>;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf"))
      return <File className="w-4 h-4 text-red-500" />;
    if (mimeType.includes("image"))
      return <File className="w-4 h-4 text-green-500" />;
    if (mimeType.includes("video"))
      return <Video className="w-4 h-4 text-blue-500" />;
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates((prev) => ({ ...prev, [itemId]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [itemId]: false }));
      }, 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedStates((prev) => ({ ...prev, [itemId]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [itemId]: false }));
      }, 2000);
    }
  };

  const handleScoreSubmit = async (applicationId: string): Promise<void> => {
    if (!scoreData.score || !scoreData.feedback) {
      alert("Please provide both score and feedback");
      return;
    }

    setLoading((prev) => ({ ...prev, score: true }));

    try {
      const response = await fetch("/api/application/evaluation/manual-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId,
          reviewerId: scoreData.reviewerId,
          score: parseInt(scoreData.score),
          feedback: scoreData.feedback,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Score submitted successfully!");
        setScoreData({ reviewerId: "reviewer-001", score: "", feedback: "" });
        setSelectedApp(null);
      } else {
        alert(data.error || "Failed to submit score");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, score: false }));
    }
  };

  const handleStatusUpdate = async (
    applicationId: string,
    newStatus: ApplicationStatus
  ): Promise<void> => {
    setLoading((prev) => ({ ...prev, status: true }));

    try {
      const response = await fetch("/api/application/update-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId,
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state
        setApplications((prev = []) =>
          prev.map((app) =>
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        );
        alert("Status updated successfully!");
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setLoading((prev) => ({ ...prev, status: false }));
    }
  };

  if (isLoading) return <div>Loading....</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Admin Review Panel
            </CardTitle>
            <CardDescription>
              Review and manage startup applications
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Startup Name</th>
                    <th className="text-left p-4 font-medium">Founder</th>
                    <th className="text-left p-4 font-medium">Sector</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Applied Date</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                    <th className="text-left p-4 font-medium">
                      Files & Videos
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applications?.map((app) => (
                    <tr key={app.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{app.startupName}</td>
                      <td className="p-4">
                        <div>
                          <div>{app.founder.name}</div>
                          <div className="text-sm text-gray-500">
                            {app.founder.email}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{app.sector}</td>
                      <td className="p-4">{getStatusBadge(app.status)}</td>
                      <td className="p-4">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {/* View Details Dialog */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <FileText className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>{app.startupName}</DialogTitle>
                                <DialogDescription>
                                  Application Details
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label className="font-semibold text-sm">
                                      Founder:
                                    </Label>
                                    <p className="text-sm">
                                      {app.founderName} ({app.email})
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold text-sm">
                                      Sector:
                                    </Label>
                                    <p className="text-sm">{app.sector}</p>
                                  </div>
                                  {app.country && (
                                    <div>
                                      <Label className="font-semibold text-sm">
                                        Country:
                                      </Label>
                                      <p className="text-sm">{app.country}</p>
                                    </div>
                                  )}
                                  {app.techStack && (
                                    <div>
                                      <Label className="font-semibold text-sm">
                                        Tech Stack:
                                      </Label>
                                      <p className="text-sm">{app.techStack}</p>
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <Label className="font-semibold text-sm">
                                    Business Idea:
                                  </Label>
                                  <p className="text-sm mt-1">{app.idea}</p>
                                </div>

                                {/* Files Section */}
                                {app.files && app.files.length > 0 && (
                                  <div>
                                    <Label className="font-semibold text-sm">
                                      Uploaded Files:
                                    </Label>
                                    <div className="space-y-2 mt-2">
                                      {app.files.map((file) => (
                                        <div
                                          key={file.id}
                                          className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                                        >
                                          <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {getFileIcon(file.mimeType)}
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium">
                                                {file.originalName}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                {file.fileType} •{" "}
                                                {formatFileSize(file.fileSize)}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex gap-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() =>
                                                copyToClipboard(
                                                  file.fileUrl,
                                                  `file-${file.id}`
                                                )
                                              }
                                              className={
                                                copiedStates[`file-${file.id}`]
                                                  ? "bg-green-100 text-green-700"
                                                  : ""
                                              }
                                            >
                                              {copiedStates[
                                                `file-${file.id}`
                                              ] ? (
                                                <>
                                                  <Eye className="w-4 h-4 mr-1" />
                                                  Copied!
                                                </>
                                              ) : (
                                                <>
                                                  <Copy className="w-4 h-4 mr-1" />
                                                  Copy URL
                                                </>
                                              )}
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() =>
                                                window.open(
                                                  file.fileUrl,
                                                  "_blank"
                                                )
                                              }
                                              title="Open in new tab"
                                            >
                                              <ExternalLink className="w-4 h-4" />
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                const link =
                                                  document.createElement("a");
                                                link.href = file.fileUrl;
                                                link.download =
                                                  file.originalName;
                                                link.click();
                                              }}
                                              title="Download file"
                                            >
                                              <Download className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Videos Section */}
                                {app.videos && app.videos.length > 0 && (
                                  <div>
                                    <Label className="font-semibold text-sm">
                                      Pitch Videos:
                                    </Label>
                                    <div className="space-y-3 mt-2">
                                      {app.videos.map((video) => (
                                        <div
                                          key={video.id}
                                          className="border rounded-lg p-3"
                                        >
                                          <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                              <Video className="w-5 h-5 text-blue-500" />
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">
                                                  {video.title}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                  {video.videoType} •{" "}
                                                  {formatFileSize(
                                                    video.fileSize
                                                  )}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex gap-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  copyToClipboard(
                                                    video.videoUrl,
                                                    `video-${video.id}`
                                                  )
                                                }
                                                className={
                                                  copiedStates[
                                                    `video-${video.id}`
                                                  ]
                                                    ? "bg-green-100 text-green-700"
                                                    : ""
                                                }
                                              >
                                                {copiedStates[
                                                  `video-${video.id}`
                                                ] ? (
                                                  <>
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    Copied!
                                                  </>
                                                ) : (
                                                  <>
                                                    <Copy className="w-4 h-4 mr-1" />
                                                    Copy URL
                                                  </>
                                                )}
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  window.open(
                                                    video.videoUrl,
                                                    "_blank"
                                                  )
                                                }
                                                title="Open in new tab"
                                              >
                                                <ExternalLink className="w-4 h-4" />
                                              </Button>
                                            </div>
                                          </div>
                                          <video
                                            controls
                                            className="w-full max-h-64 rounded"
                                            poster=""
                                          >
                                            <source
                                              src={video.videoUrl}
                                              type="video/mp4"
                                            />
                                            Your browser does not support the
                                            video tag.
                                          </video>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Score Application Dialog */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-orange-600"
                              >
                                <Star className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Score Application</DialogTitle>
                                <DialogDescription>
                                  Provide a score (1-10) and feedback for{" "}
                                  {app.startupName}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="score">Score (1-10) *</Label>
                                  <Input
                                    id="score"
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={scoreData.score}
                                    onChange={(e) =>
                                      setScoreData((prev) => ({
                                        ...prev,
                                        score: e.target.value,
                                      }))
                                    }
                                    placeholder="Enter score 1-10"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="feedback">Feedback *</Label>
                                  <Textarea
                                    id="feedback"
                                    value={scoreData.feedback}
                                    onChange={(e) =>
                                      setScoreData((prev) => ({
                                        ...prev,
                                        feedback: e.target.value,
                                      }))
                                    }
                                    placeholder="Provide detailed feedback..."
                                    className="min-h-24"
                                  />
                                </div>
                                <Button
                                  onClick={() => handleScoreSubmit(app.id)}
                                  disabled={loading.score}
                                  className="w-full"
                                >
                                  {loading.score ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Submitting...
                                    </>
                                  ) : (
                                    "Submit Score"
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Status Update Dropdown */}
                          <Select
                            onValueChange={(value: ApplicationStatus) =>
                              handleStatusUpdate(app.id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="APPLIED">Applied</SelectItem>
                              <SelectItem value="SHORTLISTED">
                                Shortlisted
                              </SelectItem>
                              <SelectItem value="SELECTED">Selected</SelectItem>
                              <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1 flex-wrap">
                          {/* Files Count */}
                          {app.files && app.files.length > 0 && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className="text-xs cursor-pointer hover:bg-gray-100"
                                >
                                  <File className="w-3 h-3 mr-1" />
                                  {app.files.length} file
                                  {app.files.length > 1 ? "s" : ""}
                                </Badge>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>
                                    Files for {app.startupName}
                                  </DialogTitle>
                                  <DialogDescription>
                                    Click to copy URLs or download files
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-3">
                                  {app.files.map((file) => (
                                    <div
                                      key={file.id}
                                      className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {getFileIcon(file.mimeType)}
                                        <div className="min-w-0 flex-1">
                                          <p className="text-sm font-medium truncate">
                                            {file.originalName}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {file.fileType} •{" "}
                                            {formatFileSize(file.fileSize)}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex gap-2 ml-3">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            copyToClipboard(
                                              file.fileUrl,
                                              `popup-file-${file.id}`
                                            )
                                          }
                                          className={
                                            copiedStates[
                                              `popup-file-${file.id}`
                                            ]
                                              ? "bg-green-100 text-green-700"
                                              : ""
                                          }
                                        >
                                          {copiedStates[
                                            `popup-file-${file.id}`
                                          ] ? (
                                            <>
                                              <Eye className="w-4 h-4 mr-1" />
                                              Copied!
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="w-4 h-4 mr-1" />
                                              Copy URL
                                            </>
                                          )}
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            window.open(file.fileUrl, "_blank")
                                          }
                                          title="Open in new tab"
                                        >
                                          <ExternalLink className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          {/* Videos Count */}
                          {app.videos && app.videos.length > 0 && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className="text-xs cursor-pointer hover:bg-gray-100"
                                >
                                  <Video className="w-3 h-3 mr-1" />
                                  {app.videos.length} video
                                  {app.videos.length > 1 ? "s" : ""}
                                </Badge>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>
                                    Videos for {app.startupName}
                                  </DialogTitle>
                                  <DialogDescription>
                                    Click to copy URLs or watch videos
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-3">
                                  {app.videos.map((video) => (
                                    <div
                                      key={video.id}
                                      className="border rounded-lg p-3"
                                    >
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <Video className="w-5 h-5 text-blue-500" />
                                          <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium">
                                              {video.title}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {video.videoType} •{" "}
                                              {formatFileSize(video.fileSize)}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex gap-2 ml-3">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              copyToClipboard(
                                                video.videoUrl,
                                                `popup-video-${video.id}`
                                              )
                                            }
                                            className={
                                              copiedStates[
                                                `popup-video-${video.id}`
                                              ]
                                                ? "bg-green-100 text-green-700"
                                                : ""
                                            }
                                          >
                                            {copiedStates[
                                              `popup-video-${video.id}`
                                            ] ? (
                                              <>
                                                <Eye className="w-4 h-4 mr-1" />
                                                Copied!
                                              </>
                                            ) : (
                                              <>
                                                <Copy className="w-4 h-4 mr-1" />
                                                Copy URL
                                              </>
                                            )}
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              window.open(
                                                video.videoUrl,
                                                "_blank"
                                              )
                                            }
                                            title="Open in new tab"
                                          >
                                            <ExternalLink className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          {(!app.files || app.files.length === 0) &&
                            (!app.videos || app.videos.length === 0) && (
                              <span className="text-xs text-gray-400">
                                No files
                              </span>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {applications?.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No applications found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
