import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { validateCsrfOrigin, redactSensitive } from "@/lib/security";
import { rateLimiter, getClientIp } from "@/lib/rate-limit";
import { isStaffOrAdmin } from "@/lib/reports";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

// Allowed extensions whitelist
const ALLOWED_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".pdf",
  ".txt",
  ".log",
  ".json",
  ".csv",
  ".zip",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Megabytes

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!validateCsrfOrigin(request)) {
    return NextResponse.json({ error: "CSRF verification failed" }, { status: 403 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to upload attachments." },
        { status: 401 }
      );
    }

    const clientIp = getClientIp(request);
    const rateLimit = rateLimiter.check(`report_upload_${clientIp}`, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Upload rate limit reached. Please wait a moment." },
        { status: 429 }
      );
    }

    const reportId = parseInt(params.id, 10);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    const report = await queryOne(
      "SELECT id, user_id, attachments_allowed FROM data_loss_reports WHERE id = $1",
      [reportId]
    );

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const staff = isStaffOrAdmin(user);
    if (!staff && String(report.user_id) !== String(user.id)) {
      return NextResponse.json(
        { error: "Access Denied: You cannot upload files to this report." },
        { status: 403 }
      );
    }

    // Strict security lock: Members cannot upload unless staff granted permission
    if (!staff && !report.attachments_allowed) {
      return NextResponse.json(
        {
          error:
            "Attachment permissions are currently locked. Support staff must grant upload permission in this chat before files can be sent.",
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds maximum size limit (10MB)." },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          error: `File type "${ext || "unknown"}" is not permitted. Allowed types: PNG, JPG, GIF, WEBP, PDF, TXT, LOG, JSON, CSV, ZIP.`,
        },
        { status: 400 }
      );
    }

    const safeBaseName = path
      .basename(file.name, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 30);
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const finalFileName = `${safeBaseName}_${uniqueSuffix}${ext}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "reports");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const targetPath = path.join(uploadsDir, finalFileName);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fs.promises.writeFile(targetPath, buffer);

    const publicUrl = `/uploads/reports/${finalFileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
    });
  } catch (error: any) {
    console.error("Report Upload Error:", redactSensitive(error.message || ""));
    return NextResponse.json({ error: "Failed to upload attachment." }, { status: 500 });
  }
}
