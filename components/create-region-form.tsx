"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CreateRegionForm({
  organizationId,
}: {
  organizationId: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const create = async () => {
    try {
      setIsLoading(true);

      if (!name.trim()) {
        toast.error("Region name is required");
        return;
      }

      const res = await fetch("/api/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), organizationId }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as any;
        toast.error(data?.error || "Failed to create region");
        return;
      }

      setName("");
      toast.success("Region created");
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Failed to create region");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-md border p-4">
      <div className="font-medium">Create region</div>
      <div className="mt-3 flex gap-2">
        <Input
          placeholder="Region name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button disabled={isLoading} onClick={create}>
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Create"}
        </Button>
      </div>
    </div>
  );
}
