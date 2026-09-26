# Live music

The notebook stays a static GitHub Pages site. This small Cloudflare Worker reads
only the owner's current Spotify playback. Visitors never sign in. Credentials
stay in Worker secrets; the browser receives just title, album, artist, artwork,
and the Spotify link. A paused track, ad, podcast, or no active session shows an
empty Polaroid. Errors clear the track rather than claiming stale music is live.

## Connect locally

1. In your Spotify Developer app, select Web API and add exactly
   `http://127.0.0.1:8888/callback` to Redirect URIs.
2. Create `services/spotify/.dev.vars` (ignored by git):
   ```dotenv
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   ```
3. Run `node services/spotify/authorize.mjs`, then open its authorization link.
   Approve `user-read-currently-playing`. The script saves the refresh token in
   `.dev.vars` with owner-only permissions; it never prints tokens.
4. Run `node services/spotify/dev.mjs`. Put this in root `.env.local`:
   ```dotenv
   NEXT_PUBLIC_SPOTIFY_ENDPOINT=http://127.0.0.1:8787/now-playing
   ```
   Restart `npm run dev`. Play a track on Spotify and check the homepage.

## Host the endpoint

With a Cloudflare account, from `services/spotify`:

```sh
npx wrangler login
npx wrangler deploy
npx wrangler secret bulk .dev.vars
```

The endpoint is `https://notebook-music.<your-subdomain>.workers.dev/now-playing`.
The notebook defaults to the deployed endpoint at
`https://notebook-music.leowelliottd23.workers.dev/now-playing`. To use a different
Worker, override `NEXT_PUBLIC_SPOTIFY_ENDPOINT` in `.env.local` or the GitHub
repository's Actions variables, then rebuild. The deploy workflow passes this
public URL to Next.js. Never put Spotify tokens or secrets in `NEXT_PUBLIC_*`.

The Worker coalesces concurrent requests and caches playback for 15 seconds per
instance. The page polls every 20 seconds while visible and respects upstream
Retry-After responses. This is a small personal-site service, not a globally
coordinated rate limiter; if traffic grows, add shared caching/rate limiting.

Check: `node --test services/spotify/worker.test.mjs`.

References: [Spotify authorization](https://developer.spotify.com/documentation/web-api/tutorials/code-flow),
[current playback](https://developer.spotify.com/documentation/web-api/reference/get-the-users-currently-playing-track),
[Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/).
