import { useState } from 'react';
import { Search, ArrowUpDown, Filter } from 'lucide-react';
import { useBoard } from '../../context/BoardContext';
import './SubNav.css';

/**
 * Sub-navigation below the header with tabs and action buttons.
 * Simplified to focus on the Kanban board view.
 */
export default function SubNav() {
  const { setSearchQuery } = useBoard();
  const [inputValue, setInputValue] = useState('');

  const handleChange = (e) => {
    setInputValue(e.target.value);
    setSearchQuery(e.target.value);
  };

  return (
    <div className="sub-nav">
      <div className="sub-nav__actions">
        <div className="sub-nav__search">
          <Search size={16} className="sub-nav__search-icon" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="sub-nav__search-input"
            value={inputValue}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );
}
