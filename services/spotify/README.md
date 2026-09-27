# Live music

The notebook stays a static GitHub Pages site. This small Cloudflare Worker reads
only the owner's current Spotify playback. Visitors never sign in. Credentials
stay in Worker secrets; the browser receives title, album, artist, artwork, the
Spotify link, an optional playlist title, and a best-effort `remainingMs` value.
A paused track, ad, podcast, or no active session shows an empty Polaroid. Errors
clear the track rather than claiming stale music is live.

`GET /now-playing` returns one of these shapes:

```json
{
  "status": "playing",
  "remainingMs": 18342,
  "track": {
    "title": "…",
    "album": "…",
    "artist": "…",
    "image": "…",
    "url": "…",
    "playlist": "…"
  }
}
```

`playlist` and `remainingMs` can be `null`. The Worker derives remaining time
from Spotify's `duration_ms - progress_ms` when it receives the playback response,
then ages it while serving its local cache. It refreshes at the predicted track
end instead of serving a cached track past that boundary. Playlist titles are
resolved only from Spotify playlist context URIs, through Spotify's fixed playlist
endpoint; inaccessible playlists and playlist lookup failures simply return
`playlist: null`.

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

The Worker coalesces concurrent requests and caches playback for up to 15 seconds
per instance, never past the predicted end of a timed track. Playlist names use a
small bounded per-instance cache; playlist rate limits pause further playlist
lookups for Spotify's `Retry-After` interval without making playback unavailable.
Playback errors return `503` with `Retry-After`, exposed through CORS.

While visible, the page schedules the next playing-track poll for
`remainingMs + 1 second` of settling grace, with a 2-second minimum. It must not
subtract the full request duration: the Worker has already aged `remainingMs`
through its own upstream and playlist work. Idle playback, missing timing, and
unavailable timing fall back to 20 seconds; errors wait at least 30 seconds and
respect `Retry-After`. This is a small personal-site service, not a globally
coordinated rate limiter; if traffic grows, add shared caching/rate limiting.

Check: `node --test services/spotify/worker.test.mjs`.

References: [Spotify authorization](https://developer.spotify.com/documentation/web-api/tutorials/code-flow),
[current playback](https://developer.spotify.com/documentation/web-api/reference/get-the-users-currently-playing-track),
[get playlist](https://developer.spotify.com/documentation/web-api/reference/get-playlist),
[Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/).
