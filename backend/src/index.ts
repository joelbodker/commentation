/**
 * Figma-style comments API.
 * Reads PORT and DATABASE_URL from env. CORS enabled for dev.
 */
import express from "express";
import cors from "cors";
import { threadsRouter } from "./routes/threads.js";
import { projectsRouter } from "./routes/projects.js";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors({ origin: true })); // relaxed for dev
app.use(express.json());

app.use("/api/projects", projectsRouter);
app.use("/api/threads", threadsRouter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use((err: unknown, _req: express.Request, res: express.Response) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Comments API listening on http://localhost:${PORT}`);
});
