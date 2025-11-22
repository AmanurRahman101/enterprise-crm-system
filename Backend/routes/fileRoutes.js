// File Routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const db = require('../db/connection');
const { authenticate } = require('../middleware/auth');
const { logFileUpload } = require('../middleware/activityLogger');
const { getFiles, downloadFile, deleteFile } = require('../controllers/fileController');

// Configure multer storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const organizationId = req.user.organizationId;
    const uploadPath = path.join(__dirname, '..', 'uploads', organizationId.toString());
    
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter - whitelist extensions
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.docx', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: PDF, DOCX, JPG, PNG'));
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Upload file
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded.'
      });
    }

    const organizationId = req.user.organizationId;
    const userId = req.user.userId;
    const { entityType, entityId } = req.body;

    const filePath = path.relative(path.join(__dirname, '..'), req.file.path);

    // Insert file record
    const [result] = await db.query(
      `INSERT INTO files (organization_id, uploaded_by_user_id, filename, original_filename, file_path, mime_type, file_size, entity_type, entity_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        organizationId,
        userId,
        req.file.filename,
        req.file.originalname,
        filePath,
        req.file.mimetype,
        req.file.size,
        entityType || null,
        entityId || null
      ]
    );

    const [newFiles] = await db.query('SELECT * FROM files WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully.',
      file: {
        id: newFiles[0].id,
        filename: newFiles[0].filename,
        originalFilename: newFiles[0].original_filename,
        filePath: `/api/files/${newFiles[0].id}/download`,
        mimeType: newFiles[0].mime_type,
        fileSize: newFiles[0].file_size
      }
    });

  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error uploading file.',
      error: error.message
    });
  }
}, logFileUpload);

router.get('/', authenticate, getFiles);
router.get('/:id/download', authenticate, downloadFile);
router.delete('/:id', authenticate, deleteFile);

module.exports = router;

