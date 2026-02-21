// ===== Elements =====
const menuBtn = document.getElementById("menuBtn");
const closeMenuBtn = document.getElementById("closeMenuBtn");
const megaMenu = document.getElementById("megaMenu");

const overlay = document.getElementById("overlay");

const localeBtn = document.getElementById("localeBtn");
const localeModal = document.getElementById("localeModal");
const closeLocaleBtn = document.getElementById("closeLocaleBtn");
const saveLocaleBtn = document.getElementById("saveLocaleBtn");
const resetLocaleBtn = document.getElementById("resetLocaleBtn");

const contrastBtn = document.getElementById("contrastBtn");

const countrySelect = document.getElementById("country");
const languageSelect = document.getElementById("language");

const snapFeed = document.querySelector(".snap-feed");

// ===== Shared overlay controller =====
let overlayMode = null; // "menu" | "modal" | null

function showOverlay(mode) {
  overlayMode = mode;
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
}
function hideOverlay() {
  overlayMode = null;
  overlay.hidden = true;
  document.body.style.overflow = "";
}

// ===== Mega menu =====
function openMenu() {
  megaMenu.classList.add("open");
  megaMenu.setAttribute("aria-hidden", "false");
  menuBtn.setAttribute("aria-expanded", "true");
  showOverlay("menu");
  closeMenuBtn.focus();
}
function closeMenu() {
  megaMenu.classList.remove("open");
  megaMenu.setAttribute("aria-hidden", "true");
  menuBtn.setAttribute("aria-expanded", "false");
  hideOverlay();
  menuBtn.focus();
}

menuBtn.addEventListener("click", openMenu);
closeMenuBtn.addEventListener("click", closeMenu);

// ===== Locale modal (accessible) =====
let lastFocus = null;

function openModal() {
  lastFocus = document.activeElement;

  localeModal.setAttribute("aria-hidden", "false");
  showOverlay("modal");

  // focus first input for a premium feel
  setTimeout(() => countrySelect.focus(), 0);
}

function closeModal() {
  localeModal.setAttribute("aria-hidden", "true");
  hideOverlay();
  if (lastFocus) lastFocus.focus();
}

localeBtn.addEventListener("click", openModal);
closeLocaleBtn.addEventListener("click", closeModal);

// click outside modal (overlay)
overlay.addEventListener("click", () => {
  if (overlayMode === "menu") closeMenu();
  if (overlayMode === "modal") closeModal();
});

// ESC closes whichever is open
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;

  if (megaMenu.classList.contains("open")) closeMenu();
  if (localeModal.getAttribute("aria-hidden") === "false") closeModal();
});

// simple focus trap for modal
localeModal.addEventListener("keydown", (e) => {
  if (e.key !== "Tab") return;
  const focusables = localeModal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus();
  }
});

// persist locale settings (demo)
function loadLocale() {
  try {
    const saved = JSON.parse(localStorage.getItem("localePrefs") || "{}");
    if (saved.country) countrySelect.value = saved.country;
    if (saved.language) languageSelect.value = saved.language;
  } catch {}
}
function saveLocale() {
  const prefs = {
    country: countrySelect.value,
    language: languageSelect.value
  };
  localStorage.setItem("localePrefs", JSON.stringify(prefs));
  closeModal();
}
function resetLocale() {
  countrySelect.value = "za";
  languageSelect.value = "en";
  localStorage.removeItem("localePrefs");
}

saveLocaleBtn.addEventListener("click", saveLocale);
resetLocaleBtn.addEventListener("click", resetLocale);
loadLocale();

// ===== High contrast toggle =====
function loadContrast() {
  const saved = localStorage.getItem("hc") === "1";
  document.body.classList.toggle("hc", saved);
  contrastBtn.setAttribute("aria-pressed", String(saved));
}
function toggleContrast() {
  const next = !document.body.classList.contains("hc");
  document.body.classList.toggle("hc", next);
  contrastBtn.setAttribute("aria-pressed", String(next));
  localStorage.setItem("hc", next ? "1" : "0");
}
contrastBtn.addEventListener("click", toggleContrast);
loadContrast();

// ===== Real image placeholders =====
// Uses data-bg="assets/hero-1.jpg" (if file exists it will load)
// If not found, we keep a luxury gradient placeholder.
const gradientFallbacks = [
  `linear-gradient(135deg, rgba(255,255,255,.10), rgba(255,255,255,0)),
   radial-gradient(circle at 20% 20%, rgba(255,255,255,.14), transparent 55%),
   linear-gradient(135deg, rgba(0,0,0,.92), rgba(0,0,0,.45))`,
  `radial-gradient(circle at 70% 30%, rgba(255,255,255,.10), transparent 45%),
   linear-gradient(135deg, rgba(0,0,0,.92), rgba(0,0,0,.40))`,
  `radial-gradient(circle at 30% 70%, rgba(255,255,255,.10), transparent 50%),
   linear-gradient(135deg, rgba(0,0,0,.92), rgba(0,0,0,.50))`
];

document.querySelectorAll(".tile").forEach((tile, i) => {
  const media = tile.querySelector(".tile-media");
  if (!media) return;

  const src = tile.getAttribute("data-bg");

  // If no src, use fallback
  if (!src) {
    media.style.backgroundImage = gradientFallbacks[i % gradientFallbacks.length];
    return;
  }

  // Preload image; if it fails, fallback
  const img = new Image();
  img.onload = () => {
    media.style.backgroundImage = `url("${src}")`;
  };
  img.onerror = () => {
    media.style.backgroundImage = gradientFallbacks[i % gradientFallbacks.length];
  };
  img.src = src;
});

// ===== Snap feed: keyboard navigation (premium UX) =====
function snapToIndex(nextIndex) {
  const tiles = Array.from(document.querySelectorAll(".snap-feed .tile"));
  const idx = Math.max(0, Math.min(tiles.length - 1, nextIndex));
  tiles[idx].scrollIntoView({ behavior: "smooth", block: "start" });
}

function getCurrentIndex() {
  const tiles = Array.from(document.querySelectorAll(".snap-feed .tile"));
  const top = snapFeed.scrollTop;
  const h = snapFeed.clientHeight || 1;
  return Math.round(top / h);
}

document.addEventListener("keydown", (e) => {
  // don't hijack when typing in inputs
  const tag = (document.activeElement?.tagName || "").toLowerCase();
  if (tag === "input" || tag === "select" || tag === "textarea") return;

  if (e.key === "ArrowDown" || e.key === "PageDown") {
    e.preventDefault();
    snapToIndex(getCurrentIndex() + 1);
  }
  if (e.key === "ArrowUp" || e.key === "PageUp") {
    e.preventDefault();
    snapToIndex(getCurrentIndex() - 1);
  }
  if (e.key === "Home") {
    e.preventDefault();
    snapToIndex(0);
  }
});