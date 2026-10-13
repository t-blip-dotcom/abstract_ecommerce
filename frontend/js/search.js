
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

function highlightMatch(name, term) {
  if (!term) return escapeHtml(name);
  const index = name.toLowerCase().indexOf(term);
  if (index === -1) return escapeHtml(name);
  const before = escapeHtml(name.slice(0, index));
  const match = escapeHtml(name.slice(index, index + term.length));
  const after = escapeHtml(name.slice(index + term.length));
  return `${before}<mark>${match}</mark>${after}`;
}

function suggestionItemTemplate(product, term) {
  const thumb = api.assetUrl(product.photo_url) ||
    `https://placehold.co/64x64/E1F1FB/0074BD?text=${encodeURIComponent(product.name.charAt(0))}`;

  return `
    <a class="search-suggestion-item" href="product-detail.html?id=${product.product_id}">
      <img src="${thumb}" alt="">
      <span>
        <span class="search-suggestion-name">${highlightMatch(product.name, term)}</span>
        <span class="search-suggestion-category">${product.category}</span>
      </span>
    </a>`;
}

function initSearch() {
  const input = document.getElementById('product-search');
  const suggestionsList = document.getElementById('search-suggestions');
  if (!input) return;

  let debounceTimer;

  function renderSuggestions(term) {
    if (!suggestionsList) return;

    if (!term || !window.productsModule) {
      suggestionsList.classList.remove('is-open');
      suggestionsList.innerHTML = '';
      return;
    }

    const matches = window.productsModule.state.all
      .filter(p => p.name.toLowerCase().includes(term))
      .slice(0, 6);

    if (!matches.length) {
      suggestionsList.classList.remove('is-open');
      suggestionsList.innerHTML = '';
      return;
    }

    suggestionsList.innerHTML = matches.map(p => suggestionItemTemplate(p, term)).join('');
    suggestionsList.classList.add('is-open');
  }

  input.addEventListener('input', () => {
    const term = input.value.trim().toLowerCase();

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      window.productsModule.state.searchTerm = term;
      window.productsModule.applyFilters();
      renderSuggestions(term);
    }, 200);
  });

  input.addEventListener('focus', () => {
    if (input.value.trim()) renderSuggestions(input.value.trim().toLowerCase());
  });


  document.addEventListener('click', (e) => {
    if (suggestionsList && !e.target.closest('.search-bar-wrap')) {
      suggestionsList.classList.remove('is-open');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && suggestionsList) {
      suggestionsList.classList.remove('is-open');
    }
  });
}

document.addEventListener('DOMContentLoaded', initSearch);