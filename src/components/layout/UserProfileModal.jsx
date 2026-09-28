import { useState, useRef } from 'react';
import { X, Camera, Save, User as UserIcon, Mail, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import ImageCropper from '../ui/ImageCropper';
import './UserProfileModal.css';

/**
 * Premium modal for viewing and editing user profile data.
 * Allows changing the name and selecting a profile theme color.
 */
export default function UserProfileModal({ isOpen, onClose }) {
  const { currentUser, updateUserProfile } = useAuth();
  
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [selectedColor, setSelectedColor] = useState(currentUser?.color || '#4A90D9');
  const [tempAvatarUrl, setTempAvatarUrl] = useState(currentUser?.avatarUrl || null);
  const [rawImage, setRawImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen || !currentUser) return null;

  const colors = [
    '#4A90D9', '#38C97A', '#F5A623', '#E74C3C', 
    '#9B59B6', '#1ABC9C', '#3498DB', '#E67E22'
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setRawImage(reader.result);
        setShowCropper(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage) => {
    setTempAvatarUrl(croppedImage);
    setShowCropper(false);
    setRawImage(null);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setRawImage(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    updateUserProfile({
      fullName,
      color: selectedColor,
      avatarUrl: tempAvatarUrl,
      initials: fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    });
    
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <div className="profile-modal__header">
          <h2>Mi Perfil</h2>
          <button className="profile-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form className="profile-modal__form" onSubmit={handleSave}>
          <div className="profile-modal__avatar-section">
            <div className="profile-modal__avatar-container">
              <Avatar 
                user={{ ...currentUser, fullName, color: selectedColor, avatarUrl: tempAvatarUrl }} 
                size="xl" 
                className="profile-modal__avatar"
              />
              <button 
                type="button" 
                className="profile-modal__avatar-edit" 
                title="Cambiar imagen"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={14} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="profile-modal__file-input" 
                accept="image/*"
                onChange={handleFileChange}
                aria-hidden="true"
              />
            </div>
            <div className="profile-modal__user-meta">
              <span className="profile-modal__user-badge">
                <Shield size={12} />
                {currentUser.role === 'admin' ? 'Administrador' : 'Colaborador'}
              </span>
              <p className="profile-modal__user-email">{currentUser.email}</p>
            </div>
          </div>

          <div className="profile-modal__fields">
            <div className="profile-modal__field">
              <label>Nombre Completo</label>
              <div className="profile-modal__input-wrapper">
                <UserIcon size={18} className="profile-modal__input-icon" />
                <input 
                  type="text" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                />
              </div>
            </div>

            <div className="profile-modal__field">
              <label>Correo Electrónico</label>
              <div className="profile-modal__input-wrapper profile-modal__input-wrapper--disabled">
                <Mail size={18} className="profile-modal__input-icon" />
                <input type="email" value={currentUser.email} disabled />
              </div>
              <p className="profile-modal__field-hint">El correo no puede ser modificado.</p>
            </div>

            <div className="profile-modal__field">
              <label>Color de Identidad</label>
              <div className="profile-modal__color-grid">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`profile-modal__color-option ${selectedColor === color ? 'profile-modal__color-option--active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                    aria-label={`Seleccionar color ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="profile-modal__footer">
            <button type="button" className="profile-modal__btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="profile-modal__btn-save" disabled={isSaving}>
              {isSaving ? <span className="profile-modal__spinner" /> : <><Save size={18} /> Guardar cambios</>}
            </button>
          </div>
        </form>

        {showCropper && (
          <ImageCropper 
            image={rawImage} 
            onCropComplete={handleCropComplete} 
            onCancel={handleCropCancel} 
          />
        )}
      </div>
    </div>
  );
}
