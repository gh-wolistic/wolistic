/**
 * AttendanceMarkingModal - Modal for marking attendance for session enrollments
 * 
 * Allows expert to mark each enrolled client as:
 * - Attended (transaction complete)
 * - No-show (expert keeps payment)
 * - Session cancelled (triggers refund)
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Users } from "lucide-react";
import { ClassEnrollment } from "./classesApi";
import { markAttendance } from "./classesApi";

interface AttendanceMarkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number;
  sessionTitle: string;
  sessionDate: string;
  sessionTime: string;
  enrollments: ClassEnrollment[];
  accessToken: string;
  onSuccess: () => void;
}

type AttendanceStatus = "attended" | "no_show_client" | "session_cancelled";

interface EnrollmentAttendance {
  enrollment_id: number;
  client_name: string;
  status: AttendanceStatus | null;
}

export function AttendanceMarkingModal({
  isOpen,
  onClose,
  sessionId,
  sessionTitle,
  sessionDate,
  sessionTime,
  enrollments,
  accessToken,
  onSuccess,
}: AttendanceMarkingModalProps) {
  const [attendanceMap, setAttendanceMap] = useState<Map<number, AttendanceStatus>>(
    new Map()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Only show enrollments with "confirmed" status (not already marked)
  const pendingEnrollments = enrollments.filter((e) => e.status === "confirmed");

  const handleStatusChange = (enrollmentId: number, status: AttendanceStatus) => {
    const newMap = new Map(attendanceMap);
    newMap.set(enrollmentId, status);
    setAttendanceMap(newMap);
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const newMap = new Map<number, AttendanceStatus>();
    pendingEnrollments.forEach((e) => {
      newMap.set(e.id, status);
    });
    setAttendanceMap(newMap);
  };

  const handleSubmit = async () => {
    if (attendanceMap.size === 0) {
      setErrorMessage("Please mark attendance for at least one client");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const attendanceData = Array.from(attendanceMap.entries()).map(
        ([enrollment_id, status]) => ({
          enrollment_id,
          status,
        })
      );

      const result = await markAttendance(accessToken, sessionId, attendanceData);

      setSuccessMessage(
        `Attendance marked for ${result.updated_count} client(s). ` +
          (result.refunds_processed > 0
            ? `${result.refunds_processed} refund(s) processed.`
            : "")
      );

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error("Failed to mark attendance:", error);
      setErrorMessage(error.message || "Failed to mark attendance. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case "attended":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "no_show_client":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      case "session_cancelled":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    }
  };

  const getStatusLabel = (status: AttendanceStatus) => {
    switch (status) {
      case "attended":
        return "Attended";
      case "no_show_client":
        return "No-show";
      case "session_cancelled":
        return "Cancelled";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Mark Attendance</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {sessionTitle} • {sessionDate} at {sessionTime}
          </DialogDescription>
        </DialogHeader>

        {pendingEnrollments.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto size-12 text-emerald-500 mb-3" />
            <p className="text-zinc-400">
              All enrollments for this session have been marked.
            </p>
          </div>
        ) : (
          <>
            {/* Quick Actions */}
            <div className="flex items-center gap-2 py-3 border-b border-zinc-800">
              <span className="text-sm text-zinc-400 mr-2">Mark all as:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAll("attended")}
                className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
              >
                <CheckCircle2 className="size-3.5 mr-1.5" />
                Attended
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAll("no_show_client")}
                className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
              >
                <XCircle className="size-3.5 mr-1.5" />
                No-show
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAll("session_cancelled")}
                className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
              >
                <AlertTriangle className="size-3.5 mr-1.5" />
                Session Cancelled
              </Button>
            </div>

            {/* Enrollments List */}
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {pendingEnrollments.map((enrollment) => {
                const selectedStatus = attendanceMap.get(enrollment.id);

                return (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/5"
                  >
                    {/* Client Info */}
                    <div className="flex items-center gap-3">
                      <Users className="size-4 text-zinc-500" />
                      <span className="text-white font-medium">
                        {enrollment.client_name}
                      </span>
                    </div>

                    {/* Status Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant={
                          selectedStatus === "attended" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          handleStatusChange(enrollment.id, "attended")
                        }
                        className={
                          selectedStatus === "attended"
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                            : "text-zinc-400 border-zinc-700 hover:text-emerald-400 hover:border-emerald-500/30"
                        }
                      >
                        <CheckCircle2 className="size-3.5 mr-1.5" />
                        Attended
                      </Button>
                      <Button
                        variant={
                          selectedStatus === "no_show_client"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          handleStatusChange(enrollment.id, "no_show_client")
                        }
                        className={
                          selectedStatus === "no_show_client"
                            ? "bg-rose-500 hover:bg-rose-600 text-white"
                            : "text-zinc-400 border-zinc-700 hover:text-rose-400 hover:border-rose-500/30"
                        }
                      >
                        <XCircle className="size-3.5 mr-1.5" />
                        No-show
                      </Button>
                      <Button
                        variant={
                          selectedStatus === "session_cancelled"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          handleStatusChange(enrollment.id, "session_cancelled")
                        }
                        className={
                          selectedStatus === "session_cancelled"
                            ? "bg-amber-500 hover:bg-amber-600 text-white"
                            : "text-zinc-400 border-zinc-700 hover:text-amber-400 hover:border-amber-500/30"
                        }
                      >
                        <AlertTriangle className="size-3.5 mr-1.5" />
                        Cancelled
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Info Messages */}
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="size-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Attended:</strong> Transaction complete, no refund
                </span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <XCircle className="size-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>No-show:</strong> You keep the payment, no refund
                </span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <AlertTriangle className="size-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Session Cancelled:</strong> Full refund processed automatically
                </span>
              </div>
            </div>

            {/* Error/Success Messages */}
            {errorMessage && (
              <div className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                {successMessage}
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-600"
          >
            Cancel
          </Button>
          {pendingEnrollments.length > 0 && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || attendanceMap.size === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                `Mark Attendance (${attendanceMap.size})`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
