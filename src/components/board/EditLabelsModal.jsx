import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { useBoard } from '../../context/BoardContext';

const PALETTE = [
  '#2ECC71', '#1ABC9C', '#3498DB', '#9B59B6', '#F1C40F',
  '#E67E22', '#E74C3C', '#34495E', '#95A5A6', '#16A085'
];

export default function EditLabelsModal({ isOpen, onClose }) {
  const { labels, updateLabel } = useBoard();
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [editData, setEditData] = useState({ name: '', color: '' });

  const handleClose = async () => {
    if (editingLabelId) {
      await updateLabel(editingLabelId, editData);
    }
    onClose();
  };

  if (!isOpen) return null;

  const handleSave = async (id) => {
    await updateLabel(id, editData);
    setEditingLabelId(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Gestionar Etiquetas" size="sm">
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '60vh', overflowY: 'auto' }}>
        {labels.map(label => (
          <div key={label.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', padding: '12px 0' }}>
            {editingLabelId === label.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '8px' }}>
                <input 
                  value={editData.name} 
                  onChange={(e) => setEditData({ ...editData, name: e.target.value.toUpperCase() })}
                  autoFocus
                  style={{ fontSize: '14px', fontWeight: '800', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '8px', background: 'var(--color-bg-base)', color: 'var(--color-text-primary)', width: '100%' }}
                />
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {PALETTE.map(c => (
                    <button 
                      key={c} 
                      onClick={() => setEditData({ ...editData, color: c })}
                      style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: c, border: editData.color === c ? '2px solid white' : 'none', cursor: 'pointer', boxShadow: editData.color === c ? '0 0 0 2px var(--color-primary)' : 'none', transition: 'transform 0.1s' }}
                      onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
                      onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                  <button onClick={() => setEditingLabelId(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>Cancelar</button>
                  <button onClick={() => handleSave(label.id)} style={{ background: 'var(--color-primary-500)', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Guardar</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ 
                  backgroundColor: label.color, 
                  color: '#fff', 
                  padding: '4px 10px', 
                  borderRadius: '4px', 
                  fontWeight: '800', 
                  fontSize: '11px', 
                  letterSpacing: '0.8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {label.name}
                </div>
                <button 
                  onClick={() => { setEditingLabelId(label.id); setEditData({ name: label.name, color: label.color }); }}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    color: 'var(--color-text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    transition: 'color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                  onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-tertiary)'}
                >
                  ✎ Editar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
