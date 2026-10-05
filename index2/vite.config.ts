import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Telefonda test edebilmek için server.host = true.
// Bu ayar sayesinde "npm run dev" komutu zaten yerel ağda erişilebilir
// olur; README'de anlatılan "--host" bayrağına ayrıca gerek kalmaz,
// ama istenirse yine de çalışır.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 0.0.0.0 üzerinde dinler -> aynı Wi-Fi'deki telefon erişebilir
    port: 5173,
  },
});
