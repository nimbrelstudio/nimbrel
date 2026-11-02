(async () => {
  const q = (s) => [...document.querySelectorAll(s)], base = document.body.dataset.base || "";
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  let C = {};
  try { C = await (await fetch(base + "data/site.json", { cache: "no-cache" })).json(); } catch {}
  const s = C.settings || {}, t = C.text || {};
  q("[data-t]").forEach((el) => { if (t[el.dataset.t] != null) el.textContent = t[el.dataset.t]; });
  if (C.faq) q("[data-faq]").forEach((el) => (el.innerHTML = C.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")));
  if (C.principles) q("[data-principles]").forEach((el) => (el.innerHTML = C.principles.map((f) => `<div><i class="mark"></i><h3>${esc(f.t)}</h3><p>${esc(f.d)}</p></div>`).join("")));
  q("[data-pin]").forEach((a) => { if (s.pinterest) { a.href = "https://www.pinterest.com/" + s.pinterest + "/"; a.target = "_blank"; a.hidden = false; } });
  q("[data-mail]").forEach((a) => { if (s.email) { a.href = "mailto:" + s.email; a.textContent = s.email; a.hidden = false; } });
  q("[data-year]").forEach((e) => (e.textContent = new Date().getFullYear()));
  if (s.signupUrl) q("[data-signup]").forEach((e) => (e.hidden = false));
  q("form.signup").forEach((f) => (f.onsubmit = async (e) => {
    e.preventDefault(); const st = f.querySelector(".status"), em = f.email.value.trim();
    if (f.website.value) return;
    if (!/^\S+@\S+\.\S+$/.test(em)) return (st.textContent = "Enter a valid email address.");
    if (!f.consent.checked) return (st.textContent = "Tick the box so we know you agree.");
    st.textContent = "Joining…";
    try {
      const fd = new FormData(), gs = /script\.google\.com/.test(s.signupUrl); fd.set("email", em); fd.set("page", location.href); if (s.signupKey) fd.set("access_key", s.signupKey);
      const r = await fetch(s.signupUrl, { method: "POST", body: fd, mode: gs ? "no-cors" : "cors", headers: gs ? undefined : { Accept: "application/json" } });
      if (!gs && !r.ok) throw 0;
      f.reset(); st.textContent = "You’re on the list. Thank you!";
    } catch { st.textContent = "That didn’t go through. Check your connection and try again."; }
  }));
  q("[data-designs]").forEach(async (g) => {
    try {
      const base = g.dataset.base || "", all = await (await fetch(base + "data/freebies.json", { cache: "no-cache" })).json();
      const items = all.filter((d) => !d.hidden && d.slug !== g.dataset.skip).sort((a, b) => (b.added || "").localeCompare(a.added || ""));
      const lim = +g.dataset.limit || 99, cats = [...new Set(items.map((d) => d.category).filter(Boolean))], chips = document.querySelector("[data-chips]");
      const draw = (cat) => {
        g.innerHTML = items.filter((d) => !cat || d.category === cat).slice(0, lim).map((d) => `<a class="card" href="${base}free/${esc(d.slug)}/"><span class="thumb">${d.preview ? `<img src="${base}assets/designs/${esc(d.slug)}.webp" alt="" loading="lazy" width="900" height="1125">` : ""}</span>${d.status === "soon" ? '<span class="pill">Coming soon</span>' : '<span class="pill free">Free</span>'}<h3>${esc(d.title)}</h3><p>${esc(d.summary)}</p></a>`).join("") || '<p class="mut">The first printable is on its way. Check back soon.</p>';
      };
      draw("");
      if (chips && cats.length > 1) {
        chips.hidden = false;
        chips.innerHTML = ["All", ...cats].map((c, i) => `<button type="button" aria-pressed="${i === 0}" data-c="${i ? esc(c) : ""}">${esc(c)}</button>`).join("");
        chips.onclick = (e) => { const b = e.target.closest("button"); if (!b) return; chips.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b)); draw(b.dataset.c); };
      }
    } catch { g.innerHTML = '<p class="mut">The printables could not load. Refresh the page to try again.</p>'; }
  });
})();
