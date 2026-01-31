/**
 * GET /api/projects/:projectId/threads
 * Query: pageUrl (required), includeResolved (optional, default false)
 * Returns threads with latest comment snippet and comment count.
 *
 * POST /api/projects/:projectId/threads
 * Body: pageUrl, selector, xPercent, yPercent, body, createdBy
 * Creates project if missing, then thread + first comment.
 */
import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { randomUUID } from "crypto";

export async function listThreads(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const pageUrl = req.query.pageUrl as string | undefined;
    const statusFilter = (req.query.status as string) || "open"; // "open" | "resolved" | "all"

    if (!pageUrl) {
      res.status(400).json({ error: "pageUrl query param is required" });
      return;
    }

    const where: { projectId: string; pageUrl: string; status?: string } = {
      projectId,
      pageUrl,
    };
    if (statusFilter === "open") where.status = "OPEN";
    else if (statusFilter === "resolved") where.status = "RESOLVED";

    const threads = await prisma.thread.findMany({
      where,
      include: {
        comments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const payload = threads.map((t: (typeof threads)[number]) => ({
      id: t.id,
      projectId: t.projectId,
      pageUrl: t.pageUrl,
      selector: t.selector,
      xPercent: t.xPercent,
      yPercent: t.yPercent,
      offsetRatioX: (t as { offsetRatioX?: number }).offsetRatioX ?? undefined,
      offsetRatioY: (t as { offsetRatioY?: number }).offsetRatioY ?? undefined,
      status: t.status,
      createdBy: t.createdBy,
      createdAt: t.createdAt,
      resolvedBy: t.resolvedBy ?? null,
      resolvedAt: t.resolvedAt ? t.resolvedAt.toISOString() : null,
      assignedTo: (t as { assignedTo?: string | null }).assignedTo ?? null,
      assignedBy: (t as { assignedBy?: string | null }).assignedBy ?? null,
      assignedAt: (t as { assignedAt?: Date | null }).assignedAt
        ? (t as { assignedAt: Date }).assignedAt.toISOString()
        : null,
      latestComment: t.comments[0] ?? null,
      commentCount: t._count.comments,
    }));

    res.json(payload);
  } catch (err) {
    console.error("listThreads", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

interface CreateThreadBody {
  pageUrl: string;
  selector: string;
  xPercent: number;
  yPercent: number;
  offsetRatioX?: number;
  offsetRatioY?: number;
  body: string;
  createdBy: string;
}

export async function createThread(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    if (!req.body || typeof req.body !== "object") {
      res.status(400).json({ error: "Missing or invalid request body" });
      return;
    }
    const body = req.body as CreateThreadBody;
    const { pageUrl, selector, xPercent, yPercent, offsetRatioX, offsetRatioY, body: commentBody, createdBy } = body;

    if (!pageUrl || selector == null || xPercent == null || yPercent == null || !commentBody || !createdBy) {
      res.status(400).json({
        error: "Required: pageUrl, selector, xPercent, yPercent, body, createdBy",
      });
      return;
    }

    const threadId = randomUUID();
    const commentId = randomUUID();

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.project.upsert({
        where: { id: projectId },
        create: { id: projectId },
        update: {},
      });
      await tx.thread.create({
        data: {
          id: threadId,
          projectId,
          pageUrl,
          selector,
          xPercent: Number(xPercent),
          yPercent: Number(yPercent),
          offsetRatioX: typeof offsetRatioX === "number" ? offsetRatioX : undefined,
          offsetRatioY: typeof offsetRatioY === "number" ? offsetRatioY : undefined,
          status: "OPEN",
          createdBy,
          comments: {
            create: {
              id: commentId,
              body: commentBody,
              createdBy,
            },
          },
        },
      });
    });

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: { comments: { orderBy: { createdAt: "asc" } } },
    });

    if (!thread) {
      res.status(500).json({ error: "Thread created but not found" });
      return;
    }

    const t = thread as { assignedAt?: Date | null };
    const payload = {
      ...thread,
      createdAt: thread.createdAt instanceof Date ? thread.createdAt.toISOString() : thread.createdAt,
      resolvedAt: thread.resolvedAt instanceof Date ? thread.resolvedAt.toISOString() : thread.resolvedAt ?? null,
      assignedAt: t.assignedAt instanceof Date ? t.assignedAt.toISOString() : t.assignedAt ?? null,
      comments: (thread.comments ?? []).map((c) => ({
        ...c,
        createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
      })),
    };
    res.status(201).json(payload);
  } catch (err) {
    console.error("createThread", err);
    const msg = err instanceof Error ? err.message : String(err);
    const meta = err && typeof err === "object" && "meta" in err ? (err as { meta: unknown }).meta : undefined;
    res.status(500).json({
      error: "Internal server error",
      ...(process.env.NODE_ENV !== "production" && { detail: msg, meta }),
    });
  }
}

/**
 * DELETE /api/projects/:projectId/threads?pageUrl=...&status=resolved
 * Deletes all resolved threads for that project + pageUrl.
 */
export async function deleteResolvedThreads(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const pageUrl = req.query.pageUrl as string | undefined;
    if (!pageUrl) {
      res.status(400).json({ error: "pageUrl query param is required" });
      return;
    }

    const result = await prisma.thread.deleteMany({
      where: { projectId, pageUrl, status: "RESOLVED" },
    });

    res.json({ deleted: result.count });
  } catch (err) {
    console.error("deleteResolvedThreads", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
