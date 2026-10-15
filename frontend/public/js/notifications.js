
function notificationIcon(type) {
  if (type === 'order_status') return 'package';
  if (type === 'stock') return 'alert-triangle';
  return 'tag'; // promotion
}

function timeAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function notificationTemplate(note) {
  return `
    <li class="notification-item ${note.is_read ? '' : 'is-unread'}">
      <span class="notification-item-icon"><i data-lucide="${notificationIcon(note.type)}"></i></span>
      <div class="notification-item-body">
        <p class="notification-item-title">${note.title}</p>
        <p class="notification-item-text">${note.body || ''}</p>
        <span class="notification-item-time">${timeAgo(note.created_at)}</span>
      </div>
    </li>`;
}

function loginPromptTemplate() {
  return `
    <div class="dropdown-panel-empty">
      <i data-lucide="lock"></i>
      <p>Log in to see your order updates and promotions.</p>
      <a href="/login?redirect=/notifications" class="btn btn--primary btn--sm">Log in</a>
    </div>`;
}

async function renderNotifications() {
  const lists = document.querySelectorAll('.notification-list');
  if (!lists.length) return;

  const loggedIn = await window.cartModule.isLoggedInCustomer();

  if (!loggedIn) {
    lists.forEach(list => { list.innerHTML = loginPromptTemplate(); });
    if (window.lucide) lucide.createIcons();
    return;
  }

  try {
    const { notifications, unreadCount } = await api.get('/notifications');

    const badge = document.getElementById('notifications-badge');
    if (badge) {
      badge.textContent = unreadCount;
      badge.dataset.count = unreadCount;
    }

    const html = notifications.length
      ? notifications.map(notificationTemplate).join('')
      : `<div class="dropdown-panel-empty"><i data-lucide="bell-off"></i><p>No notifications yet</p></div>`;

    lists.forEach(list => { list.innerHTML = html; });
  } catch (err) {
    lists.forEach(list => {
      list.innerHTML = `<div class="dropdown-panel-empty"><p>${err.message}</p></div>`;
    });
  }

  if (window.lucide) lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', renderNotifications);