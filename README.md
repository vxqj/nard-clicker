# Big Nard Clicker

A single-page clicker game: click Mitchell's face, it flashes to the
tongue-out photo and back, and a global click counter goes up live for
everyone visiting the site — no backend of your own needed.

Plain HTML/CSS/JS. No build step, no npm install, no framework.

## 1. Add the two face photos

Upload Mitchell's two faces (serious + tongue out) to catbox.moe, imgbb, or
wherever — just make sure you grab the **direct image link** (ends in
`.jpg`/`.png`, not a page link like `ibb.co/xxxxx` or `imgbb.com/xxxxx`).

Open **`config.js`** and paste them in:

```js
seriousFace: "https://files.catbox.moe/abc123.jpg",
tongueOutFace: "https://files.catbox.moe/def456.jpg",
```

That's it — everything else in `config.js` is optional to tweak (swap
speed, poll interval, title text).

## 2. Try it locally

Just open `index.html` directly in a browser — no server required, it's
fully static. (If your browser blocks local file fetches, run any quick
local server, e.g. `npx serve .` or Python's `python -m http.server`, and
visit the printed localhost URL.)

## 3. Deploy on GitHub Pages

1. Create a new GitHub repo (or reuse one), and push these three files
   (`index.html`, `style.css`, `script.js`, `config.js`) to the root of
   the `main` branch.
2. In the repo, go to **Settings → Pages**.
3. Under "Build and deployment", set **Source** to `Deploy from a branch`,
   branch `main`, folder `/ (root)`. Save.
4. GitHub gives you a URL like `https://yourusername.github.io/reponame/`
   — wait a minute or two for the first deploy, then check it loads.

## 4. Point nard.lol at it

1. Still in **Settings → Pages**, under "Custom domain" enter `nard.lol`
   and save. GitHub will create a `CNAME` file in your repo automatically
   (or add one yourself containing just `nard.lol` on one line).
2. At your domain registrar, set these DNS records for `nard.lol`:
   - `A` records pointing to GitHub's IPs:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - If you also want `www.nard.lol` to work, add a `CNAME` record for
     `www` pointing to `yourusername.github.io`
3. Back in Settings → Pages, once DNS resolves, tick **Enforce HTTPS**.
4. DNS can take anywhere from a few minutes to a few hours to propagate.

## How the global counter works

It uses [countapi.mileshilliard.com](https://countapi.mileshilliard.com/),
a free public counter API — no signup, no keys. Every click calls its
`/hit` endpoint (increments by 1 and returns the new total), and every
visitor's page polls the `/get` endpoint every couple seconds to pick up
clicks from other people, so the number stays roughly live across every
device without you running any server.

It's a small free hobby service, not an enterprise one — for a joke site
between friends that's totally fine, but if it ever goes down, just swap
`COUNT_API_BASE` in `script.js` for a different counter API and change
`counterKey` in `config.js` to start fresh.
