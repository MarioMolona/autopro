import { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, Plus, LogOut, User, Settings } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useBoard } from '../../context/BoardContext';
import { useView } from '../../context/ViewContext';
import AddMemberModal from './AddMemberModal';
import UserProfileModal from './UserProfileModal';
import SettingsModal from './SettingsModal';
import './Header.css';

/**
 * Top dashboard header with project selector, team, search, and functional dropdowns.
 * Includes user profile (logout) and notification popup.
 */
export default function Header() {
  const { currentUser, allUsers, logout, notifications, markNotificationAsRead, markAllNotificationsAsRead, activeRole } = useAuth();
  const { setSelectedCard, cards, setHighlightedCommentId } = useBoard();
  const { setActiveView } = useView();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [openNotifMenuId, setOpenNotifMenuId] = useState(null);

  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);

  const team = allUsers.slice(0, 4);
  const sortedNotifications = notifications.slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  const unreadCount = sortedNotifications.filter(n => !n.isRead).length;

  const toggleUserDropdown = (e) => {
    e?.stopPropagation();
    setIsUserDropdownOpen(!isUserDropdownOpen);
    setIsNotificationOpen(false);
  };

  const toggleNotificationDropdown = (e) => {
    e?.stopPropagation();
    setIsNotificationOpen(!isNotificationOpen);
    setIsUserDropdownOpen(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="header">
      <div className="header__left">
        <div className="header__project-selector">
          <div className="header__project-info">
            <h2 className="header__project-title">ContentFlow Pro</h2>
            <p className="header__project-status">Proyecto Activo</p>
          </div>
          <ChevronDown size={16} className="header__selector-icon" />
        </div>

        <div className="header__team">
          <div className="header__team-avatars">
            {team.map((user) => (
              <Avatar
                key={user.id}
                user={user}
                size="sm"
                showAiBadge={user.isAiAgent}
              />
            ))}
          </div>
          {activeRole === 'admin' && (
            <button 
              className="header__add-member"
              onClick={() => setIsAddMemberOpen(true)}
            >
              <Plus size={16} />
              <span>Invitar</span>
            </button>
          )}
        </div>
      </div>

      <div className="header__right">
        <div className="header__search">
          <Search size={18} className="header__search-icon" />
          <input
            type="text"
            placeholder="Buscar en el proyecto..."
            className="header__search-input"
          />
        </div>

        <div className="header__actions">
          {/* Notifications */}
          <div className="header__notification-wrapper" ref={notificationRef}>
            <button
              className={`header__btn ${isNotificationOpen ? 'header__btn--active' : ''}`}
              onClick={toggleNotificationDropdown}
              aria-label="Notificaciones"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="header__notification-badge">{unreadCount}</span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="header__dropdown header__dropdown--notifications">
                <div className="header__dropdown-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Notificaciones</h3>
                  {sortedNotifications.length > 0 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); markAllNotificationsAsRead(); }}
                      style={{ fontSize: '12px', background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Marcar todo como leído
                    </button>
                  )}
                </div>
                <div className="header__dropdown-content">
                  {sortedNotifications.length > 0 ? (
                    sortedNotifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`header__notification-item ${!notification.isRead ? 'header__notification-item--unread' : ''}`}
                        onClick={() => {
                          if (!notification.isRead) markNotificationAsRead(notification.id);
                          const cardId = notification.payload?.cardId;
                          if (cardId) {
                            const card = cards.find(c => String(c.id) === String(cardId));
                            if (card) {
                              setActiveView('projects');
                              if (notification.payload?.commentId) {
                                setHighlightedCommentId(notification.payload.commentId);
                              }
                              setSelectedCard(card);
                            }
                          }
                          setIsNotificationOpen(false);
                        }}
                      >
                        <div className="header__notification-info">
                          <p className="header__notification-text">
                            {notification.type === 'mention' 
                              ? `${notification.payload?.mentionedBy} te mencionó en "${notification.payload?.cardTitle}"`
                              : notification.message || 'Nueva notificación'}
                          </p>
                          <span className="header__notification-date">
                            {new Date(notification.createdAt).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenNotifMenuId(openNotifMenuId === notification.id ? null : notification.id); 
                            }}
                            className="header__notification-menu-btn"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '4px' }}
                          >
                            ⋮
                          </button>
                          {openNotifMenuId === notification.id && (
                            <div style={{ 
                              position: 'absolute', right: '100%', top: '0', zIndex: 100, 
                              background: '#ffffff', border: '1px solid var(--color-border)', 
                              borderRadius: '6px', padding: '4px', minWidth: '130px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' 
                            }}>
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  markNotificationAsRead(notification.id); 
                                  setOpenNotifMenuId(null); 
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-primary)', width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '12px', borderRadius: '4px' }}
                                onMouseOver={e => e.target.style.background = 'var(--color-neutral-100)'}
                                onMouseOut={e => e.target.style.background = 'none'}
                              >
                                {notification.isRead ? 'Marcar no leído' : 'Marcar leído'}
                              </button>
                            </div>
                          )}
                          {!notification.isRead && <div className="header__notification-dot" />}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="header__dropdown-empty">No hay notificaciones</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="header__profile-wrapper" ref={userMenuRef}>
            <button
              className={`header__profile ${isUserDropdownOpen ? 'header__profile--active' : ''}`}
              onClick={toggleUserDropdown}
            >
              {isUserDropdownOpen && (
                <div className="header__profile-info">
                  <span className="header__profile-name">{currentUser.fullName}</span>
                  <span className="header__profile-role">
                    {activeRole === 'admin' ? 'Administrador' : activeRole === 'user' ? 'Usuario' : 'Lector'}
                  </span>
                </div>
              )}
              <Avatar user={currentUser} size="md" />
              <ChevronDown size={14} className="header__profile-chevron" />
            </button>

            {isUserDropdownOpen && (
              <div className="header__dropdown header__dropdown--user">
                <button 
                  className="header__dropdown-item"
                  onClick={() => {
                    setIsProfileModalOpen(true);
                    setIsUserDropdownOpen(false);
                  }}
                >
                  <User size={16} />
                  Mi Perfil
                </button>
                <button 
                  className="header__dropdown-item"
                  onClick={() => {
                    setIsSettingsModalOpen(true);
                    setIsUserDropdownOpen(false);
                  }}
                >
                  <Settings size={16} />
                  Configuración
                </button>
                <div className="header__dropdown-divider" />
                <button 
                  className="header__dropdown-item header__dropdown-item--danger"
                  onClick={logout}
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddMemberModal 
        isOpen={isAddMemberOpen} 
        onClose={() => setIsAddMemberOpen(false)} 
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </header>
  );
}
