/**
 * Format bytes to human-readable format
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format date to readable format
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format file path to show only the last segments
 */
export const formatPath = (path, segments = 3) => {
  const parts = path.split(/[\\/]/);
  if (parts.length <= segments) return path;
  return '...' + parts.slice(-segments).join('/');
};

/**
 * Get file icon based on extension
 */
export const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();

  const iconMap = {
    // Documents
    pdf: '📄',
    doc: '📄',
    docx: '📄',
    txt: '📝',
    xls: '📊',
    xlsx: '📊',

    // Images
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    svg: '🖼️',

    // Audio
    mp3: '🎵',
    wav: '🎵',
    flac: '🎵',

    // Video
    mp4: '🎬',
    mkv: '🎬',
    avi: '🎬',
    mov: '🎬',

    // Code
    js: '📜',
    py: '📜',
    java: '📜',
    cpp: '📜',

    // Archives
    zip: '📦',
    rar: '📦',
    '7z': '📦',
  };

  return iconMap[ext] || '📄';
};
