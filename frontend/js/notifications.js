/**
 * notifications.js
 * Renders the notifications dropdown — order status changes and
 * promotions. Mocked for now; swap loadNotifications() for
 * `api.get('/notifications')` once that endpoint exists.
 */

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'order', title: 'Order #1042 shipped', body: 'Your order is on its way and should arrive within 2 days.', time: '2h ago', unread: true },
  { id: 2, type: 'promo', title: '20% off Hair Oils this week', body: 'Use code HAIR20 at checkout, valid through Sunday.', time: '1d ago', unread: true },
  { id: 3, type: 'order', title: 'Order #1039 delivered', body: 'Delivered to your shipping address. Enjoy!', time: '3d ago', unread: false }
];

function notificationIcon(type) {
  return type === 'order' ? 'package' : 'tag';
}

function notificationTemplate(note) {
  return `
    <li class="notification-item ${note.unread ? 'is-unread' : ''}">
      <span class="notification-item-icon"><i data-lucide="${notificationIcon(note.type)}"></i></span>
      <div class="notification-item-body">
        <p class="notification-item-title">${note.title}</p>
        <p class="notification-item-text">${note.body}</p>
        <span class="notification-item-time">${note.time}</span>
      </div>
    </li>`;
}

async function loadNotifications() {
  if (api.useMockData) return Promise.resolve(MOCK_NOTIFICATIONS);
  return api.get('/notifications');
}

async function renderNotifications() {
  const lists = document.querySelectorAll('.notification-list');
  if (!lists.length) return;

  const notifications = await loadNotifications();
  const unreadCount = notifications.filter(n => n.unread).length;

  const badge = document.getElementById('notifications-badge');
  if (badge) {
    badge.textContent = unreadCount;
    badge.dataset.count = unreadCount;
  }

  const html = notifications.length
    ? notifications.map(notificationTemplate).join('')
    : `<div class="dropdown-panel-empty"><i data-lucide="bell-off"></i><p>No notifications yet</p></div>`;

  lists.forEach(list => { list.innerHTML = html; });

  if (window.lucide) lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', renderNotifications);
