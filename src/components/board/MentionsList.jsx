import { useState, useEffect, useRef } from 'react';
import Avatar from '../ui/Avatar';
import './MentionsList.css';

/**
 * MentionsList component that displays a dropdown of collaborator suggestions
 * when a user types '@' in a textarea.
 */
export default function MentionsList({ users, filter, onSelect, position }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef(null);

  const filteredUsers = users.filter(user => 
    user.fullName.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (filteredUsers.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(filteredUsers[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredUsers, selectedIndex, onSelect]);

  if (filteredUsers.length === 0) return null;

  return (
    <div 
      className="mentions-list" 
      style={{ 
        position: 'absolute', 
        left: position.left, 
        top: position.top,
        zIndex: 1000
      }}
      ref={listRef}
    >
      {filteredUsers.map((user, index) => (
        <div 
          key={user.id} 
          className={`mentions-list__item ${index === selectedIndex ? 'mentions-list__item--active' : ''}`}
          onClick={() => onSelect(user)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <Avatar user={user} size="xs" />
          <span className="mentions-list__name">{user.fullName}</span>
          <span className="mentions-list__role">{user.role}</span>
        </div>
      ))}
    </div>
  );
}
