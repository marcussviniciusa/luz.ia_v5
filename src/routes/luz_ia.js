const express = require('express');
const { check } = require('express-validator');
const {
  chatWithLuzIA,
  getPrompts,
  getPrompt,
  getConversations,
  getConversation,
  deleteConversation
} = require('../controllers/luz_ia');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas são protegidas
router.use(protect);

// Rotas de chat
router.post(
  '/chat',
  [
    check('message', 'Mensagem é obrigatória').not().isEmpty()
  ],
  chatWithLuzIA
);

// Rotas de prompts
router.get('/prompts', getPrompts);
router.get('/prompts/:id', getPrompt);

// Rotas de conversas
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversation);
router.delete('/conversations/:id', deleteConversation);

module.exports = router;
