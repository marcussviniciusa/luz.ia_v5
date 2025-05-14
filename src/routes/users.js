const express = require('express');
const { check } = require('express-validator');
const {
  getUserProfile,
  updateUserProfile,
  updatePassword,
  getUserStats
} = require('../controllers/users');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas são protegidas
router.use(protect);

// Perfil do usuário
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// Atualização de senha
router.put(
  '/password',
  [
    check('currentPassword', 'Senha atual é obrigatória').not().isEmpty(),
    check('newPassword', 'Nova senha deve ter pelo menos 6 caracteres').isLength({ min: 6 })
  ],
  updatePassword
);

// Estatísticas do usuário
router.get('/stats', getUserStats);

module.exports = router;
