// Cloudinary configuration using environment variables
export const cloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  sources: ['local', 'camera'],
  multiple: false,
  maxFiles: 1,
  maxFileSize: 10000000, // 10MB limit
  allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  styles: {
    palette: {
      window: "#FFFFFF",
      windowBorder: "#90A0B3",
      tabIcon: "#0078FF",
      menuIcons: "#5A616A",
      textDark: "#000000",
      textLight: "#FFFFFF",
      link: "#0078FF",
      action: "#FF620C",
      inactiveTabIcon: "#0E2F5A",
      error: "#F44235",
      inProgress: "#0078FF",
      complete: "#20B832",
      sourceBg: "#E4EBF1"
    }
  }
};

// Function to upload image to Cloudinary
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.uploadPreset);
  formData.append('cloud_name', cloudinaryConfig.cloudName);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const data = await response.json();
    return data.secure_url; // Returns the uploaded image URL
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

// Function to create and open upload widget
export const openUploadWidget = (onSuccess, onError) => {
  if (typeof window !== 'undefined' && window.cloudinary) {
    const widget = window.cloudinary.createUploadWidget(
      cloudinaryConfig,
      (error, result) => {
        if (!error && result && result.event === "success") {
          onSuccess(result.info.secure_url);
        } else if (error) {
          onError(error);
        }
      }
    );
    widget.open();
    return widget;
  } else {
    console.error('Cloudinary widget not available');
    onError(new Error('Cloudinary widget not available'));
  }
}; 