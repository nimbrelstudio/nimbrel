# Nimbrel Studio website

A static site with an admin page. You manage printables, every piece of text, your contact details and the email signup from `/admin/`. No HTML editing and no Cloudflare: the admin page talks to GitHub directly and GitHub Pages republishes the site.

## Put it online (one time)
1. On GitHub, create a **public** repository named `YOURUSERNAME.github.io`.
2. Upload everything inside this folder to the top level of the repository (including the hidden `.nojekyll` file).
3. Settings > Pages > deploy from branch `main`, folder `/ (root)`.
4. If your username isn't `nimbrel`, replace `https://nimbrel.github.io` with your address in the `.html` files, `sitemap.xml` and `robots.txt`.

## Turn on the admin page (one time)
1. GitHub > Settings > Developer settings > Personal access tokens > **Fine-grained tokens** > Generate new token.
2. Choose "Only select repositories" and pick the site repository. Set **Contents: Read and write**. Copy the token.
3. Open `yoursite/admin/`, enter `YOURUSERNAME/YOURUSERNAME.github.io`, branch `main`, leave the folder empty, paste the token, press Connect.

The token stays in your browser only. Don't connect on a shared computer. Press "Disconnect this browser" when you're done.

## What the admin edits
- **Printables:** add, edit, hide, delete. Each has a thumbnail. Without one, the arch and saffron dot shows. Press Edit on a printable to add or replace its thumbnail or PDF.
- **Site text and settings:** all headlines, paragraphs, buttons, the Questions list, the three principles, Pinterest username and contact email. Changes appear in a minute or two.
- **Not editable there:** logo files, colors and layout (those are in `css/styles.css`). Search engines may still see the original wording of the home page for a while.

## Collect emails without leaving your site
GitHub Pages stores files only, so it can't keep visitors' emails by itself. The signup form sends each address in the background to a free service you own, and the visitor never leaves your page. Pick one, paste its address into Admin > Site text and settings > "Email signup address", and the form appears.
- **Google Sheet (your own data):** make a Google Sheet, then Extensions > Apps Script and paste:
  `function doPost(e){SpreadsheetApp.getActiveSheet().appendRow([new Date(),e.parameter.email,e.parameter.page]);return ContentService.createTextOutput("ok");}`
  Deploy > New deployment > Web app, run as Me, access Anyone. Paste the `/exec` address.
- **Web3Forms or Formspree:** create a free form and paste its address (and the access key, if given). Each signup is emailed to you.

Before collecting emails: read the service's terms, and check the age and email rules that apply to you (including an unsubscribe route and a way to remove people on request). The Privacy page already mentions the list once signup is on.
