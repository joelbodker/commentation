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
    const includeResolved = req.query.includeResolved === "true";

    if (!pageUrl) {
      res.status(400).json({ error: "pageUrl query param is required" });
      return;
    }

    const where: { projectId: string; pageUrl: string; status?: string } = {
      projectId,
      pageUrl,
    };
    if (!includeResolved) {
      where.status = "OPEN";
    }

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
      status: t.status,
      createdBy: t.createdBy,
      createdAt: t.createdAt,
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
  body: string;
  createdBy: string;
}

export async function createThread(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const body = req.body as CreateThreadBody;
    const { pageUrl, selector, xPercent, yPercent, body: commentBody, createdBy } = body;

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
    res.status(201).json(thread);
  } catch (err) {
    console.error("createThread", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
