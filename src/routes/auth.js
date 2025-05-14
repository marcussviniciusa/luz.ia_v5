const express = require('express');
const { check } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  logout
} = require('../controllers/auth');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Rotas públicas
router.post(
  '/register',
  [
    check('name', 'Nome é obrigatório').not().isEmpty(),
    check('email', 'Por favor, inclua um email válido').isEmail(),
    check('password', 'Por favor, entre com uma senha de 6 ou mais caracteres')
      .isLength({ min: 6 })
  ],
  register
);

router.post(
  '/login',
  [
    check('email', 'Por favor, inclua um email válido').isEmail(),
    check('password', 'Senha é obrigatória').exists()
  ],
  login
);

router.get('/logout', logout);

// Rotas protegidas
router.get('/me', protect, getMe);

router.put('/updatedetails', protect, updateDetails);

router.put(
  '/updatepassword',
  [
    check('currentPassword', 'Senha atual é obrigatória').not().isEmpty(),
    check('newPassword', 'Por favor, entre com uma senha de 6 ou mais caracteres')
      .isLength({ min: 6 })
  ],
  protect,
  updatePassword
);

module.exports = router;
