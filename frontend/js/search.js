/**
 * search.js
 * Wires the header search input to the product filter in products.js.
 * Filters across the whole catalog (not just the visible page) by
 * updating shared state and letting products.js re-render.
 */

function initSearch() {
  const input = document.getElementById('product-search');
  if (!input) return;

  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      window.productsModule.state.searchTerm = input.value.trim().toLowerCase();
      window.productsModule.applyFilters();
    }, 200);
  });
}

document.addEventListener('DOMContentLoaded', initSearch);
