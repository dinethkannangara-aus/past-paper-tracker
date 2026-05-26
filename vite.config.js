import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const githubPagesBase = process.env.GITHUB_PAGES_BASE || "/past-paper-tracker/";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? githubPagesBase : "/",
}));
