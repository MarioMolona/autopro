import { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  HelpCircle,
  ChevronLeft,
} from 'lucide-react';
import { useView } from '../../context/ViewContext';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'Proyectos', icon: FolderKanban },
];

/**
 * Sidebar navigation component matching the UX design.
 * Includes logo, nav items, active state, and help button.
 */
export default function Sidebar() {
  const { activeView, setActiveView } = useView();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon">
            <FolderKanban size={20} />
          </div>
          {!isCollapsed && (
            <span className="sidebar__logo-text">
              <span className="sidebar__logo-highlight">Dashboard</span>
            </span>
          )}
        </div>
        <button
          className="sidebar__collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          title={isCollapsed ? "Expandir" : "Colapsar"}
        >
          <ChevronLeft
            size={16}
            className={`sidebar__collapse-icon ${isCollapsed ? 'sidebar__collapse-icon--rotated' : ''}`}
          />
        </button>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeView;

          return (
            <button
              key={item.id}
              className={`sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`}
              onClick={() => setActiveView(item.id)}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                size={20}
                className="sidebar__nav-icon"
              />
              {!isCollapsed && (
                <span className="sidebar__nav-label">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <button className="sidebar__nav-item sidebar__help-btn" title="Help">
          <HelpCircle size={20} className="sidebar__nav-icon" />
          {!isCollapsed && (
            <span className="sidebar__nav-label">Help</span>
          )}
        </button>
      </div>
    </aside>
  );
}
