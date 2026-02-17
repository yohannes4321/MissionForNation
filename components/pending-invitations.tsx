"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export type PendingInvitationRow = {
  id: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: string;
  regionId: string | null;
};

export default function PendingInvitations({
  invitations,
}: {
  invitations: PendingInvitationRow[];
}) {
  const router = useRouter();
  const [sendingId, setSendingId] = useState<string | null>(null);

  const resend = async (invitationId: string) => {
    try {
      setSendingId(invitationId);
      const res = await fetch(`/api/admin/invitations/${invitationId}/resend`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as any;
        toast.error(data?.error || "Failed to resend invitation");
        return;
      }

      toast.success("Invitation email re-sent");
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Failed to resend invitation");
    } finally {
      setSendingId(null);
    }
  };

  if (invitations.length === 0) {
    return (
      <div className="rounded-md border p-4 text-sm">No pending invitations.</div>
    );
  }

  return (
    <div className="rounded-md border p-4">
      <div className="mb-3 font-medium">Pending invitations</div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Region</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell>{inv.email}</TableCell>
              <TableCell>{inv.role || "-"}</TableCell>
              <TableCell>{inv.status}</TableCell>
              <TableCell>{inv.regionId || "-"}</TableCell>
              <TableCell>{new Date(inv.expiresAt).toLocaleString()}</TableCell>
              <TableCell className="text-right">
                <Button
                  disabled={sendingId === inv.id}
                  onClick={() => resend(inv.id)}
                  size="sm"
                  variant="outline"
                >
                  {sendingId === inv.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Resend"
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
