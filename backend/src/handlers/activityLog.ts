/**
 * GET /api/projects/:projectId/activity-log
 * Returns activity log entries for the project.
 *
 * POST /api/projects/:projectId/activity-log
 * Body: threadId?, type?, message, meta?
 * Appends an activity log entry.
 */
import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { randomUUID } from "crypto";

export async function getActivityLog(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;

    const entries = await prisma.activityLog.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const payload = [...entries].reverse().map((e) => ({
      id: e.id,
      threadId: e.threadId,
      type: e.type,
      message: e.message,
      timestamp: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
      meta: e.meta ? (JSON.parse(e.meta) as Record<string, unknown>) : undefined,
    }));

    res.json(payload);
  } catch (err) {
    console.error("getActivityLog", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

interface AddActivityLogBody {
  threadId?: string;
  type?: string;
  message: string;
  meta?: Record<string, unknown>;
}

export async function addActivityLogEntry(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    if (!req.body || typeof req.body !== "object") {
      res.status(400).json({ error: "Missing or invalid request body" });
      return;
    }
    const body = req.body as AddActivityLogBody;
    const { threadId, type, message, meta } = body;

    if (!message) {
      res.status(400).json({ error: "Required: message" });
      return;
    }

    const entry = await prisma.activityLog.create({
      data: {
        id: randomUUID(),
        projectId,
        threadId: threadId ?? null,
        type: type ?? "generic",
        message,
        meta: meta ? JSON.stringify(meta) : null,
      },
    });

    const count = await prisma.activityLog.count({ where: { projectId } });
    if (count > 500) {
      const toDelete = await prisma.activityLog.findMany({
        where: { projectId },
        orderBy: { createdAt: "asc" },
        take: count - 500,
        select: { id: true },
      });
      await prisma.activityLog.deleteMany({
        where: { id: { in: toDelete.map((e) => e.id) } },
      });
    }

    res.status(201).json({
      id: entry.id,
      threadId: entry.threadId,
      type: entry.type,
      message: entry.message,
      timestamp: entry.createdAt instanceof Date ? entry.createdAt.toISOString() : entry.createdAt,
      meta: entry.meta ? (JSON.parse(entry.meta) as Record<string, unknown>) : undefined,
    });
  } catch (err) {
    console.error("addActivityLogEntry", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
