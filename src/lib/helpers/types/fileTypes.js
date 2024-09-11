// File models
/**
 * @typedef {Object} FileModel
 * @property {string} file_name - The file name.
 * @property {string} [file_data] - The file data.
 * @property {string} [file_url] - The file url.
 */

/**
 * @typedef {Object} TextFileModel
 * @property {string} file_name - The file name.
 * @property {string} [file_extension] - The file extension.
 * @property {string} file_data - The file data or url.
 */

/**
 * @typedef {Object} AudioFileModel
 * @property {string} name - The audio name.
 * @property {string} [artist] - The audio author.
 * @property {string} cover - The audio cover.
 * @property {string} url - The audio url.
 * @property {string} [theme] - The audio theme.
 */

/**
 * @typedef {Object} KnowledgeFileModel
 * @property {string} file_id - The file id.
 * @property {string} file_name - The file name.
 * @property {string} file_extension - The file extension.
 * @property {string} content_type - The content type.
 * @property {string} file_url - The file url.
 */

export default {};