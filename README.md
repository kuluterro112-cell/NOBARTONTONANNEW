This is the Nobar Tontonan streaming catalogue built with Next.js and Firebase Authentication.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Firebase Setup

- Copy `.env.local.example` to `.env.local` and fill in the TMDB and Firebase web app values from your Firebase project settings. Keep `.env.local` private; it is excluded from Git.
- Set the licensed anime provider's base URL, API key, and endpoint paths in `.env.local` for home, schedule, details, complete/ongoing anime, genres, episodes, search, batch, stream server, and all anime. Keep the key server-side in `ANIME_API_KEY`; never rename it to a `NEXT_PUBLIC_*` variable. Replace the example paths and `{slug}`, `{page}`, `{keyword}`, and `{serverId}` placeholders with the provider's documented routes. The server-side anime catalogue and playback routes use this configuration.
- Enable **Authentication > Sign-in method > Email/Password** in Firebase Console.
- Add the local and production hostnames under **Authentication > Settings > Authorized domains**.
- Create a Cloud Firestore database and publish the rules from `firestore.rules`.
- `app/lib/avatar-options.ts` is the admin-managed allowlist for the bundled avatar images in `public/avatars`. Add an image to that list and allow its path in `firestore.rules` to offer it to users.
- User profile documents are stored at `users/{uid}` and can only be read or updated by the matching signed-in user.
- A signed-in user earns 150 points once per movie or anime episode when its player starts. The first level requires 150 points; each next level requires three times as many points as the previous level, up to level 1,000,000. Profiles display the rank earned from the current level: Novice (1–1,000), Bronze (1,001–5,000), Silver (5,001–15,000), Gold (15,001–40,000), Platinum (40,001–90,000), Diamond (90,001–200,000), Master (200,001–400,000), Grandmaster (400,001–700,000), Legend (700,001–950,000), and Mythic Divine (950,001–1,000,000). Admins can set any user's level or rank (including their own) from the admin panel; setting a rank starts the account at that rank's minimum level. Publish the updated `firestore.rules` to enable point rewards and admin level/rank changes.
- The home catalogue includes Japanese animation titles from the configured anime provider as well as titles discovered through TMDB. Anime detail pages show official watch-provider links when available.

For a licensed video provider, set `VIDEO_PROVIDER_EMBED_TEMPLATE` and the exact comma-separated `VIDEO_PROVIDER_EMBED_HOSTS` in `.env.local`. The URL template may use `{id}` for the TMDB id and `{type}` for `movie` or `tv`. The server only returns HTTPS URLs whose hostname is on that allowlist. Restart the dev server after changing environment variables.

Registration sends a Firebase email verification link. Users must verify the address before the app accepts their login. Firebase Auth uses browser-local persistence.

### Admin Panel

- Admins are listed by email in `app/lib/admin-emails.ts` and must use a verified Firebase Auth email.
- Keep the same allowlist synchronized in `firestore.rules`, then publish the rules in Firebase Console. No service account or custom admin claim is required.
- Open `/admin` to add public HTTPS avatar image URLs, remove unused avatars, search registered users, and ban/unban accounts.
- The admin panel also manages profile banner videos. It accepts HTTPS links from YouTube, Vimeo, Dailymotion, Google Drive, direct `.mp4`/`.webm`/`.ogg` files, and other providers' HTTPS embed links. Whether an external video plays depends on that provider's embed/privacy settings. Users can only choose videos in this catalog. Publish the updated `firestore.rules` so profile banner selections and catalog permissions work.
- User records are created during registration. Accounts created before this feature appear after their next successful login.

## Learn More

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
