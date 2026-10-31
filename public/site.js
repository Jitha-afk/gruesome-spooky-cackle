// Theme, accent, details, contents and the source table. No framework.
(function () {
  var d = document
  var root = d.documentElement
  var LIMIT = 12

  function all(selector, scope) {
    return [].slice.call((scope || d).querySelectorAll(selector))
  }

  function store(key, value) {
    try {
      localStorage.setItem(key, value)
    } catch {}
  }

  // Colour changes sweep across the page when the browser can do it.
  // accent-wiping stops colour transitions; only the latest sweep clears it.
  var wipe
  function sweep(change) {
    var calm = matchMedia("(prefers-reduced-motion: reduce)").matches
    root.classList.add("accent-wiping")
    if (!calm && d.startViewTransition) {
      var t = (wipe = d.startViewTransition(change))
      return t.finished.finally(function () {
        if (wipe === t) root.classList.remove("accent-wiping")
      })
    }
    change()
    void root.offsetWidth
    root.classList.remove("accent-wiping")
    if (calm) return
    root.classList.add("accent-shimmer")
    setTimeout(function () {
      root.classList.remove("accent-shimmer")
    }, 420)
  }

  function syncTheme() {
    var dark = root.classList.contains("dark")
    all("[data-theme-toggle]").forEach(function (button) {
      button.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme")
    })
    var meta = d.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute("content", dark ? "#040404" : "#fafafa")
  }

  function toggleTheme() {
    var dark = !root.classList.contains("dark")
    root.classList.toggle("dark", dark)
    root.style.colorScheme = dark ? "dark" : "light"
    store("theme", dark ? "dark" : "light")
    syncTheme()
  }

  function syncAccent() {
    var id = root.getAttribute("data-accent")
    all("[data-accent-set]").forEach(function (input) {
      input.checked = input.value === id
    })
  }

  function setAccent(input) {
    var id = input.value
    if (id === root.getAttribute("data-accent")) return
    sweep(function () {
      root.setAttribute("data-accent", id)
      root.setAttribute("data-accent-kind", input.getAttribute("data-kind") || "solid")
      store("graph-accent", id)
      syncAccent()
    })
  }

  // Opens every closed details around an anchor target.
  function reveal(hash) {
    var node = null
    try {
      node = hash && hash.length > 1 ? d.getElementById(decodeURIComponent(hash.slice(1))) : null
    } catch {}
    for (; node; node = node.parentElement) if (node.tagName === "DETAILS") node.open = true
  }

  var themes = all("details.theme")
  var expand = d.querySelector("[data-expand-all]")

  function syncExpand() {
    if (!expand) return
    var open = themes.length > 0 && themes.every(function (theme) {
      return theme.open
    })
    expand.setAttribute("data-on", String(open))
  }

  // Source table: filters, search, sort and the row limit.
  var body = d.querySelector("[data-src-body]")
  var rows = body ? all("tr", body) : []
  var search = d.querySelector("[data-search-input]")
  var more = d.querySelector("[data-more]")
  var count = d.querySelector("[data-count]")
  var live = d.querySelector("[data-said]")
  var said
  var empty = d.querySelector("[data-empty]")
  rows.forEach(function (row, index) {
    row._i = index
    row._t = ((row.querySelector(".src-post") || row).textContent || "").toLowerCase()
  })

  function off(selector) {
    var map = {}
    all(selector).forEach(function (box) {
      if (!box.checked) map[box.value] = 1
    })
    return map
  }

  function filter() {
    if (!body) return
    var query = search ? search.value.trim().toLowerCase() : ""
    var types = off("[data-filter-type]")
    var platforms = off("[data-filter-platform]")
    var full = more && more.getAttribute("aria-expanded") === "true"
    var matches = 0
    rows.forEach(function (row) {
      var ok =
        !types[row.getAttribute("data-type")] &&
        !platforms[row.getAttribute("data-platform")] &&
        (!query || row._t.indexOf(query) > -1)
      if (ok) matches += 1
      row.hidden = !ok || (!full && matches > LIMIT)
    })
    var text = matches.toLocaleString("en-US") + " of " + rows.length.toLocaleString("en-US") + " sources"
    if (count) count.textContent = text
    // The live region waits for typing to pause, so it speaks once.
    clearTimeout(said)
    said = setTimeout(function () {
      if (live && live.textContent !== text) live.textContent = text
    }, 500)
    if (empty) empty.hidden = matches > 0
    if (more) {
      more.hidden = matches <= LIMIT
      var label = more.querySelector("[data-more-count]")
      if (label) label.textContent = matches.toLocaleString("en-US")
    }
    body.setAttribute("data-ready", "")
  }

  function sort(button) {
    var up = button.getAttribute("data-on") !== "true"
    button.setAttribute("data-on", String(up))
    rows.sort(function (a, b) {
      return (a.getAttribute("data-engagement") - b.getAttribute("data-engagement")) * (up ? 1 : -1) || a._i - b._i
    })
    rows.forEach(function (row) {
      body.appendChild(row)
    })
    var caption = body.parentNode.caption
    if (caption) caption.textContent = up ? "Sources, least engaged first." : "Sources, most engaged first."
    filter()
  }

  function toggleMore(button) {
    var open = button.getAttribute("aria-expanded") !== "true"
    button.setAttribute("aria-expanded", String(open))
    filter()
    if (!open && button.getBoundingClientRect().top < 0) button.scrollIntoView({ block: "center" })
  }

  d.addEventListener("click", function (event) {
    var target = event.target
    if (!target || !target.closest) return
    var hit
    if ((hit = target.closest("[data-theme-toggle]"))) return sweep(toggleTheme)
    if ((hit = target.closest("[data-expand-all]"))) {
      var open = hit.getAttribute("data-on") !== "true"
      // Ten height animations at once drop frames on phones, so these snap.
      root.classList.add("bulk")
      themes.forEach(function (theme) {
        theme.open = open
      })
      void root.offsetWidth
      root.classList.remove("bulk")
      return hit.setAttribute("data-on", String(open))
    }
    if ((hit = target.closest("[data-sort]"))) return sort(hit)
    if ((hit = target.closest("[data-more]"))) return toggleMore(hit)
    if ((hit = target.closest('a[href^="#"]'))) {
      reveal(hit.getAttribute("href"))
      var pop = hit.closest("[popover]")
      if (pop && pop.hidePopover) pop.hidePopover()
    }
  })

  function onField(event) {
    var field = event.target
    // Radios fire input and change; the accent listens to change only.
    if (field.hasAttribute("data-accent-set")) {
      if (event.type === "change") setAccent(field)
    } else if (field.matches("[data-search-input], [data-filter-type], [data-filter-platform]")) filter()
  }
  d.addEventListener("input", onField)
  d.addEventListener("change", onField)
  d.addEventListener(
    "toggle",
    function (event) {
      if (event.target.classList && event.target.classList.contains("theme")) syncExpand()
    },
    true,
  )
  // Tabbing out of a menu closes it. Its own button keeps it open.
  d.addEventListener("focusout", function (event) {
    var pop = event.target.closest && event.target.closest("[popover]")
    var next = event.relatedTarget
    if (pop && next && !pop.contains(next) && !next.hasAttribute("popovertarget") && pop.matches(":popover-open")) pop.hidePopover()
  })
  addEventListener("hashchange", function () {
    reveal(location.hash)
  })

  // Contents: mark the section, and the theme, under the header.
  var links = all(".toc a")
  var tops = []
  var subs = []
  links.forEach(function (link) {
    var id = link.getAttribute("href").slice(1)
    var node = d.getElementById(id)
    if (!node) return
    var list = link.closest(".toc-sub") ? subs : tops
    if (list.indexOf(node) < 0) list.push(node)
  })

  function last(nodes) {
    var found = null
    nodes.forEach(function (node) {
      if (node.getBoundingClientRect().top < 100) found = node
    })
    return found
  }

  function spy() {
    var bottom = innerHeight + scrollY >= root.scrollHeight - 4
    var top = bottom ? tops[tops.length - 1] : last(tops) || tops[0]
    var sub = top ? last(subs) : null
    if (sub && !top.contains(sub)) sub = null
    links.forEach(function (link) {
      var id = link.getAttribute("href").slice(1)
      if ((top && top.id === id) || (sub && sub.id === id)) link.setAttribute("aria-current", "location")
      else link.removeAttribute("aria-current")
    })
  }

  var queued = false
  function onScroll() {
    if (queued) return
    queued = true
    requestAnimationFrame(function () {
      queued = false
      spy()
    })
  }
  if (tops.length) {
    addEventListener("scroll", onScroll, { passive: true })
    addEventListener("resize", onScroll)
  }

  syncTheme()
  syncAccent()
  syncExpand()
  filter()
  reveal(location.hash)
  if (tops.length) spy()
})()
