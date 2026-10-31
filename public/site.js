(function () {
  var root = document.documentElement

  function themeButton() {
    return document.querySelector("[data-theme-toggle]")
  }

  function syncThemeButton() {
    var button = themeButton()
    if (!button) return
    var light = !root.classList.contains("dark")
    button.setAttribute("aria-label", light ? "Switch to dark." : "Switch to light.")
  }

  function setTheme(theme) {
    var dark = theme !== "light"
    root.classList.toggle("dark", dark)
    root.style.colorScheme = dark ? "dark" : "light"
    try {
      localStorage.setItem("theme", dark ? "dark" : "light")
    } catch (error) {}
    syncThemeButton()
  }

  syncThemeButton()

  document.addEventListener("click", function (event) {
    var theme = event.target.closest("[data-theme-toggle]")
    if (theme) {
      setTheme(root.classList.contains("dark") ? "light" : "dark")
      return
    }
    var collapse = event.target.closest("[data-collapse-toggle]")
    if (!collapse) return
    var box = collapse.closest("[data-collapse]")
    if (!box) return
    var open = box.hasAttribute("data-open")
    if (open) box.removeAttribute("data-open")
    else box.setAttribute("data-open", "")
    collapse.setAttribute("aria-expanded", open ? "false" : "true")
  })

  var table = document.querySelector(".source-index")
  if (!table) return
  var rows = Array.prototype.slice.call(table.querySelectorAll("tbody tr"))
  var empty = document.querySelector("[data-empty]")
  var search = document.querySelector("[data-search-input]")
  var sortButton = document.querySelector("[data-sort]")
  var direction = "desc"

  function checked(selector) {
    var map = {}
    Array.prototype.forEach.call(document.querySelectorAll(selector), function (box) {
      map[box.value] = box.checked
    })
    return map
  }

  function apply() {
    var query = search ? search.value.trim().toLowerCase() : ""
    var types = checked("[data-filter-type]")
    var platforms = checked("[data-filter-platform]")
    var shown = 0
    rows.forEach(function (row) {
      var typeOk = types[row.getAttribute("data-type")] !== false
      var platformOk = platforms[row.getAttribute("data-platform")] !== false
      var text = (row.textContent || "").toLowerCase()
      var textOk = !query || text.indexOf(query) !== -1
      var ok = typeOk && platformOk && textOk
      row.hidden = !ok
      if (ok) shown += 1
    })
    if (empty) empty.hidden = shown !== 0
  }

  document.addEventListener("input", function (event) {
    if (event.target.matches("[data-search-input], [data-filter-type], [data-filter-platform]")) apply()
  })
  document.addEventListener("change", function (event) {
    if (event.target.matches("[data-filter-type], [data-filter-platform]")) apply()
  })

  if (sortButton) {
    sortButton.addEventListener("click", function () {
      direction = direction === "desc" ? "asc" : "desc"
      rows.sort(function (a, b) {
        var delta = Number(a.getAttribute("data-engagement")) - Number(b.getAttribute("data-engagement"))
        if (delta === 0) return 0
        return direction === "asc" ? delta : -delta
      })
      var body = table.querySelector("tbody")
      rows.forEach(function (row) {
        body.appendChild(row)
      })
      sortButton.textContent = direction === "desc" ? "Show lowest first." : "Show highest first."
    })
  }
})()
