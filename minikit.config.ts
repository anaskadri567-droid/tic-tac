const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "",
    payload: "",
    signature: ""
  },
  miniapp: {
    version: "1",
    name: "Tic-Tac-Toe Master", 
    subtitle: "Challenge the Computer", 
    description: "Play tic-tac-toe against a smart AI opponent and share your victories!",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/blue-icon.png`,
    splashImageUrl: `${ROOT_URL}/blue-hero.png`,
    splashBackgroundColor: "#1a1a2e",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["game", "tic-tac-toe", "ai", "strategy", "competitive"],
    heroImageUrl: `${ROOT_URL}/blue-hero.png`, 
    tagline: "Beat the AI, Share Your Victory!",
    ogTitle: "Tic-Tac-Toe Master - Challenge the Computer",
    ogDescription: "Play strategic tic-tac-toe against a smart AI and share your winning streaks with friends!",
    ogImageUrl: `${ROOT_URL}/blue-hero.png`,
  },
} as const;

