// ====== CONFIG ======
// Put WhatsApp number in international format, no "+" sign.
// Example Nigeria: 2348012345678
const WHATSAPP_NUMBER = "2348012345678";

// Demo products (edit these to your real collections)
const PRODUCTS = [
  { id: "ALN-001", name: "Royal Silk Set", category: "Luxury Set", price: 45000 },
  { id: "ALN-002", name: "Classic Senator Wear", category: "Men", price: 38000 },
  { id: "ALN-003", name: "Pearl Evening Gown", category: "Women", price: 60000 },
  { id: "ALN-004", name: "Velvet Two-Piece", category: "Luxury", price: 52000 },
  { id: "ALN-005", name: "Premium Kaftan", category: "Men", price: 42000 },
  { id: "ALN-006", name: "Signature Wrap Dress", category: "Women", price: 48000 },
  { id: "ALN-007", name: "Executive Agbada", category: "Men", price: 85000 },
  { id: "ALN-008", name: "Gold-Trim Set", category: "Luxury Set", price: 70000 },
];

// ====== STATE ======
/**
 * cart: Map<productId, {product, qty}>
 */
const cart = new Map();

// ====== HELPERS ======
const $ = (sel) => document.querySelector(sel);
const formatMoneyNGN = (n) => {
  const num = Number(n || 0);
  return "₦" + num.toLocaleString("en-NG");
};

function cartCount() {
  let total = 0;
  for (const item of cart.values()) total += item.qty;
  return total;
}

function cartTotal() {
  let total = 0;
  for (const item of cart.values()) total += item.product.price * item.qty;
  return total;
}

function buildOrderMessage() {
  const lines = [];
  lines.push("Hello Alonie Detailed Apparel, I want to place an order:");
  lines.push("");

  for (const item of cart.values()) {
    const p = item.product;
    lines.push(`• ${p.name} (x${item.qty}) — ${formatMoneyNGN(p.price * item.qty)}`);
  }

  lines.push("");
  lines.push(`Total: ${formatMoneyNGN(cartTotal())}`);
  lines.push("");
  lines.push("Please confirm availability and delivery details. Thank you!");
  return lines.join("\n");
}

function waLinkFromMessage(message) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}

// ====== RENDER PRODUCTS ======
function renderProducts() {
  const track = $("#catalogueTrack");
  track.innerHTML = "";

  PRODUCTS.forEach((p) => {
    const card = document.createElement("article");
    card.className = "card";

    card.innerHTML = `
      <div class="card-media" aria-hidden="true">${p.category}</div>
      <div class="card-body">
        <div class="card-title">
          <h3>${p.name}</h3>
          <div class="price">${formatMoneyNGN(p.price)}</div>
        </div>
        <div class="card-meta">
          <span class="chip">${p.category}</span>
          <span class="chip">ID: ${p.id}</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-outline" data-action="add" data-id="${p.id}">
            Add to Cart
          </button>
        </div>
      </div>
    `;

    track.appendChild(card);
  });

  // Add to cart handlers
  track.addEventListener("click", (e) => {
    const btn = e.target.closest('button[data-action="add"]');
    if (!btn) return;

    const id = btn.getAttribute("data-id");
    addToCart(id);
  });
}

// ====== CART ACTIONS ======
function addToCart(productId) {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) return;

  const existing = cart.get(productId);
  if (existing) existing.qty += 1;
  else cart.set(productId, { product, qty: 1 });

  updateCartUI();
}

function incQty(productId) {
  const item = cart.get(productId);
  if (!item) return;
  item.qty += 1;
  updateCartUI();
}

function decQty(productId) {
  const item = cart.get(productId);
  if (!item) return;
  item.qty -= 1;
  if (item.qty <= 0) cart.delete(productId);
  updateCartUI();
}

function removeItem(productId) {
  cart.delete(productId);
  updateCartUI();
}

function clearCart() {
  cart.clear();
  updateCartUI();
}

