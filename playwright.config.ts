import { defineConfig, devices } from "@playwright/test";

const port = 3101;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: ".next/playwright-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NODE_ENV: "development",
      VERCEL_ENV: "development",
      DATABASE_URL: "postgresql://e2e:e2e@127.0.0.1:65432/cencom_e2e",
      BETTER_AUTH_SECRET: "local-e2e-only-secret-not-for-production-000000000000",
      BETTER_AUTH_URL: baseURL,
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
      SMTP_USER: "",
      SMTP_APP_PASSWORD: "",
      WEB_PUSH_VAPID_PUBLIC_KEY: "",
      WEB_PUSH_VAPID_PRIVATE_KEY: "",
    },
  },
});
