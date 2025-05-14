const express = require('express');
const { check } = require('express-validator');
const {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  addMilestone,
  updateMilestone,
  addAffirmation,
  togglePin,
  getGoalStats
} = require('../controllers/goals');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas são protegidas
router.use(protect);

// Rotas para metas
router.route('/')
  .get(getGoals)
  .post([
    check('title', 'Título é obrigatório').not().isEmpty(),
    check('category', 'Categoria é obrigatória').not().isEmpty()
  ], createGoal);

// Rota para estatísticas
router.get('/stats', getGoalStats);

// Rotas para metas específicas
router.route('/:id')
  .get(getGoal)
  .put(updateGoal)
  .delete(deleteGoal);

// Rotas para marcos
router.post('/:id/milestones', addMilestone);
router.put('/:id/milestones/:milestoneId', updateMilestone);

// Rotas para afirmações
router.post('/:id/affirmations', addAffirmation);

// Rota para alternar fixação
router.put('/:id/pin', togglePin);

module.exports = router;
