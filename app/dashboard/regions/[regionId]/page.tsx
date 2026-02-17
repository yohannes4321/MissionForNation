import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { content, member, region } from "@/db/schema";
import { getCurrentUser } from "@/server/users";
import RegionContentComposer from "@/components/region-content-composer";

type Params = Promise<{ regionId: string }>;

export default async function RegionPage({ params }: { params: Params }) {
  const { regionId } = await params;
  const session = await getCurrentUser();

  const regionRecord = await db.query.region.findFirst({
    where: eq(region.id, regionId),
  });

  if (!regionRecord) {
    redirect("/dashboard");
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, regionRecord.organizationId),
      eq(member.userId, session.currentUser.id)
    ),
  });

  if (!membership) {
    redirect("/dashboard");
  }

  const canAccessRegion =
    membership.role === "super_admin" ||
    membership.role === "owner" ||
    membership.role === "admin" ||
    (membership.role === "regional_admin" && membership.regionId === regionId);

  if (!canAccessRegion) {
    redirect("/dashboard");
  }

  const items = await db.query.content.findMany({
    where: eq(content.regionId, regionId),
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 py-10">
      <h1 className="font-bold text-2xl">Region: {regionRecord.name}</h1>
      <RegionContentComposer regionId={regionId} />

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-md border p-4">
            <div className="text-sm text-muted-foreground">{item.type}</div>
            {item.title ? <div className="font-medium">{item.title}</div> : null}
            {item.body ? <div className="text-sm whitespace-pre-wrap">{item.body}</div> : null}
            {item.url ? (
              <a className="text-sm underline" href={item.url} target="_blank" rel="noreferrer">
                {item.url}
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
