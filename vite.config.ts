import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		{
			name: "local-file-server",
			configureServer(server) {
				server.middlewares.use("/api/local-file", (req, res) => {
					const url = new URL(req.url || "", "http://localhost");
					const filePath = url.searchParams.get("path");
					if (!filePath || !filePath.startsWith("/")) {
						res.statusCode = 400;
						res.end("Missing or invalid path");
						return;
					}
					const ext = path.extname(filePath).toLowerCase();
					const mimeTypes: Record<string, string> = {
						".png": "image/png",
						".jpg": "image/jpeg",
						".jpeg": "image/jpeg",
						".gif": "image/gif",
						".svg": "image/svg+xml",
						".webp": "image/webp",
						".pdf": "application/pdf",
					};
					const contentType = mimeTypes[ext] || "application/octet-stream";
					try {
						const data = fs.readFileSync(filePath);
						res.setHeader("Content-Type", contentType);
						res.setHeader("Cache-Control", "public, max-age=3600");
						res.end(data);
					} catch {
						res.statusCode = 404;
						res.end("File not found");
					}
				});
			},
		},
	],
	server: {
		proxy: {
			"/hooks": {
				target: "http://127.0.0.1:18789",
				changeOrigin: true,
			},
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
