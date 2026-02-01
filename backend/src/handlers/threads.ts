/**
 * GET /api/threads/:threadId – thread + all comments
 * POST /api/threads/:threadId/comments – add comment
 * PATCH /api/threads/:threadId – update status (OPEN | RESOLVED)
 */
import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { randomUUID } from "crypto";

export async function getThread(req: Request, res: Response): Promise<void> {
  try {
    const { threadId } = req.params;
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: { comments: { orderBy: { createdAt: "asc" } } },
    });
    if (!thread) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }
    res.json(thread);
  } catch (err) {
    console.error("getThread", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

interface AddCommentBody {
  body: string;
  createdBy: string;
}

export async function addComment(req: Request, res: Response): Promise<void> {
  try {
    const { threadId } = req.params;
    const { body, createdBy } = req.body as AddCommentBody;
    if (!body || !createdBy) {
      res.status(400).json({ error: "Required: body, createdBy" });
      return;
    }

    const exists = await prisma.thread.findUnique({ where: { id: threadId } });
    if (!exists) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        id: randomUUID(),
        threadId,
        body,
        createdBy,
      },
    });
    res.status(201).json(comment);
  } catch (err) {
    console.error("addComment", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

interface UpdateThreadBody {
  status?: "OPEN" | "RESOLVED";
  resolvedBy?: string;
  assignedTo?: string | null;
  assignedBy?: string | null;
  selector?: string;
  xPercent?: number;
  yPercent?: number;
  offsetRatioX?: number;
  offsetRatioY?: number;
}

export async function updateThread(req: Request, res: Response): Promise<void> {
  try {
    const { threadId } = req.params;
    const body = req.body as UpdateThreadBody;
    const { status, resolvedBy, assignedTo, assignedBy, selector, xPercent, yPercent, offsetRatioX, offsetRatioY } = body;

    const data: {
      status?: string;
      resolvedBy?: string | null;
      resolvedAt?: Date | null;
      assignedTo?: string | null;
      assignedBy?: string | null;
      assignedAt?: Date | null;
      selector?: string;
      xPercent?: number;
      yPercent?: number;
      offsetRatioX?: number | null;
      offsetRatioY?: number | null;
    } = {};

    if (status !== undefined) {
      if (status !== "OPEN" && status !== "RESOLVED") {
        res.status(400).json({ error: "status must be 'OPEN' or 'RESOLVED'" });
        return;
      }
      data.status = status;
      if (status === "RESOLVED") {
        data.resolvedBy = resolvedBy ?? null;
        data.resolvedAt = new Date();
      } else {
        data.resolvedBy = null;
        data.resolvedAt = null;
      }
    }

    if (assignedTo !== undefined) {
      data.assignedTo = assignedTo ?? null;
      data.assignedBy = assignedBy ?? null;
      data.assignedAt = assignedTo != null && assignedTo !== "" ? new Date() : null;
    }

    if (selector !== undefined) data.selector = selector;
    if (xPercent !== undefined) data.xPercent = xPercent;
    if (yPercent !== undefined) data.yPercent = yPercent;
    if (offsetRatioX !== undefined) data.offsetRatioX = offsetRatioX ?? null;
    if (offsetRatioY !== undefined) data.offsetRatioY = offsetRatioY ?? null;

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: "Body must include at least one field to update" });
      return;
    }

    const thread = await prisma.thread.update({
      where: { id: threadId },
      data,
    });
    res.json(thread);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2025") {
      res.status(404).json({ error: "Thread not found" });
      return;
    }
    console.error("updateThread", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/** DELETE /api/threads/:threadId – delete a single thread and its comments. */
export async function deleteThread(req: Request, res: Response): Promise<void> {
  try {
    const { threadId } = req.params;
    await prisma.thread.delete({
      where: { id: threadId },
    });
    res.status(204).send();
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2025") {
      res.status(404).json({ error: "Thread not found" });
      return;
    }
    console.error("deleteThread", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
