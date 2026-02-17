"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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

type ContentType = "text" | "link" | "photo" | "video";

export default function RegionContentComposer({ regionId }: { regionId: string }) {
  const router = useRouter();
  const [type, setType] = useState<ContentType>("text");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const needsUrl = useMemo(() => type !== "text", [type]);

  const submit = async () => {
    try {
      setIsLoading(true);

      const res = await fetch(`/api/regions/${regionId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title || undefined,
          body: body || undefined,
          url: needsUrl ? url || undefined : undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as any;
        toast.error(data?.error || "Failed to create content");
        return;
      }

      setTitle("");
      setBody("");
      setUrl("");
      toast.success("Saved");
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Failed to create content");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-md border p-4">
      <div className="flex flex-col gap-3">
        <div className="grid gap-2">
          <div className="text-sm font-medium">Type</div>
          <Select value={type} onValueChange={(v) => setType(v as ContentType)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="link">Link</SelectItem>
              <SelectItem value="photo">Photo link</SelectItem>
              <SelectItem value="video">Video link</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <div className="text-sm font-medium">Title</div>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        </div>

        <div className="grid gap-2">
          <div className="text-sm font-medium">Text</div>
          <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write something" />
        </div>

        {needsUrl ? (
          <div className="grid gap-2">
            <div className="text-sm font-medium">URL</div>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>
        ) : null}

        <Button disabled={isLoading} onClick={submit}>
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
