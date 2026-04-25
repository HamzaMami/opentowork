import { useRef } from 'react';
import { Button } from '../ui/button';

const ProfileImageUploader = ({ imagePreview, setImagePreview, setFormData, onRemoveImage, type }) => {
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, profileImage: file }));
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    // Call the parent's removal handler if provided
    if (onRemoveImage) {
      onRemoveImage();
    } else {
      setImagePreview(null);
      setFormData(prev => ({ ...prev, profileImage: null }));
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="profile-image-container">
      {imagePreview ? (
        <img src={imagePreview} alt={`${type} Profile`} className="profile-image-preview" />
      ) : (
        <div className="profile-image-placeholder">Upload Image</div>
      )}

      <div className="profile-image-actions">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current.click()}
        >
          {imagePreview ? 'Change Image' : 'Upload Image'}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: 'none' }}
        />

        {imagePreview && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleRemoveImage}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProfileImageUploader;
