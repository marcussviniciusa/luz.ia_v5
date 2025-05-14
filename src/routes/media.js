const express = require('express');
const {
  upload,
  uploadAvatar,
  uploadManifestationImage,
  uploadSymbol,
  uploadMeditationAudio,
  getMedia
} = require('../controllers/media');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Rota para obter mídia - algumas podem ser públicas, outras protegidas
router.get('/:type/:filename', getMedia);

// Rotas protegidas para upload
router.post('/avatar', protect, upload.single('file'), uploadAvatar);
router.post('/manifestation', protect, upload.single('file'), uploadManifestationImage);
router.post('/symbol', protect, upload.single('file'), uploadSymbol);

// Rota para admin para upload de áudios de meditação
router.post(
  '/meditation',
  protect,
  authorize('admin'),
  upload.single('file'),
  uploadMeditationAudio
);

module.exports = router;
