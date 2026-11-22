# Antonella's 3rd birthday invitation

A mobile-first invitation page with paper butterflies, party details, a bilingual (EN/ES) RSVP form,
and a wish-list link. It's a plain static site (no build step), hosted on GitHub Pages. RSVPs are saved to a
private Google Sheet that only you can open.

```
index.html        page structure
styles.css        book-page look
butterflies.js    background animation
app.js            translations, RSVP form
config.js         ← party details, wish list URL, RSVP endpoint (the only file you normally edit)
apps-script/      Google Apps Script that writes RSVPs into the Sheet
```

## Preview locally

```sh
python3 -m http.server 8000
```
Then open http://localhost:8000. To view it on your phone, use your computer's local IP while both are on the same Wi-Fi.

## Updating details

Edit `config.js` (e.g. set `registryUrl`), then commit and push. GitHub Pages redeploys in about a minute.

## Connect RSVPs to Google Sheets (one time, ~5 minutes)

1. In the Google account that should own the guest list, create a new Google Sheet (e.g. "Antonella 3 – RSVPs").
2. **Extensions → Apps Script**. Delete the sample code and paste in all of `apps-script/Code.gs`. Save.
3. In the function dropdown pick **setup** and click **Run**. Approve the permissions (it only accesses this sheet).
   This creates the `Summary`, `RSVPs` and `Children` tabs.
4. **Deploy → New deployment** → type **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the **Web app URL** (ends in `/exec`) into `rsvpEndpoint` in `config.js`, commit, push.
6. Send a test RSVP from your phone and check that it appears in the Sheet, then delete the test rows.

Share the Sheet with your wife (Share → her email) so you can both review it. The **Summary** tab totals families,
adults, children and declines; the **Children** tab is one row per child (name and age) for the souvenirs.

If you change `Code.gs` later: **Deploy → Manage deployments → Edit → Version: New version**. That keeps the same URL.

## Publish on GitHub Pages

GitHub Pages is free for **public** repositories. The code and `config.js` will be visible to anyone who finds the
repo, but they contain nothing secret, since the guest data lives only in your Sheet.

```sh
gh repo create antonella-3 --public --source=. --push
gh api -X POST repos/{owner}/antonella-3/pages -f "source[branch]=main" -f "source[path]=/"
```
Or on github.com: create the repo, push, then **Settings → Pages → Deploy from branch → main / (root)**.

Your link will be `https://<username>.github.io/antonella-3/`. A custom domain can be added later under Settings → Pages.
