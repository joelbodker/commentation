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
}

export async function updateThread(req: Request, res: Response): Promise<void> {
  try {
    const { threadId } = req.params;
    const { status } = req.body as UpdateThreadBody;
    if (!status || (status !== "OPEN" && status !== "RESOLVED")) {
      res.status(400).json({ error: "Body must include status: 'OPEN' or 'RESOLVED'" });
      return;
    }

    const thread = await prisma.thread.update({
      where: { id: threadId },
      data: { status },
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
