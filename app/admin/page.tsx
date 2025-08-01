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
import { Star, FileText, Video, Loader2 } from "lucide-react";

// Type definitions
interface Application {
  id: string;
  startupName: string;
  founderName: string;
  email: string;
  sector: string;
  status: ApplicationStatus;
  createdAt: string;
  idea: string;
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

  useEffect(() => {
    const fetchApplications = async () => {
        setIsLoading(true);
      try {
        const response = await fetch("/api/application");
        if (!response.ok) {
          throw new Error("Failed to fetch applications");
        }
        const data = await response.json();
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

  if (isLoading) return <div>Loading....</div>

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
                  </tr>
                </thead>
                <tbody>
                  {applications?.map((app) => (
                    <tr key={app.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{app.startupName}</td>
                      <td className="p-4">
                        <div>
                          <div>{app.founderName}</div>
                          <div className="text-sm text-gray-500">
                            {app.email}
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
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{app.startupName}</DialogTitle>
                                <DialogDescription>
                                  Application Details
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label className="font-semibold">
                                    Founder:
                                  </Label>
                                  <p>
                                    {app.founderName} ({app.email})
                                  </p>
                                </div>
                                <div>
                                  <Label className="font-semibold">Idea:</Label>
                                  <p>{app.idea}</p>
                                </div>
                                <div>
                                  <Label className="font-semibold">
                                    Sector:
                                  </Label>
                                  <p>{app.sector}</p>
                                </div>
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
