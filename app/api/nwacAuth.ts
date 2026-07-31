// Synoptic/NWAC API token, shared by the data-fetch routes.
// ROBERT_NWAC_API_KEY is the existing name in .env.local; it must also be set
// in Vercel project settings. The token used to be hardcoded in five route
// files — it still lives in git history, so rotate it when convenient.
export function nwacAuth(): string {
  const token = process.env.ROBERT_NWAC_API_KEY;
  if (!token) {
    throw new Error(
      'ROBERT_NWAC_API_KEY env var is not set — add it in Vercel project settings',
    );
  }
  return token;
}
