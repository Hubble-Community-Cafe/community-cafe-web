import { defineConfig, devices } from '@playwright/test'

/**
 * Service URLs. Defaults match docker-compose.e2e.yml's published ports, but can be
 * overridden (e.g. when pointing the suite at an already-running stack or staging).
 */
export const HUBBLE_BASE_URL = process.env.HUBBLE_BASE_URL ?? 'http://localhost:6173'
export const METEOR_BASE_URL = process.env.METEOR_BASE_URL ?? 'http://localhost:6175'
export const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL ?? 'http://localhost:6174'
export const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080'

// CI builds all images from scratch, so allow plenty of time for the stack to come up.
const WEBSERVER_TIMEOUT = process.env.CI ? 600_000 : 240_000

export default defineConfig({
  testDir: './tests',
  // The suite shares one backend + database, so tests run serially for isolation.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['html', { open: 'never' }], ['list']],
  use: {
    // A replayable trace for every run; specs also attach curated screenshots/snapshots.
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  /**
   * Boot the full e2e stack (MariaDB + backend[e2e] + both public sites + admin) before
   * the run. Set E2E_NO_WEBSERVER=1 to skip when the stack is already running locally
   * (e.g. `npm run stack:up` in another terminal) for faster iteration.
   */
  webServer: process.env.E2E_NO_WEBSERVER
    ? undefined
    : [
        {
          command: 'docker compose -f ../docker-compose.e2e.yml up --build',
          url: `${BACKEND_URL}/actuator/health`,
          reuseExistingServer: !process.env.CI,
          timeout: WEBSERVER_TIMEOUT,
        },
        {
          // Wait for each frontend's nginx to actually serve (they come up after the API).
          command: 'node -e "setInterval(() => {}, 1 << 30)"',
          url: HUBBLE_BASE_URL,
          reuseExistingServer: true,
          timeout: WEBSERVER_TIMEOUT,
        },
        {
          command: 'node -e "setInterval(() => {}, 1 << 30)"',
          url: METEOR_BASE_URL,
          reuseExistingServer: true,
          timeout: WEBSERVER_TIMEOUT,
        },
        {
          command: 'node -e "setInterval(() => {}, 1 << 30)"',
          url: ADMIN_BASE_URL,
          reuseExistingServer: true,
          timeout: WEBSERVER_TIMEOUT,
        },
      ],

  projects: [
    {
      name: 'public-hubble',
      testDir: './tests/public-hubble',
      use: { ...devices['Desktop Chrome'], baseURL: HUBBLE_BASE_URL },
    },
    {
      name: 'public-meteor',
      testDir: './tests/public-meteor',
      use: { ...devices['Desktop Chrome'], baseURL: METEOR_BASE_URL },
    },
    {
      name: 'admin',
      testDir: './tests/admin',
      use: { ...devices['Desktop Chrome'], baseURL: ADMIN_BASE_URL },
    },
    {
      // Pixel 5 is Chromium-based, so the mobile projects need only chromium.
      name: 'mobile-hubble',
      testDir: './tests/mobile-hubble',
      use: { ...devices['Pixel 5'], baseURL: HUBBLE_BASE_URL },
    },
    {
      name: 'mobile-meteor',
      testDir: './tests/mobile-meteor',
      use: { ...devices['Pixel 5'], baseURL: METEOR_BASE_URL },
    },
  ],
})
