# Cranky Chickens room relay

A tiny Cloudflare Worker that passes messages between two devices sharing a 4-letter room code.
It is what makes "play a friend" work on any network, including between two different houses.
It stores nothing. See the comment at the top of `worker.js` for the protocol.

It runs on a free Cloudflare account at a `workers.dev` address. The games need to be told that address
(the `relayUrl` default in `js/cc-room.js`). Until then they fall back to a direct device-to-device link
(WebRTC), which works on some home networks and not others.

## Deploy (once, and again after any change to worker.js)

From this folder, on a machine with Node:

    npx wrangler login      # opens Cloudflare in the browser; pick the account that has crankychickens.com
    npx wrangler deploy

The deploy prints the address, like `https://cranky-rooms.<your-subdomain>.workers.dev`.

Check it: open that address in a browser. It should say `Cranky Chickens room relay.`

No terminal? In the Cloudflare dashboard, under Workers & Pages, create a Worker by importing this GitHub
repo with the root directory set to `services/relay`. Cloudflare then deploys it on every push.

## Cost and the daily budget

Runs on the Workers Free plan, which allows 100,000 Durable Object requests a day and counts every
20 relayed messages as one request. Past that, Cloudflare fails requests until 00:00 UTC; nothing is
charged. The relay does not wait for that. It keeps its own running estimate and enforces a budget:

| When the estimate reaches | What happens |
|---|---|
| `DAILY_BUDGET` (60,000) | No new rooms open. Players see "Friend play is resting for today." Matches already running may finish. |
| `HARD_STOP` (85,000) | Running rooms are closed too. |
| 50%, 80%, 100% of the budget | One line of text is POSTed to `ALERT_URL`, once each per day, if that is set. |

Each room is also bounded on its own: a device sending more than 90 messages a second gets the room
closed, a room nobody joins closes after 30 minutes, and a room in use closes after 3 hours.

For scale: a ten-minute Mortal Squawkbat match is roughly 2,150 requests, so the budget is about 28
of those a day. Building together in the block world uses far less.

**See today's usage:** add `/status` to the relay's address (cached for a minute).

**Get an alert on your phone:** any URL that accepts a text POST works. With the free ntfy app,
pick a hard-to-guess topic name, subscribe to it in the app, then:

    npx wrangler secret put ALERT_URL      # paste https://ntfy.sh/<your-topic>

**Change the numbers:** edit `DAILY_BUDGET` and `HARD_STOP` in `wrangler.toml` and deploy again.

The estimate is deliberately a little high (it counts each connection as 4 requests), and Cloudflare's
own dashboard is the true count: Workers & Pages, then Durable Objects, then Metrics.

What this does not stop: someone hammering the address from outside a browser still uses up plain
Worker requests (a separate 100,000 a day). Cloudflare's rate-limiting rules are the tool for
that, but they need the relay on a domain Cloudflare manages.

## Who can use it

Only pages on crankychickens.com (and its subdomains) may connect. To allow another origin, such as a
Netlify preview URL, set a comma-separated `ALLOW_ORIGINS` variable on the Worker.

## Run it locally

    npx wrangler dev --local --port 8787 --var ALLOW_LOCAL:1

Then set `window.CC_RELAY = 'ws://127.0.0.1:8787'` in the page before starting a room.
