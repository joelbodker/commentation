/**
 * Project-scoped routes: list threads for a page, create thread + first comment, activity log.
 */
import { Router } from "express";
import { listThreads, createThread, deleteResolvedThreads } from "../handlers/projects.js";
import { getActivityLog, addActivityLogEntry } from "../handlers/activityLog.js";

export const projectsRouter = Router();

projectsRouter.get("/:projectId/threads", listThreads);
projectsRouter.post("/:projectId/threads", createThread);
projectsRouter.delete("/:projectId/threads", deleteResolvedThreads);
projectsRouter.get("/:projectId/activity-log", getActivityLog);
projectsRouter.post("/:projectId/activity-log", addActivityLogEntry);