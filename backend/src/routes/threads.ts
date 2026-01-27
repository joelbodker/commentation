/**
 * Thread-scoped routes: get thread, add comment, update status.
 */
import { Router } from "express";
import { getThread, addComment, updateThread } from "../handlers/threads.js";

export const threadsRouter = Router();

threadsRouter.get("/:threadId", getThread);
threadsRouter.post("/:threadId/comments", addComment);
threadsRouter.patch("/:threadId", updateThread);
