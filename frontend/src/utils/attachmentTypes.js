/** Allowed attachment categories: image, video, document (file). */

const IMAGE_MIME = /^image\//;
const VIDEO_MIME = /^video\//;

const FILE_MIMES = new Set([
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
]);

const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
const VIDEO_EXT = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];
const FILE_EXT = [
  '.pdf', '.doc', '.docx', '.txt', '.csv', '.xls', '.xlsx',
  '.ppt', '.pptx', '.rtf', '.odt', '.ods', '.zip',
];

export const ACCEPT_INPUT =
  'image/*,video/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx,.rtf,.zip,.mp4,.webm,.mov';

function ext(name) {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
}

export function getAttachmentCategory(file) {
  const type = file.type || '';
  const extension = ext(file.name);

  if (IMAGE_MIME.test(type) || IMAGE_EXT.includes(extension)) return 'image';
  if (VIDEO_MIME.test(type) || VIDEO_EXT.includes(extension)) return 'video';
  if (FILE_MIMES.has(type) || FILE_EXT.includes(extension)) return 'file';
  return null;
}

export function isAllowedAttachment(file) {
  return getAttachmentCategory(file) !== null;
}

export function attachmentTypeLabel(category) {
  return { image: 'Image', video: 'Video', file: 'Document' }[category] || 'File';
}
