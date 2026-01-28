/**
 * Project-scoped routes: list threads for a page, create thread + first comment.
 */
import { Router } from "express";
import { listThreads, createThread, deleteResolvedThreads } from "../handlers/projects.js";

export const projectsRouter = Router();

projectsRouter.get("/:projectId/threads", listThreads);
projectsRouter.post("/:projectId/threads", createThread);
projectsRouter.delete("/:projectId/threads", deleteResolvedThreads);