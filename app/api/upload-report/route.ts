import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getHistoryIndexKey, getSharedSnapshotKey, mergeCompletionReport } from "@/lib/report-upload";
import type { DashboardSnapshot } from "@/lib/types";

type MinimalR2Bucket = {
  get: (key: string) => Promise<{ text: () => Promise<string> } | null>;
  put: (key: string, value: string, options?: { httpMetadata?: { contentType?: string } }) => Promise<void>;
};

export async function POST(request: Request) {
  const { env } = getCloudflareContext();
  const typedEnv = env as {
    TRAINUAL_DASHBOARD_BUCKET?: MinimalR2Bucket;
    UPLOAD_ADMIN_PASSWORD?: string;
  };

  if (!typedEnv.TRAINUAL_DASHBOARD_BUCKET) {
    return Response.json({ error: "R2 bucket is not configured." }, { status: 500 });
  }

  if (!typedEnv.UPLOAD_ADMIN_PASSWORD) {
    return Response.json({ error: "Upload password is not configured." }, { status: 500 });
  }

  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const file = formData.get("file");

  if (password !== typedEnv.UPLOAD_ADMIN_PASSWORD) {
    return Response.json({ error: "Invalid upload password." }, { status: 401 });
  }

  if (!(file instanceof File)) {
    return Response.json({ error: "Please attach a CSV file." }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    return Response.json({ error: "Only CSV uploads are supported." }, { status: 400 });
  }

  try {
    const csvText = await file.text();
    const snapshot = mergeCompletionReport(csvText, file.name);
    const uploadedAt = snapshot.uploaded_at ?? new Date().toISOString();
    const storageKey = `shared/history/${uploadedAt.replaceAll(":", "-")}.json`;
    const storedSnapshot: DashboardSnapshot = {
      ...snapshot,
      storage_key: storageKey
    };

    const historyObject = await typedEnv.TRAINUAL_DASHBOARD_BUCKET.get(getHistoryIndexKey());
    const currentHistory = historyObject
      ? (JSON.parse(await historyObject.text()) as Array<{
          key: string;
          uploaded_at: string;
          label: string;
          source_filename?: string | null;
        }>)
      : [];

    const nextHistory = [
      {
        key: storageKey,
        uploaded_at: uploadedAt,
        label: `${new Date(uploadedAt).toLocaleString()} - ${file.name}`,
        source_filename: file.name
      },
      ...currentHistory.filter((entry) => entry.key !== storageKey)
    ];

    await typedEnv.TRAINUAL_DASHBOARD_BUCKET.put(
      storageKey,
      JSON.stringify(storedSnapshot),
      {
        httpMetadata: {
          contentType: "application/json"
        }
      }
    );

    await typedEnv.TRAINUAL_DASHBOARD_BUCKET.put(
      getSharedSnapshotKey(),
      JSON.stringify(storedSnapshot),
      {
        httpMetadata: {
          contentType: "application/json"
        }
      }
    );

    await typedEnv.TRAINUAL_DASHBOARD_BUCKET.put(
      getHistoryIndexKey(),
      JSON.stringify(nextHistory),
      {
        httpMetadata: {
          contentType: "application/json"
        }
      }
    );

    return Response.json(storedSnapshot);
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Could not process the uploaded CSV."
      },
      { status: 400 }
    );
  }
}
