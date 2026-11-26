# Cranky Chickens room relay

A tiny Cloudflare Worker that passes messages between two devices sharing a 4-letter room code.
It is what makes "play a friend" work on any network, including between two different houses.
It stores nothing. See the comment at the top of `worker.js` for the protocol.

The games look for it at `wss://rooms.crankychickens.com`. Until it is deployed they fall back to a
direct device-to-device link (WebRTC), which works on some home networks and not others.

## Deploy (once, and again after any change to worker.js)

From this folder, on a machine with Node:

    npx wrangler login      # opens Cloudflare in the browser; pick the account that has crankychickens.com
    npx wrangler deploy

`wrangler.toml` asks Cloudflare to serve it at `rooms.crankychickens.com` and creates the DNS record.

Check it: open https://rooms.crankychickens.com in a browser. It should say `Cranky Chickens room relay.`

## Cost

Runs on the Workers Free plan. If a daily free limit is ever reached, new messages fail until the
limits reset at 00:00 UTC; nothing is charged. Games batch their messages (one frame every 30ms) to
stay well inside it.

## Who can use it

Only pages on crankychickens.com (and its subdomains) may connect. To allow another origin, such as a
Netlify preview URL, set a comma-separated `ALLOW_ORIGINS` variable on the Worker.

## Run it locally

    npx wrangler dev --local --port 8787 --var ALLOW_LOCAL:1

Then set `window.CC_RELAY = 'ws://127.0.0.1:8787'` in the page before starting a room.
