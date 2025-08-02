"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Video,
  Calendar,
  MapPin,
  Code,
  Lightbulb,
  Building,
} from "lucide-react";

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
  title?: string;
  fileSize?: number;
  createdAt: string;
}

interface Evaluation {
  id: string;
  reviewerId: string;
  score: number;
  feedback: string;
  createdAt: string;
}

interface StatusHistory {
  id: string;
  fromStatus?: string;
  toStatus: string;
  createdAt: string;
}

interface StartupApplication {
  id: string;
  startupName: string;
  idea: string;
  sector: string;
  country: string;
  techStack: string;
  status: "APPLIED" | "SHORTLISTED" | "SELECTED" | "REJECTED";
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  statusUpdatedAt: string;
  founderId: string;
  files: ApplicationFile[];
  videos: ApplicationVideo[];
  evaluations: Evaluation[];
  statusHistory: StatusHistory[];
}

const StatusPage = () => {
  const [applications, setApplications] = useState<StartupApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch("/api/application/fetch");
        if (!response.ok) {
          throw new Error("Failed to fetch applications");
        }
        const data = await response.json();
        console.log("Fetched applications:", data.applications.applications);
        setApplications(data.applications.applications);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPLIED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "SHORTLISTED":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "SELECTED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="border-red-200">
            <CardContent className="p-6">
              <div className="text-red-600 text-center">
                <p className="text-lg font-medium">
                  Error loading applications
                </p>
                <p className="text-sm mt-2">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Application Status
          </h1>
          <Card>
            <CardContent className="p-12 text-center">
              <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600">No applications found</p>
              <p className="text-sm text-gray-500 mt-2">
                Submit your first startup application to see it here.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Application Status
        </h1>

        <div className="space-y-8">
          {applications.map((application) => (
            <Card key={application.id} className="overflow-hidden">
              <CardHeader className="bg-white border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-gray-900">
                      {application.startupName}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {application.country}
                      </div>
                      <div className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        {application.sector}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Applied {formatDate(application.createdAt)}
                      </div>

                      <div className="flex items-center gap-1">
                        
                        # {application.id}
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={`px-4 py-2 text-sm font-medium ${getStatusColor(
                      application.status
                    )}`}
                  >
                    {application.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Application Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Startup Idea
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {application.idea}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Tech Stack
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {application.techStack.split(",").map((tech, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tech.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Files Section */}
                {application.files.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Uploaded Files
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {application.files.map((file) => (
                        <Card
                          key={file.id}
                          className="p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <Badge variant="outline" className="text-xs">
                              {file.fileType}
                            </Badge>
                          </div>
                          <p
                            className="font-medium text-sm text-gray-900 truncate"
                            title={file.originalName}
                          >
                            {file.originalName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatFileSize(file.fileSize)}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-3"
                            onClick={() => window.open(file.fileUrl, "_blank")}
                          >
                            View File
                          </Button>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Videos Section */}
                {application.videos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      Uploaded Videos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {application.videos.map((video) => (
                        <Card
                          key={video.id}
                          className="p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Video className="h-5 w-5 text-purple-500" />
                            <Badge variant="outline" className="text-xs">
                              {video.videoType}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm text-gray-900">
                            {video.title || "Untitled Video"}
                          </p>
                          {video.fileSize && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formatFileSize(video.fileSize)}
                            </p>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-3"
                            onClick={() =>
                              window.open(video.videoUrl, "_blank")
                            }
                          >
                            Watch Video
                          </Button>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Evaluations Section */}
                {application.evaluations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Evaluations
                    </h3>
                    <div className="space-y-4">
                      {application.evaluations.map((evaluation) => (
                        <Card key={evaluation.id} className="p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                Score: {evaluation.score}/10
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatDate(evaluation.createdAt)}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">
                            {evaluation.feedback}
                          </p>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status History */}
                {application.statusHistory.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Status History
                    </h3>
                    <div className="space-y-2">
                      {application.statusHistory
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                        )
                        .map((history) => (
                          <div
                            key={history.id}
                            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                          >
                            <div className="flex items-center gap-2">
                              {history.fromStatus && (
                                <>
                                  <Badge variant="outline" className="text-xs">
                                    {history.fromStatus}
                                  </Badge>
                                  <span className="text-gray-400">→</span>
                                </>
                              )}
                              <Badge
                                className={`text-xs ${getStatusColor(
                                  history.toStatus
                                )}`}
                              >
                                {history.toStatus}
                              </Badge>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(history.createdAt)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatusPage;