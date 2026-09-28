import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { getCroppedImg } from '../../utils/imageUtils';
import './ImageCropper.css';

/**
 * ImageCropper component that provides a UI for panning and zooming an image
 * to get a circular crop.
 */
export default function ImageCropper({ image, onCropComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const handleApply = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="image-cropper-overlay">
      <div className="image-cropper">
        <div className="image-cropper__header">
          <h3>Ajustar Foto de Perfil</h3>
          <button className="image-cropper__close" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="image-cropper__body">
          <div className="image-cropper__crop-container">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={onCropChange}
              onCropComplete={onCropCompleteCallback}
              onZoomChange={onZoomChange}
            />
          </div>
        </div>

        <div className="image-cropper__footer">
          <div className="image-cropper__zoom-control">
            <ZoomOut size={16} />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="image-cropper__zoom-input"
            />
            <ZoomIn size={16} />
          </div>

          <div className="image-cropper__actions">
            <button className="image-cropper__btn-cancel" onClick={onCancel}>
              Cancelar
            </button>
            <button className="image-cropper__btn-apply" onClick={handleApply}>
              <Check size={18} /> Aplicar recorte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
