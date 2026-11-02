(() => {
  const $ = (s) => document.querySelector(s), K = "nimbrel-admin";
  let S = JSON.parse(localStorage.getItem(K) || "null"), list = [], editing = null;
  const msg = (t) => ($("#msg").textContent = t);
  const b64 = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
  const unb64 = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\n/g, "")), (c) => c.charCodeAt(0)));
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const slugify = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  const path = (p) => (S.base ? S.base.replace(/^\/|\/$/g, "") + "/" : "") + p;
  async function gh(method, p, body) {
    const r = await fetch(`https://api.github.com/repos/${S.repo}/contents/${path(p)}` + (method === "GET" ? `?ref=${S.branch}` : ""), {
      method, headers: { Authorization: "Bearer " + S.token, Accept: "application/vnd.github+json" }, body: body && JSON.stringify({ ...body, branch: S.branch }) });
    if (r.status === 404 && method === "GET") return null;
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || r.status);
    return r.json();
  }
  const put = async (p, content, note) => { const cur = await gh("GET", p); return gh("PUT", p, { message: note, content, sha: cur && cur.sha }); };
  const del = async (p, note) => { const cur = await gh("GET", p); if (cur) await gh("DELETE", p, { message: note, sha: cur.sha }); };
  const text = async (p) => { const f = await gh("GET", p); return f ? unb64(f.content) : null; };
  const fileB64 = (f) => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result.split(",")[1]); r.onerror = no; r.readAsDataURL(f); });
  async function webp(f) {
    const i = new Image(); i.src = URL.createObjectURL(f); await i.decode();
    const w = Math.min(900, i.naturalWidth), c = document.createElement("canvas"); c.width = w; c.height = Math.round((i.naturalHeight * w) / i.naturalWidth);
    c.getContext("2d").drawImage(i, 0, 0, c.width, c.height);
    return new Promise((ok) => c.toBlob(ok, "image/webp", 0.85));
  }
  async function saveData(note) {
    await put("data/freebies.json", b64(JSON.stringify(list, null, 1) + "\n"), note);
    const u = ["/", "/free/", "/privacy/", ...list.filter((d) => !d.hidden).map((d) => `/free/${d.slug}/`)];
    await put("sitemap.xml", b64('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + u.map((x) => `<url><loc>${location.origin}${x}</loc></url>`).join("\n") + "\n</urlset>\n"), note);
  }
  async function writePage(d) {
    let t = (await (await fetch("../free/template.html", { cache: "no-store" })).text()).replace('<meta name="robots" content="noindex">', "");
    const prev = d.preview ? `<figure class="frame"><img src="../../assets/designs/${d.slug}.webp" alt="Preview of ${esc(d.title)}" width="900" height="1125"></figure>` : '<figure class="frame ph" aria-hidden="true"></figure>';
    const m = { origin: location.origin, title: esc(d.title), summary: esc(d.summary), slug: d.slug, status: d.status, preview: prev, og: location.origin + (d.preview ? `/assets/designs/${d.slug}.webp` : "/assets/og.png") };
    for (const k in m) t = t.split(`@@${k}@@`).join(m[k]);
    await put(`free/${d.slug}/index.html`, b64(t), `Page for ${d.title}`);
  }
  function render() {
    $("#list").innerHTML = list.map((d) => `<li><div><b>${esc(d.title)}</b> <span class="mut">${d.hidden ? "Hidden" : d.status === "live" ? "Live" : "Coming soon"}</span></div><div class="acts" style="margin:0"><button class="btn alt" data-a="edit" data-s="${d.slug}">Edit</button><button class="btn alt" data-a="vis" data-s="${d.slug}">${d.hidden ? "Show" : "Hide"}</button><button class="btn alt" data-a="del" data-s="${d.slug}">Delete</button></div></li>`).join("") || '<li class="mut">Nothing here yet. Add your first printable above.</li>';
  }
  const reset = () => { $("#add").reset(); editing = null; $("#go").textContent = "Publish"; $("#cancel").hidden = true; $("#ft").textContent = "Add a printable"; };
  async function start() {
    $("#connect").hidden = true; $("#app").hidden = false; msg("Loading your printables…");
    try { list = JSON.parse((await text("data/freebies.json")) || "[]"); msg(""); render(); await loadSite(); } catch (e) { msg("Couldn't load the list: " + e.message); }
  }
  $("#connect form").onsubmit = async (e) => {
    e.preventDefault(); const f = e.target.elements;
    S = { repo: f.repo.value.trim(), branch: f.branch.value.trim() || "main", base: f.base.value.trim(), token: f.token.value.trim() };
    try {
      const r = await fetch(`https://api.github.com/repos/${S.repo}`, { headers: { Authorization: "Bearer " + S.token } });
      if (!r.ok) throw new Error(r.status === 404 ? "Repository not found, or the token can't see it" : "GitHub rejected the token");
      localStorage.setItem(K, JSON.stringify(S)); start();
    } catch (err) { $("#cmsg").textContent = err.message + ". Check the repository name and token."; }
  };
  $("#out").onclick = () => { localStorage.removeItem(K); location.reload(); };
  $("#cancel").onclick = reset;
  $("#list").onclick = async (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const d = list.find((x) => x.slug === b.dataset.s), a = b.dataset.a; if (!d) return;
    if (a === "edit") {
      const f = $("#add").elements; f.title.value = d.title; f.summary.value = d.summary || ""; f.category.value = d.category || ""; f.status.value = d.status;
      editing = d.slug; $("#go").textContent = "Save changes"; $("#cancel").hidden = false; $("#ft").textContent = "Edit " + d.title; f.title.focus(); return;
    }
    try {
      if (a === "vis") { d.hidden = !d.hidden; msg("Saving…"); await saveData(`${d.hidden ? "Hide" : "Show"} ${d.title}`); msg("Saved. The site updates within a minute or two."); }
      if (a === "del" && confirm(`Delete "${d.title}"? This removes its page, PDF and preview.`)) {
        msg("Deleting…");
        for (const p of [`free/${d.slug}/index.html`, `downloads/${d.slug}.pdf`, `assets/designs/${d.slug}.webp`]) await del(p, `Delete ${d.title}`);
        list = list.filter((x) => x !== d); await saveData(`Delete ${d.title}`); msg("Deleted. The site updates within a minute or two.");
      }
      render();
    } catch (err) { msg("That didn't go through: " + err.message); }
  };
  $("#add").onsubmit = async (e) => {
    e.preventDefault(); const f = e.target.elements, title = f.title.value.trim(), pdf = f.pdf.files[0], img = f.img.files[0];
    const slug = editing || slugify(title), old = list.find((x) => x.slug === slug);
    if (!slug) return msg("Add a title first.");
    if (!editing && old) return msg("A printable with that title already exists. Edit it, or change the title.");
    if (f.status.value === "live" && !pdf && !(old && old.file)) return msg("Choose the PDF to publish as Live, or set the status to Coming soon.");
    $("#go").disabled = true;
    try {
      const d = { ...old, slug, title, summary: f.summary.value.trim(), category: f.category.value.trim(), status: f.status.value, added: old ? old.added : new Date().toISOString().slice(0, 10) };
      if (pdf) { msg("Uploading the PDF…"); await put(`downloads/${slug}.pdf`, await fileB64(pdf), `Add ${title} PDF`); d.file = true; }
      if (img) { msg("Uploading the preview…"); await put(`assets/designs/${slug}.webp`, await fileB64(await webp(img)), `Add ${title} preview`); d.preview = true; }
      msg("Building the page…"); await writePage(d);
      list = old ? list.map((x) => (x.slug === slug ? d : x)) : [d, ...list];
      msg("Saving the list…"); await saveData(`Publish ${title}`);
      reset(); render(); msg("Published. The site updates within a minute or two.");
    } catch (err) { msg("That didn't go through: " + err.message + ". Check your token and try again."); }
    $("#go").disabled = false;
  };
  let site = null;
  async function loadSite() {
    site = JSON.parse((await text("data/site.json")) || "null"); const f = $("#site");
    if (!site) { f.innerHTML = '<p class="mut">data/site.json is missing from the repository. Upload it from the site folder.</p>'; return; }
    site.settings = site.settings || {}; const s = site.settings, L = site.labels || {};
    let g = "", h = "<h3>Settings</h3>" + [["pinterest", "Pinterest username"], ["email", "Contact email"], ["signupUrl", "Email signup address (leave empty to hide the signup form)"], ["signupKey", "Signup access key (only if your service gives you one)"]].map(([k, l]) => `<label for="s-${k}">${l}</label><input id="s-${k}" data-s="${k}" value="${esc(s[k] || "")}">`).join("");
    for (const k in site.text) {
      const [a, ...r] = (L[k] || k).split(":"), lab = r.join(":").trim() || a;
      if (r.length && a !== g) { g = a; h += `<h3>${esc(a)}</h3>`; }
      h += `<label for="t-${k}">${esc(lab)}</label><textarea id="t-${k}" data-k="${k}" rows="${site.text[k].length > 90 ? 3 : 1}">${esc(site.text[k])}</textarea>`;
    }
    const ls = (a, x, y) => (a || []).map((i) => i[x] + " | " + i[y]).join("\n");
    f.innerHTML = h + `<h3>Questions list</h3><label for="s-faq">One per line: Question | Answer</label><textarea id="s-faq" rows="8">${esc(ls(site.faq, "q", "a"))}</textarea><h3>Three principles</h3><label for="s-pr">One per line: Title | Text</label><textarea id="s-pr" rows="6">${esc(ls(site.principles, "t", "d"))}</textarea><div class="acts"><button class="btn" type="submit">Save site text</button></div><p class="status" id="smsg" role="status"></p>`;
  }
  $("#site").onsubmit = async (e) => {
    e.preventDefault(); if (!site) return; const f = $("#site");
    const lines = (id, x, y) => f.querySelector(id).value.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => { const i = l.indexOf(" | "); return i < 0 ? { [x]: l, [y]: "" } : { [x]: l.slice(0, i), [y]: l.slice(i + 3) }; });
    f.querySelectorAll("[data-k]").forEach((i) => (site.text[i.dataset.k] = i.value.trim()));
    f.querySelectorAll("[data-s]").forEach((i) => (site.settings[i.dataset.s] = i.value.trim()));
    site.faq = lines("#s-faq", "q", "a"); site.principles = lines("#s-pr", "t", "d"); $("#smsg").textContent = "Saving…";
    try { await put("data/site.json", b64(JSON.stringify(site, null, 1) + "\n"), "Update site text"); $("#smsg").textContent = "Saved. The site updates within a minute or two."; }
    catch (err) { $("#smsg").textContent = "That didn't go through: " + err.message; }
  };
  if (S) start();
})();
