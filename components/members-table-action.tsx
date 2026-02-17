"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { removeMember } from "@/server/members";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Role } from "@/db/schema";

type Props = {
  memberId: string;
  organizationId: string;
  currentRole: string;
  currentRegionId: string | null;
};

export default function MembersTableAction({
  memberId,
  organizationId,
  currentRole,
  currentRegionId,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const [role, setRole] = useState<Role>((currentRole as Role) ?? "member");
  const [regionId, setRegionId] = useState<string>(currentRegionId ?? "");
  const [regions, setRegions] = useState<Array<{ id: string; name: string }>>(
    []
  );

  const needsRegion = useMemo(() => role === "regional_admin", [role]);

  useEffect(() => {
    setRole((currentRole as Role) ?? "member");
    setRegionId(currentRegionId ?? "");
  }, [currentRole, currentRegionId]);

  useEffect(() => {
    let canceled = false;

    const loadRegions = async () => {
      try {
        const res = await fetch(
          `/api/regions?organizationId=${encodeURIComponent(organizationId)}`
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          regions: Array<{ id: string; name: string }>;
        };
        if (!canceled) setRegions(data.regions || []);
      } catch {
        // ignore
      }
    };

    loadRegions();
    return () => {
      canceled = true;
    };
  }, [organizationId]);

  const save = async () => {
    try {
      setIsSaving(true);

      const payload: { role: Role; regionId?: string | null } = {
        role,
      };

      if (needsRegion) {
        if (!regionId) {
          toast.error("Select a region for regional_admin");
          return;
        }
        payload.regionId = regionId;
      } else {
        payload.regionId = null;
      }

      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as any;
        toast.error(data?.error || "Failed to update role");
        return;
      }

      toast.success("Member updated");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update member");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = async () => {
    try {
      setIsLoading(true);
      const { success, error } = await removeMember(memberId);

      if (!success) {
        toast.error(error || "Failed to remove member");
        return;
      }

      setIsLoading(false);
      toast.success("Member removed from organization");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove member from organization");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Select value={role} onValueChange={(v) => setRole(v as Role)}>
        <SelectTrigger className="h-8 w-[150px]">
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
          <SelectTrigger className="h-8 w-[160px]">
            <SelectValue placeholder="Region" />
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

      <Button disabled={isSaving} onClick={save} size="sm" variant="outline">
        {isSaving ? <Loader2 className="size-4 animate-spin" /> : "Save"}
      </Button>

      <Button
        disabled={isLoading}
        onClick={handleRemoveMember}
        size="sm"
        variant="destructive"
      >
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Remove"}
      </Button>
    </div>
  );
}
