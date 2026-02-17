"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";

type InviteRole =
  | "member"
  | "regional_admin"
  | "admin"
  | "owner"
  | "super_admin";

export default function InviteMemberByEmail({
  organizationId,
}: {
  organizationId: string;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("member");
  const [regionId, setRegionId] = useState<string>("");
  const [regions, setRegions] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  const needsRegion = useMemo(() => role === "regional_admin", [role]);

  useEffect(() => {
    let canceled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/regions?organizationId=${encodeURIComponent(organizationId)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { regions: Array<{ id: string; name: string }> };
        if (!canceled) setRegions(data.regions || []);
      } catch {
        // ignore
      }
    };

    load();
    return () => {
      canceled = true;
    };
  }, [organizationId]);

  const invite = async () => {
    try {
      setIsLoading(true);

      if (!email.trim()) {
        toast.error("Email is required");
        return;
      }

      if (needsRegion && !regionId) {
        toast.error("Select a region for regional_admin");
        return;
      }

      const payload: any = {
        email: email.trim(),
        role,
        organizationId,
      };

      if (needsRegion) {
        payload.regionId = regionId;
      }

      const { error } = await authClient.organization.inviteMember(payload);

      if (error) {
        const msg = String(error.message || "");
        // Better Auth often rejects duplicate pending invites. In that case, resend the existing email.
        if (msg.toLowerCase().includes("already") && msg.toLowerCase().includes("inv")) {
          const res = await fetch("/api/admin/invitations/resend-by-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ organizationId, email: email.trim() }),
          });

          if (res.ok) {
            toast.success("Invitation already existed — email re-sent");
            return;
          }

          const data = (await res.json().catch(() => null)) as any;
          toast.error(data?.error || msg);
          return;
        }

        toast.error(msg);
        return;
      }

      toast.success("Invitation sent");
      setEmail("");
      setRole("member");
      setRegionId("");
    } catch (e) {
      console.error(e);
      toast.error("Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-md border p-4">
      <div className="font-medium">Invite by email</div>
      <div className="mt-3 grid gap-3">
        <Input
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Select value={role} onValueChange={(v) => setRole(v as InviteRole)}>
          <SelectTrigger>
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">member</SelectItem>
            <SelectItem value="regional_admin">regional_admin</SelectItem>
            <SelectItem value="admin">admin</SelectItem>
            <SelectItem value="owner">owner</SelectItem>
            <SelectItem value="super_admin">super_admin</SelectItem>
          </SelectContent>
        </Select>

        {needsRegion ? (
          <Select value={regionId} onValueChange={setRegionId}>
            <SelectTrigger>
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <Button disabled={isLoading} onClick={invite}>
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Send invite"}
        </Button>
      </div>
    </div>
  );
}
