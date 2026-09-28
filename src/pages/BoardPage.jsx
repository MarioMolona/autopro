import AppLayout from '../components/layout/AppLayout';
import KanbanBoard from '../components/board/KanbanBoard';

/**
 * Main board page. Renders the layout with the Kanban board.
 */
export default function BoardPage() {
  return (
    <AppLayout>
      <KanbanBoard />
    </AppLayout>
  );
}
