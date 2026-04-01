import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSharedSnapshotKey } from "@/lib/report-upload";

type MinimalR2Bucket = {
  get: (key: string) => Promise<{ text: () => Promise<string> } | null>;
};

export async function GET() {
  const { env } = getCloudflareContext();
  const bucket = (env as { TRAINUAL_DASHBOARD_BUCKET?: MinimalR2Bucket }).TRAINUAL_DASHBOARD_BUCKET;

  if (!bucket) {
    return new Response(null, { status: 204 });
  }

  const object = await bucket.get(getSharedSnapshotKey());

  if (!object) {
    return new Response(null, { status: 204 });
  }

  const text = await object.text();
  return new Response(text, {
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store"
    }
  });
}
