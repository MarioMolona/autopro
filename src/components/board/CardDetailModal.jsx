import { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, User, Tag, MessageSquare, Paperclip, Activity, Send, Plus, Image, FileText, Maximize2, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import { useBoard } from '../../context/BoardContext';
import { useAuth } from '../../context/AuthContext';
import MentionsList from './MentionsList';
import EditLabelsModal from './EditLabelsModal';
import './CardDetailModal.css';
import { supabase } from '../../utils/supabase';

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgente', color: 'var(--color-priority-urgent)' },
  high: { label: 'Alta', color: 'var(--color-priority-high)' },
  medium: { label: 'Media', color: 'var(--color-priority-medium)' },
  low: { label: 'Baja', color: 'var(--color-priority-low)' },
};

/**
 * Helper to get the approximate coordinates of the caret in a textarea.
 */
const getCaretCoordinates = (element, position) => {
  const { scrollLeft, scrollTop } = element;
  
  // Create a temporary span to measure text width
  const div = document.createElement('div');
  const style = window.getComputedStyle(element);
  
  // Clone all relevant styles
  [
    'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing',
    'textTransform', 'wordSpacing', 'textIndent', 'whiteSpace', 'wordBreak',
    'paddingLeft', 'paddingTop', 'paddingRight', 'paddingBottom',
    'marginLeft', 'marginTop', 'marginRight', 'marginBottom',
    'borderLeftWidth', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth',
    'lineHeight', 'width'
  ].forEach(prop => {
    div.style[prop] = style[prop];
  });

  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.whiteSpace = 'pre-wrap';
  div.style.wordWrap = 'break-word';
  div.style.overflow = 'hidden';

  const textBefore = element.value.substring(0, position);
  div.textContent = textBefore;
  
  const span = document.createElement('span');
  span.textContent = element.value.substring(position) || '.';
  div.appendChild(span);
  
  document.body.appendChild(div);
  const { offsetLeft, offsetTop } = span;
  document.body.removeChild(div);
  
  return {
    left: offsetLeft - scrollLeft,
    top: offsetTop - scrollTop
  };
};

/**
 * Modal showing full card details: description, assignees, labels,
 * priority, dates, comments, and attachments.
 */
