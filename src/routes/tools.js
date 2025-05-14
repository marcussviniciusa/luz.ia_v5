const express = require('express');
const { check } = require('express-validator');
const {
  createDiaryEntry,
  getDiaryEntries,
  getDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
  getDiaryStats
} = require('../controllers/diary');

const {
  createManifestationBoard,
  getManifestationBoards,
  getManifestationBoard,
  updateManifestationBoard,
  deleteManifestationBoard,
  addManifestationItem,
  updateManifestationItem,
  deleteManifestationItem
} = require('../controllers/manifestation');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas são protegidas
router.use(protect);

// Rotas de Diário Quântico
router.route('/diary')
  .post(
    [
      check('emotionalState', 'Estado emocional é obrigatório').not().isEmpty(),
      check('dominantThoughts', 'Pensamentos predominantes são obrigatórios').not().isEmpty(),
      check('victories', 'Vitórias são obrigatórias').not().isEmpty(),
      check('tomorrowGoals', 'Objetivos para amanhã são obrigatórios').not().isEmpty()
    ],
    createDiaryEntry
  )
  .get(getDiaryEntries);

router.get('/diary/stats', getDiaryStats);

router.route('/diary/:id')
  .get(getDiaryEntry)
  .put(updateDiaryEntry)
  .delete(deleteDiaryEntry);

// Rotas de Ferramentas de Manifestação
router.route('/manifestation')
  .post(
    [
      check('title', 'Título é obrigatório').not().isEmpty(),
      check('description', 'Descrição é obrigatória').not().isEmpty()
    ],
    createManifestationBoard
  )
  .get(getManifestationBoards);

router.route('/manifestation/:id')
  .get(getManifestationBoard)
  .put(updateManifestationBoard)
  .delete(deleteManifestationBoard);

router.route('/manifestation/:id/items')
  .post(
    [
      check('title', 'Título é obrigatório').not().isEmpty(),
      check('description', 'Descrição é obrigatória').not().isEmpty()
    ],
    addManifestationItem
  );

router.route('/manifestation/:boardId/items/:itemId')
  .put(updateManifestationItem)
  .delete(deleteManifestationItem);

module.exports = router;