// ====== CART UI ======
function renderCartItems() {
  const list = $("#cartList");
  list.innerHTML = "";

  for (const [id, item] of cart.entries()) {
    const li = document.createElement("li");
    li.className = "cart-item";

    li.innerHTML = `
      <div class="cart-item-top">
        <div>
          <p class="cart-item-name">${item.product.name}</p>
          <p class="cart-item-sub">${item.product.category} • ${formatMoneyNGN(item.product.price)}</p>
        </div>
        <button class="icon-btn" data-action="remove" data-id="${id}" aria-label="Remove ${item.product.name}">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18"></path>
            <path d="M6 6 18 18"></path>
          </svg>
        </button>
      </div>

      <div class="qty-row">
        <div class="qty-controls" aria-label="Quantity controls">
          <button class="qty-btn" data-action="dec" data-id="${id}" aria-label="Decrease quantity">−</button>
          <span class="qty" aria-live="polite">${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-id="${id}" aria-label="Increase quantity">+</button>
        </div>

        <strong>${formatMoneyNGN(item.product.price * item.qty)}</strong>
      </div>
    `;

    list.appendChild(li);
  }

  // Cart item events
  list.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");

    if (action === "inc") incQty(id);
    if (action === "dec") decQty(id);
    if (action === "remove") removeItem(id);
  }, { once: true }); // avoid stacking listeners on rerender
}

function updateCartUI() {
  $("#cartCount").textContent = String(cartCount());
  $("#cartTotal").textContent = formatMoneyNGN(cartTotal());

  const empty = cart.size === 0;
  $("#cartEmpty").style.display = empty ? "block" : "none";
  $("#cartList").style.display = empty ? "none" : "grid";

  $("#makeOrderBtn").disabled = empty;
  $("#clearCartBtn").disabled = empty;

  if (!empty) renderCartItems();

  // Update WhatsApp FAB link too (if user wants quick cart order)
  const fab = $("#whatsappFab");
  if (!fab.hidden) {
    fab.href = cart.size ? waLinkFromMessage(buildOrderMessage()) : waLinkFromMessage("Hello Alonie Detailed Apparel, I want to make an enquiry.");
  }
}

// ====== DRAWER OPEN/CLOSE ======
function openCart() {
  $("#overlay").hidden = false;
  $("#cartDrawer").hidden = false;

  // trap focus lightly by focusing close button
  $("#closeCart").focus();
  document.body.style.overflow = "hidden";
}

function closeCart() {
  $("#overlay").hidden = true;
  $("#cartDrawer").hidden = true;
  document.body.style.overflow = "";
  $("#cartButton").focus();
}

// ====== NAV TOGGLE ======
function setupNavToggle() {
  const toggle = $("#navToggle");
  const menu = $("#navMenu");

  function setOpen(open) {
    toggle.classList.toggle("is-open", open);
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }

  toggle.addEventListener("click", () => {
    const isOpen = toggle.classList.contains("is-open");
    setOpen(!isOpen);
  });

  // Close menu when clicking a link (mobile)
  menu.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;
    setOpen(false);
  });

  // Close on resize to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 700) setOpen(false);
  });
}

// ====== WHATSAPP FAB ON SCROLL ======
function setupWhatsAppFab() {
  const fab = $("#whatsappFab");

  function updateFab() {
    const show = window.scrollY > 180;
    fab.hidden = !show;

    // If showing, set link (cart-aware)
    if (show) {
      fab.href = cart.size
        ? waLinkFromMessage(buildOrderMessage())
        : waLinkFromMessage("Hello Alonie Detailed Apparel, I want to make an enquiry.");
    }
  }

  window.addEventListener("scroll", updateFab, { passive: true });
  updateFab();
}

// ====== INIT ======
function init() {
  // footer year
  $("#year").textContent = String(new Date().getFullYear());

  // Render products
  renderProducts();

  // Setup nav
  setupNavToggle();

  // Cart open/close
  $("#cartButton").addEventListener("click", openCart);
  $("#closeCart").addEventListener("click", closeCart);
  $("#overlay").addEventListener("click", closeCart);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#cartDrawer").hidden) closeCart();
  });

  // Order button
  $("#makeOrderBtn").addEventListener("click", () => {
    const msg = buildOrderMessage();
    window.open(waLinkFromMessage(msg), "_blank", "noopener");
  });

  // Clear cart
  $("#clearCartBtn").addEventListener("click", clearCart);

  // WhatsApp floating button
  setupWhatsAppFab();

  // initial cart ui
  updateCartUI();
}

init();