export default function CardDetailModal({ card, onClose }) {
  const { 
    columns, 
    cards, 
    labels: allLabels, 
    comments, 
    addComment, 
    updateCard, 
    moveCard, 
    updateComment, 
    deleteComment, 
    updateLabel,
    uploadFile,
    toggleCardLabel,
    addMemberToCard,
    removeMemberFromCard,
    highlightedCommentId,
    setHighlightedCommentId
  } = useBoard();
  
  const [isUploading, setIsUploading] = useState(false);
  const { currentUser, allUsers, activeRole, insertNotification } = useAuth();
  
  const canEdit = activeRole === 'admin';
  const isViewer = activeRole === 'viewer';
  
  const [commentText, setCommentText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [columnId, setColumnId] = useState(card.columnId);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [editLabelData, setEditLabelData] = useState({ name: '', color: '' });
  const [isLabelsModalOpen, setIsLabelsModalOpen] = useState(false);
  const [openCommentMenuId, setOpenCommentMenuId] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);



  useEffect(() => {
    if (highlightedCommentId) {
      const timer = setTimeout(() => {
        setHighlightedCommentId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedCommentId, setHighlightedCommentId]);

  const handleFileUpload = (files) => {
    if (!files?.length) return;
    const newAttachments = Array.from(files).map(f => ({ 
      name: f.name, 
      size: f.size, 
      type: f.type, 
      id: crypto.randomUUID(),
      url: URL.createObjectURL(f),
      file: f
    }));
    setPendingAttachments(prev => [...prev, ...newAttachments]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // Sync with global state to avoid stale props
  const currentCard = cards.find((c) => c.id === card.id) || card;

  const rawAssignees = currentCard.assignees || [];
  const rawLabels = currentCard.labels || [];

  const assignees = rawAssignees.map(id => allUsers.find(u => u.id === id)).filter(Boolean);
  const labels = rawLabels.map(id => allLabels.find(l => l.id === id)).filter(Boolean);
  const priority = PRIORITY_CONFIG[currentCard.priority];
  const currentColumn = columns.find((c) => c.id === currentCard.columnId);
  const cardComments = comments.filter((c) => c.cardId === currentCard.id);
  const createdByUser = allUsers.find(u => u.id === currentCard.createdBy);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [year, month, day] = dateOnly.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    // Matching KanbanCard format: Mar 20, 2026
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleTextareaChange = (e) => {
    const value = e.target.value;
    setCommentText(value);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const coords = getCaretCoordinates(e.target, cursorPosition);
      setMentionFilter(mentionMatch[1]);
      setMentionPosition({ 
        top: coords.top + 20, 
        left: coords.left 
      });
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const handleSelectMention = (user) => {
    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeMention = commentText.substring(0, cursorPosition).replace(/@\w*$/, '');
    const textAfterMention = commentText.substring(cursorPosition);
    
    const newText = `${textBeforeMention}@${user.fullName} ${textAfterMention}`;
    setCommentText(newText);
    setShowMentions(false);
    
    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current.focus();
      const newCursorPos = textBeforeMention.length + user.fullName.length + 2;
      textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() && pendingAttachments.length === 0) return;
    
    setIsUploading(true);
    
    // Upload files
    const uploadedAttachments = [];
    for (const att of pendingAttachments) {
      if (att.file) {
        const url = await uploadFile(att.file);
        if (url) {
          uploadedAttachments.push({
            id: att.id,
            name: att.name,
            type: att.type,
            size: att.size,
            url: url
          });
        }
      } else {
        uploadedAttachments.push(att);
      }
    }

    try {
      const commentData = await addComment(card.id, currentUser.id, commentText, uploadedAttachments);
      
      const currentAttachments = currentCard.attachments || [];
      const newAttachments = [...currentAttachments, ...uploadedAttachments];
      updateCard(currentCard.id, { 
        attachments: newAttachments
      });
      
      setPendingAttachments([]);
      setCommentText('');
    } catch (err) {
      alert("Hubo un error al publicar el comentario. Por favor intenta de nuevo.");
      console.error(err);
    } finally {
      setIsUploading(false);
    }

    // Notify mentioned users
    const mentions = commentText.match(/@\w+\s*\w*/g) || [];
    mentions.forEach(mention => {
      const mentionName = mention.substring(1).trim();
      const mentionedUser = allUsers.find(u => u.fullName.toLowerCase() === mentionName.toLowerCase());
      if (mentionedUser && mentionedUser.id !== currentUser.id) {
        insertNotification(mentionedUser.id, 'mention', {
          cardTitle: card.title,
          mentionedBy: currentUser.fullName,
          cardId: card.id,
          commentId: commentData.id
        });
      }
    });
  };

  const handleStatusChange = (e) => {
    const newColumnId = e.target.value;
    setColumnId(newColumnId);
    const targetColumnCards = cards.filter(c => c.columnId === newColumnId);
    moveCard(currentCard.id, newColumnId, targetColumnCards.length);
  };

  const handlePriorityChange = (e) => {
    updateCard(currentCard.id, { priority: e.target.value });
  };

  const handleDueDateChange = (e) => {
    updateCard(currentCard.id, { dueDate: e.target.value });
  };

  const toggleAssignee = (e, userId) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const currentAssignees = currentCard.assignees || [];
    const newAssignees = currentAssignees.includes(userId)
      ? currentAssignees.filter(id => id !== userId)
      : [...currentAssignees, userId];
    updateCard(currentCard.id, { assignees: newAssignees });
  };

  const toggleLabel = (e, labelId) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const currentLabels = currentCard.labels || [];
    const newLabels = currentLabels.includes(labelId)
      ? currentLabels.filter(id => id !== labelId)
      : [...currentLabels, labelId];
    updateCard(currentCard.id, { labels: newLabels });
  };

  const handleTitleSave = () => {
    if (title.trim() !== currentCard.title) {
      updateCard(currentCard.id, { title: title.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = () => {
    if (description.trim() !== currentCard.description) {
      updateCard(currentCard.id, { description: description.trim() });
    }
  };

  // Helper for highlights in text
  const renderCommentText = (text) => {
    return text.split(/(@\w+\s*\w*)/g).map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="comment-mention">{part}</span>;
      }
      return part;
    });
  };

  const isImg = (name) => /\.(jpg|jpeg|png|gif|webp)$/i.test(name);

   const renderCommentAttachments = (attachments) => {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div className="card-detail__comment-attachments">
        {attachments.map((att) => (
          isImg(att.name) ? (
            <div key={att.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <img 
                src={att.url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200"} 
                alt={att.name} 
                className="card-detail__attachment-thumbnail" 
                onClick={() => setSelectedImage(att.url)}
                style={{ cursor: 'pointer' }}
              />
              <a href={att.url} download={att.name} style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textDecoration: 'none' }}>Descargar</a>
            </div>
          ) : (
            <a 
              key={att.id} 
              href={att.url || "#"} 
              download={att.name}
              target="_blank" 
              rel="noopener noreferrer" 
              className="card-detail__attachment-file"
            >
              {att.name.toLowerCase().endsWith('.pdf') ? <FileText size={14} /> : <Paperclip size={14} />}
              <span>{att.name}</span>
            </a>
          )
        ))}
      </div>
    );
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditingTitle ? '' : title} size="lg">
      <div 
        className={`card-detail ${isDraggingOver ? 'card-detail--dragging' : ''}`}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
        onDragLeave={() => setIsDraggingOver(false)}
        style={{ position: 'relative', minHeight: '500px' }}
      >
        {isDraggingOver && (
          <div style={{ 
            position: 'absolute', inset: 0, zIndex: 1000, 
            background: 'rgba(52,152,219,0.1)', 
            border: '3px dashed var(--color-primary-500)', 
            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' 
          }}>
            <div style={{ background: 'white', padding: '24px 40px', borderRadius: '16px', boxShadow: 'var(--shadow-xl)', textAlign: 'center' }}>
               <Paperclip size={32} style={{ color: 'var(--color-primary-500)', marginBottom: '12px' }} />
               <p style={{ fontWeight: '700', fontSize: '18px', color: 'var(--color-text-primary)' }}>Suelta para adjuntar archivos</p>
            </div>
          </div>
        )}
        <div className="card-detail__main">
          {isEditingTitle && canEdit ? (
            <input
              autoFocus
              className="card-detail__title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
            />
          ) : (
            <h2 
              className={`card-detail__title ${canEdit ? 'editable' : ''}`}
              onClick={() => canEdit && setIsEditingTitle(true)}
            >
              {title}
            </h2>
          )}

          {/* Description */}
          <section className="card-detail__section">
            <h3 className="card-detail__section-title">Descripción</h3>
            {canEdit ? (
              <textarea
                className="card-detail__textarea"
                placeholder="Añade una descripción más detallada..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionSave}
              />
            ) : (
              <p className="card-detail__description">
                {description || 'Sin descripción.'}
              </p>
            )}
          </section>

          {/* Comments */}
          <section className="card-detail__section">
            <h3 className="card-detail__section-title">
              <MessageSquare size={16} />
              Comentarios ({cardComments.length})
            </h3>
            <div className="card-detail__comments">
              {cardComments.length > 0 ? (
                cardComments.map((comment) => {
                  const commentUser = allUsers.find(u => u.id === comment.userId);
                  return (
                    <div key={comment.id} className="card-detail__comment">
                      <Avatar user={commentUser} size="sm" showAiBadge={commentUser?.isAiAgent} />
                      <div className={`card-detail__comment-content ${highlightedCommentId === comment.id ? 'card-detail__comment--highlighted' : ''}`}>
                        <div className="card-detail__comment-header">
                          <span className="card-detail__comment-author">
                            {commentUser?.fullName}
                          </span>
                          <span className="card-detail__comment-time">
                            {formatDateTime(comment.createdAt)}
                          </span>
                          <div style={{ position: 'relative', marginLeft: 'auto' }}>
                            {(canEdit || currentUser.id === comment.userId) && (
                              <button onClick={(e) => { e.preventDefault(); setOpenCommentMenuId(openCommentMenuId === comment.id ? null : comment.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>⋮</button>
                            )}
                            {openCommentMenuId === comment.id && (
                              <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 10, background: '#fff', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '4px', display: 'flex', flexDirection: 'column', minWidth: '100px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                {canEdit && (
                                  <button onClick={(e) => { e.preventDefault(); setEditingCommentId(comment.id); setEditCommentText(comment.content); setOpenCommentMenuId(null); }} style={{ background: 'none', border: 'none', textAlign: 'left', padding: '6px 12px', fontSize: '13px', cursor: 'pointer', color: 'var(--color-text-primary)' }}>Editar</button>
                                )}
                                {(canEdit || currentUser.id === comment.userId) && (
                                  <button onClick={(e) => { e.preventDefault(); deleteComment(comment.id); setOpenCommentMenuId(null); }} style={{ color: '#e74c3c', background: 'none', border: 'none', textAlign: 'left', padding: '6px 12px', fontSize: '13px', cursor: 'pointer' }}>Eliminar</button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {editingCommentId === comment.id ? (
                          <div style={{ marginTop: '4px' }}>
                            <textarea className="card-detail__textarea" value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} rows={2} />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                              <button onClick={() => { updateComment(comment.id, editCommentText); setEditingCommentId(null); }} className="card-detail__comment-submit">Guardar</button>
                              <button onClick={() => setEditingCommentId(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '12px' }}>Cancelar</button>
                            </div>
                          </div>
                        ) : (
                         <>
                            {comment.content && (
                              <p className="card-detail__comment-text">{renderCommentText(comment.content)}</p>
                            )}
                            {renderCommentAttachments(comment.attachments)}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="card-detail__empty-text">No hay comentarios aún.</p>
              )}

              {!isViewer && (
                <form className="card-detail__comment-input" onSubmit={handleCommentSubmit}>
                  <textarea
                    ref={textareaRef}
                    placeholder="Escribe un comentario... Usa @nombre para mencionar"
                    className="card-detail__textarea"
                    rows={2}
                    value={commentText}
                    onChange={handleTextareaChange}
                  />
                  {pendingAttachments.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {pendingAttachments.map(att => (
                        <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--color-bg-base)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '12px' }}>
                          <Paperclip size={12} />
                          <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</span>
                          <button type="button" onClick={() => setPendingAttachments(prev => prev.filter(p => p.id !== att.id))} style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', padding: '0 2px' }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: '6px', borderRadius: '50%' }}
                        onMouseOver={e => e.target.style.background = 'var(--color-neutral-100)'}
                        onMouseOut={e => e.target.style.background = 'none'}
                        title="Adjuntar archivos"
                      >
                        <Paperclip size={20} />
                      </button>
                      <input 
                        type="file" 
                        multiple 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        onChange={(e) => handleFileUpload(e.target.files)}
                      />
                    </div>
                    <button type="submit" className="card-detail__comment-submit" style={{ flexShrink: 0 }} disabled={isUploading}>
                      {isUploading ? 'Subiendo...' : <><Send size={14} /> Comentar</>}
                    </button>
                  </div>
                  
                  {showMentions && (
                    <MentionsList 
                      users={allUsers} 
                      filter={mentionFilter} 
                      onSelect={handleSelectMention} 
                      position={mentionPosition}
                    />
                  )}
                </form>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="card-detail__sidebar">
          {/* Status */}
          <div className="card-detail__field">
            <span className="card-detail__field-label">
              <Activity size={14} /> Estado
            </span>
            {canEdit ? (
              <select 
                className="card-detail__select" 
                value={columnId} 
                onChange={handleStatusChange}
              >
                {columns.map(col => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            ) : (
              <Badge color={currentColumn?.accentColor || '#999'} variant="filled">
                {currentColumn?.name || '—'}
              </Badge>
            )}
          </div>

          {/* Priority */}
          <div className="card-detail__field">
            <span className="card-detail__field-label">
              <Tag size={14} /> Prioridad
            </span>
            {canEdit ? (
              <select 
                className="card-detail__select card-detail__select--priority" 
                value={currentCard.priority} 
                onChange={handlePriorityChange}
                style={{ '--priority-color': priority?.color }}
              >
                {Object.entries(PRIORITY_CONFIG).map(([val, config]) => (
                  <option key={val} value={val}>{config.label}</option>
                ))}
              </select>
            ) : (
              priority && (
                <Badge color={priority.color} variant="solid">
                  {priority.label}
                </Badge>
              )
            )}
          </div>

          {/* Due Date */}
          <div className="card-detail__field">
            <span className="card-detail__field-label">
              <Calendar size={14} /> Fecha límite
            </span>
            {canEdit ? (
              <input 
                type="date" 
                className="card-detail__date-input" 
                value={currentCard.dueDate || ''} 
                onChange={handleDueDateChange} 
              />
            ) : (
              <span className="card-detail__field-value">{formatDate(currentCard.dueDate)}</span>
            )}
          </div>

          {/* Created */}
          <div className="card-detail__field">
            <span className="card-detail__field-label">
              <Clock size={14} /> Creación
            </span>
            <span className="card-detail__field-value">{formatDate(currentCard.createdAt)}</span>
          </div>

          {/* Created By */}
          <div className="card-detail__field">
            <span className="card-detail__field-label">
              <User size={14} /> Creado por
            </span>
            {createdByUser && (
              <div className="card-detail__user-chip">
                <Avatar user={createdByUser} size="xs" />
                <span>{createdByUser.fullName}</span>
              </div>
            )}
          </div>

          {/* Assignees */}
          <div className="card-detail__field">
            <span className="card-detail__field-label">
              <User size={14} /> Asignados
            </span>
            <div className="card-detail__assignees-list">
              {assignees.map((user) => (
                <div key={user.id} className="card-detail__user-chip">
                  <Avatar user={user} size="xs" showAiBadge={user.isAiAgent} />
                  <span>{user.fullName}</span>
                  {canEdit && (
                    <button 
                      type="button"
                      className="card-detail__remove-btn" 
                      onClick={(e) => toggleAssignee(e, user.id)}
                      title="Quitar asignado"
                    >×</button>
                  )}
                </div>
              ))}
              {canEdit && (
                <select 
                  className="card-detail__add-select"
                  value=""
                  onChange={(e) => toggleAssignee(null, e.target.value)}
                >
                  <option value="" disabled>+ Añadir...</option>
                  {allUsers
                    .filter(u => !rawAssignees.includes(u.id))
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.fullName}</option>
                    ))
                  }
                </select>
              )}
            </div>
          </div>

          {/* Labels */}
          <div className="card-detail__field">
            <span className="card-detail__field-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Tag size={14} /> Etiquetas
              </div>
              {canEdit && (
                <button onClick={() => setIsLabelsModalOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 0 }} title="Gestionar Etiquetas">
                  ✎
                </button>
              )}
            </span>
            <div className="card-detail__labels-list">
              {canEdit ? (
                allLabels.map(label => {
                  if (editingLabelId === label.id) {
                    return (
                      <div key={`edit-${label.id}`} style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <input value={editLabelData.name} onChange={(e) => setEditLabelData({...editLabelData, name: e.target.value})} style={{ width: '80px', padding: '2px', fontSize: '12px' }} />
                        <input type="color" value={editLabelData.color} onChange={(e) => setEditLabelData({...editLabelData, color: e.target.value})} style={{ width: '24px', height: '24px', padding: 0, border: 'none' }} />
                        <button onClick={() => { updateLabel(label.id, editLabelData); setEditingLabelId(null); }} style={{ background: 'none', border: 'none', color: 'green', cursor: 'pointer' }}>✓</button>
                      </div>
                    );
                  }
                  const isActive = rawLabels.includes(label.id);
                  return (
                    <div key={label.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <button
                        type="button"
                        className={`card-detail__label-toggle ${isActive ? 'card-detail__label-toggle--active' : ''}`}
                        onClick={(e) => toggleLabel(e, label.id)}
                        style={{ '--label-color': label.color }}
                      >
                        {label.name}
                      </button>
                    </div>
                  );
                })
              ) : (
                labels.map((label) => (
                  <Badge key={label.id} color={label.color}>
                    {label.name}
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="card-detail__field">
            <span className="card-detail__field-label">
              <Paperclip size={14} /> Archivos ({currentCard.attachments?.length || 0})
            </span>
            <div className="card-detail__attachments-list-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {currentCard.attachments?.length > 0 ? (
                currentCard.attachments.map((att) => (
                  <a 
                    key={att.id} 
                    href={att.url} 
                    download={att.name}
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: '8px', 
                      background: 'var(--color-bg-base)', 
                      borderRadius: '6px', 
                      border: '1px solid var(--color-border)',
                      fontSize: '12px',
                      color: 'var(--color-text-primary)',
                      textDecoration: 'none'
                    }}
                  >
                    {isImg(att.name) ? <Image size={14} /> : <FileText size={14} />}
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{att.name}</span>
                    <Maximize2 size={12} style={{ opacity: 0.5 }} />
                  </a>
                ))
              ) : (
                <span className="card-detail__empty-text">Sin archivos</span>
              )}
            </div>
          </div>
        </aside>
      </div>
      <EditLabelsModal isOpen={isLabelsModalOpen} onClose={() => setIsLabelsModalOpen(false)} />

      {selectedImage && (
        <div className="lightbox" onClick={() => setSelectedImage(null)}>
          <button className="lightbox__close" onClick={() => setSelectedImage(null)}>
            <X size={24} />
          </button>
          <img src={selectedImage} alt="Preview" className="lightbox__image" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </Modal>
  );
}
