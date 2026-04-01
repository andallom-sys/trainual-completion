import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getHistoryIndexKey } from "@/lib/report-upload";

type MinimalR2Bucket = {
  get: (key: string) => Promise<{ text: () => Promise<string> } | null>;
};

export async function GET() {
  const { env } = getCloudflareContext();
  const bucket = (env as { TRAINUAL_DASHBOARD_BUCKET?: MinimalR2Bucket }).TRAINUAL_DASHBOARD_BUCKET;

  if (!bucket) {
    return new Response("[]", {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store"
      }
    });
  }

  const object = await bucket.get(getHistoryIndexKey());

  if (!object) {
    return new Response("[]", {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store"
      }
    });
  }

  return new Response(await object.text(), {
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store"
    }
  });
}
