import { useView } from '../../context/ViewContext';
import Sidebar from './Sidebar';
import Header from './Header';
import SubNav from './SubNav';
import KanbanBoard from '../board/KanbanBoard';
import DashboardOverview from '../dashboard/DashboardOverview';
import './AppLayout.css';

/**
 * Main application layout with navigation and content area.
 */
export default function AppLayout() {
  const { activeView } = useView();

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-layout__main">
        <Header />
        {activeView === 'projects' && <SubNav />}
        <main className="app-layout__content">
          {activeView === 'dashboard' ? (
            <DashboardOverview />
          ) : (
            <KanbanBoard />
          )}
        </main>
      </div>
    </div>
  );
}
