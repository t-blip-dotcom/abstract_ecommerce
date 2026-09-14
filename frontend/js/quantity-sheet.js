/**
 * quantity-sheet.js
 * Shared "add to cart" sheet used by every product card. Tapping
 * "Add to cart" on a card opens this instead of adding 1 item
 * straight away — it shows the product photo/name and a quantity
 * stepper (-, typed input, +), and only adds to the cart once the
 * shopper confirms.
 *
 * Markup expected on the page (see index.html / products.html):
 *   #quantity-sheet, #sheet-product-image, #sheet-product-name,
 *   #sheet-product-price, #sheet-qty-input, #sheet-stock-note,
 *   #sheet-add-to-cart-btn, plus [data-close-sheet] buttons.
 */

let sheetProduct = null;

function clampSheetQty(value) {
  const max = sheetProduct?.stock_quantity || 1;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(Math.floor(parsed), max);
}

function openQuantitySheet(product) {
  const overlay = document.getElementById('quantity-sheet');
  if (!overlay || !product) return;

  sheetProduct = product;

  document.getElementById('sheet-product-image').src =
    product.photo_url || `https://placehold.co/160x160/E1F1FB/0074BD?text=${encodeURIComponent(product.name)}`;
  document.getElementById('sheet-product-name').textContent = product.name;
  document.getElementById('sheet-product-price').textContent =
    window.productsModule ? window.productsModule.formatPrice(product.price) : `KSh ${product.price}`;

  const qtyInput = document.getElementById('sheet-qty-input');
  qtyInput.value = 1;

  const stockNote = document.getElementById('sheet-stock-note');
  stockNote.textContent = product.stock_quantity <= 5
    ? `Only ${product.stock_quantity} left in stock`
    : '';

  overlay.classList.add('is-open');
  qtyInput.focus();
}

function closeQuantitySheet() {
  document.getElementById('quantity-sheet')?.classList.remove('is-open');
  sheetProduct = null;
}

function initQuantitySheet() {
  const overlay = document.getElementById('quantity-sheet');
  if (!overlay) return;

  const qtyInput = document.getElementById('sheet-qty-input');
  const decreaseBtn = document.getElementById('sheet-qty-decrease');
  const increaseBtn = document.getElementById('sheet-qty-increase');
  const addBtn = document.getElementById('sheet-add-to-cart-btn');

  overlay.querySelectorAll('[data-close-sheet]').forEach(btn => {
    btn.addEventListener('click', closeQuantitySheet);
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeQuantitySheet();
  });

  decreaseBtn.addEventListener('click', () => {
    qtyInput.value = clampSheetQty(Number(qtyInput.value) - 1);
  });
  increaseBtn.addEventListener('click', () => {
    qtyInput.value = clampSheetQty(Number(qtyInput.value) + 1);
  });
  qtyInput.addEventListener('change', () => {
    qtyInput.value = clampSheetQty(qtyInput.value);
  });

  addBtn.addEventListener('click', () => {
    if (!sheetProduct) return;
    window.cartModule.addItem(sheetProduct, clampSheetQty(qtyInput.value));
    window.showToast(`Added ${sheetProduct.name} to cart`, 'success');
    closeQuantitySheet();
  });
}

document.addEventListener('DOMContentLoaded', initQuantitySheet);

window.quantitySheet = { open: openQuantitySheet, close: closeQuantitySheet };