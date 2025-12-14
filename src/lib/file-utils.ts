// Client-side utility functions for file handling
// (Not server actions, so they don't need to be async)

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️'
  if (fileType.startsWith('video/')) return '🎥'
  if (fileType.startsWith('audio/')) return '🎵'
  if (fileType === 'application/pdf') return '📄'
  if (fileType.includes('word')) return '📝'
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️'
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return '🗜️'
  if (fileType.includes('text')) return '📃'
  return '📎'
}
