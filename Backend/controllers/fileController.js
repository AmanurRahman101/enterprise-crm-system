// File Controller
const db = require('../db/connection');
const path = require('path');
const fs = require('fs').promises;

// Get files for current organization
const getFiles = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { entityType, entityId } = req.query;

    let query = `
      SELECT f.*, u.full_name as uploaded_by_name
      FROM files f
      LEFT JOIN users u ON f.uploaded_by_user_id = u.id
      WHERE f.organization_id = ?
    `;
    const params = [organizationId];

    if (entityType) {
      query += ' AND f.entity_type = ?';
      params.push(entityType);
    }
    if (entityId) {
      query += ' AND f.entity_id = ?';
      params.push(entityId);
    }

    query += ' ORDER BY f.created_at DESC';

    const [files] = await db.query(query, params);

    res.status(200).json({
      success: true,
      files: files.map(file => ({
        id: file.id,
        filename: file.filename,
        originalFilename: file.original_filename,
        filePath: `/api/files/${file.id}/download`,
        mimeType: file.mime_type,
        fileSize: file.file_size,
        entityType: file.entity_type,
        entityId: file.entity_id,
        uploadedBy: file.uploaded_by_name,
        createdAt: file.created_at
      }))
    });

  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching files.',
      error: error.message
    });
  }
};

// Download file
const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const [files] = await db.query(
      'SELECT * FROM files WHERE id = ? AND organization_id = ?',
      [id, organizationId]
    );

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found.'
      });
    }

    const file = files[0];
    const filePath = path.join(__dirname, '..', file.file_path);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'File not found on disk.'
      });
    }

    res.download(filePath, file.original_filename);

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error downloading file.',
      error: error.message
    });
  }
};

// Delete file
const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const [files] = await db.query(
      'SELECT * FROM files WHERE id = ? AND organization_id = ?',
      [id, organizationId]
    );

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'File not found.'
      });
    }

    const file = files[0];
    const filePath = path.join(__dirname, '..', file.file_path);

    // Delete file from disk
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file from disk:', error);
    }

    // Delete record from database
    await db.query(
      'DELETE FROM files WHERE id = ? AND organization_id = ?',
      [id, organizationId]
    );

    res.status(200).json({
      success: true,
      message: 'File deleted successfully.'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting file.',
      error: error.message
    });
  }
};

module.exports = {
  getFiles,
  downloadFile,
  deleteFile
};

