/* Kitchen Brigade — live data wiring */
(function () {
  "use strict";

  function setPill(state, text) {
    var pill = document.getElementById("status-pill");
    var label = document.getElementById("status-text");
    if (!pill || !label) return;
    pill.classList.remove("ok", "down");
    if (state) pill.classList.add(state);
    label.textContent = text;
  }

  function setLive(id, value, good) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
    el.classList.remove("up", "down");
    if (good === true) el.classList.add("up");
    if (good === false) el.classList.add("down");
  }

  async function loadStatus() {
    try {
      var res = await fetch("status.json", { cache: "no-store" });
      if (!res.ok) throw new Error("no status");
      var s = await res.json();

      var gw = s.gateways || {};
      var allUp = (gw.openclaw === "active" || gw.openclaw === "up") &&
                  (gw.hermes === "active" || gw.hermes === "up");
      setPill(allUp ? "ok" : "down", allUp ? "All systems operational" : "Attention needed");

      setLive("live-openclaw", fmtGw(gw.openclaw), gw.openclaw === "active" || gw.openclaw === "up");
      setLive("live-hermes", fmtGw(gw.hermes), gw.hermes === "active" || gw.hermes === "up");
      setLive("live-last", s.last_run_human || "—", null);
      setLive("live-next", s.next_run_human || "—", null);
      setLive("live-dlq", String(s.dead_letter != null ? s.dead_letter : "—"),
              s.dead_letter === 0 ? true : (s.dead_letter > 0 ? false : null));

      var bd = document.getElementById("brief-date");
      if (bd && s.brief_date_human) bd.textContent = "· " + s.brief_date_human;
    } catch (e) {
      setPill(null, "Status unavailable");
      ["live-openclaw", "live-hermes", "live-last", "live-next", "live-dlq"].forEach(function (id) {
        setLive(id, "—", null);
      });
    }
  }

  function fmtGw(v) {
    if (v === "active" || v === "up") return "Running";
    if (v === "inactive" || v === "down" || v === "failed") return "Down";
    return "—";
  }

  async function loadBrief() {
    var body = document.getElementById("brief-body");
    if (!body) return;
    try {
      var res = await fetch("brief.html", { cache: "no-store" });
      if (!res.ok) throw new Error("no brief");
      var html = (await res.text()).trim();
      if (!html) throw new Error("empty brief");
      body.innerHTML = html;
    } catch (e) {
      body.innerHTML = '<p class="loading">The latest brief is plating — check back after the next service.</p>';
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadStatus();
    loadBrief();
  });
})();
