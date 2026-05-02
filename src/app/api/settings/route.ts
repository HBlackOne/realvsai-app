import { NextRequest, NextResponse } from "next/server";
import { getOrCreateCurrentUser } from "@/lib/auth/get-or-create-user";
import { db } from "@/lib/db";

const DEFAULT_SETTINGS = {
  emailNotifications: true,
  scanResultEmails: true,
  marketingEmails: false,
};

const SETTINGS_SELECT = {
  emailNotifications: true,
  scanResultEmails: true,
  marketingEmails: true,
};

type SettingsKey = keyof typeof DEFAULT_SETTINGS;

const SETTINGS_KEYS = Object.keys(DEFAULT_SETTINGS) as SettingsKey[];

function isRetryableSettingsError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: unknown; message?: unknown };
  const code = typeof err.code === "string" ? err.code : "";
  const message = typeof err.message === "string" ? err.message : "";

  return (
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "P1001" ||
    code === "P1002" ||
    message.includes("ETIMEDOUT") ||
    message.includes("Connection terminated") ||
    message.includes("Can't reach database server")
  );
}

async function withSettingsRetry<T>(operation: () => Promise<T>) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryableSettingsError(error) || attempt === 2) break;
      await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
    }
  }

  throw lastError;
}

function serializeSettings(settings: typeof DEFAULT_SETTINGS) {
  return {
    emailNotifications: settings.emailNotifications,
    scanResultEmails: settings.scanResultEmails,
    marketingEmails: settings.marketingEmails,
  };
}

function pickBooleanSettings(body: unknown) {
  const input = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const data: Partial<Record<SettingsKey, boolean>> = {};

  for (const key of SETTINGS_KEYS) {
    if (typeof input[key] === "boolean") {
      data[key] = input[key];
    }
  }

  return data;
}

export async function GET() {
  try {
    const user = await getOrCreateCurrentUser();
    const settings = await withSettingsRetry(() => db.userSettings.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, ...DEFAULT_SETTINGS },
      select: SETTINGS_SELECT,
    }));

    return NextResponse.json({ success: true, data: serializeSettings(settings) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.startsWith("Unauthorized") ? 401 : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getOrCreateCurrentUser();
    const body = await request.json().catch(() => null);
    const data = pickBooleanSettings(body);

    if (!Object.keys(data).length) {
      return NextResponse.json({ success: false, error: "No valid settings were provided." }, { status: 400 });
    }

    const settings = await withSettingsRetry(() => db.userSettings.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id, ...DEFAULT_SETTINGS, ...data },
      select: SETTINGS_SELECT,
    }));

    return NextResponse.json({ success: true, data: serializeSettings(settings) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.startsWith("Unauthorized") ? 401 : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
