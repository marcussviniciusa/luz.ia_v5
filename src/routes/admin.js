const express = require('express');
const { check } = require('express-validator');
const {
  getUsers,
  getPendingUsers,
  getUser,
  createUser,
  updateUser,
  approveUser,
  disableUser,
  deleteUser,
  getStats
} = require('../controllers/admin');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas deste arquivo são protegidas e restritas a administradores
router.use(protect);
router.use(authorize('admin'));

// Estatísticas
router.get('/stats', getStats);

// Rotas de usuários
router.route('/users')
  .get(getUsers)
  .post(
    [
      check('name', 'Nome é obrigatório').not().isEmpty(),
      check('email', 'Por favor, inclua um email válido').isEmail(),
      check('password', 'Por favor, entre com uma senha de 6 ou mais caracteres')
        .isLength({ min: 6 })
    ],
    createUser
  );

router.get('/users/pending', getPendingUsers);

router.route('/users/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

router.put('/users/:id/approve', approveUser);
router.put('/users/:id/disable', disableUser);

module.exports = router;
