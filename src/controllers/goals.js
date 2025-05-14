const Goal = require('../models/Goal');
const { validationResult } = require('express-validator');

// @desc    Obter todas as metas do usuário
// @route   GET /api/goals
// @access  Private
exports.getGoals = async (req, res) => {
  try {
    // Opções de filtragem
    const filter = { user: req.user.id };
    
    // Filtragem por categoria, se fornecida
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    // Filtragem por status, se fornecido
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Opções de ordenação
    let sort = {};
    if (req.query.sort) {
      if (req.query.sort === 'recent') {
        sort = { createdAt: -1 };
      } else if (req.query.sort === 'progress') {
        sort = { progress: -1 };
      } else if (req.query.sort === 'deadline') {
        sort = { deadline: 1 };
      }
    } else {
      // Ordenação padrão: pinned primeiro, depois mais recentes
      sort = { pinned: -1, createdAt: -1 };
    }
    
    // Paginação
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Executar consulta principal
    const goals = await Goal.find(filter)
      .sort(sort)
      .skip(startIndex)
      .limit(limit)
      .select('title category status progress deadline pinned createdAt updatedAt');
    
    // Contar total para paginação
    const total = await Goal.countDocuments(filter);
    
    // Calcular informações de paginação
    const pagination = {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    };
    
    res.status(200).json({
      success: true,
      count: goals.length,
      pagination,
      data: goals
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter metas'
    });
  }
};

// @desc    Obter uma meta específica
// @route   GET /api/goals/:id
// @access  Private
exports.getGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Meta não encontrada'
      });
    }
    
    // Verificar se o usuário é dono da meta
    if (goal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a acessar esta meta'
      });
    }
    
    res.status(200).json({
      success: true,
      data: goal
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter meta'
    });
  }
};

// @desc    Criar uma nova meta
// @route   POST /api/goals
// @access  Private
exports.createGoal = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    // Adicionar usuário ao body
    req.body.user = req.user.id;
    
    // Criar meta
    const goal = await Goal.create(req.body);
    
    res.status(201).json({
      success: true,
      data: goal
    });
  } catch (err) {
    console.error(err);
    
    // Tratamento específico para erros de validação do Mongoose
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro ao criar meta'
    });
  }
};

// @desc    Atualizar uma meta
// @route   PUT /api/goals/:id
// @access  Private
exports.updateGoal = async (req, res) => {
  try {
    let goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Meta não encontrada'
      });
    }
    
    // Verificar se o usuário é dono da meta
    if (goal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a atualizar esta meta'
      });
    }
    
    // Remover campo de usuário para evitar alteração do proprietário
    if (req.body.user) {
      delete req.body.user;
    }
    
    // Atualizar meta
    goal = await Goal.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: goal
    });
  } catch (err) {
    console.error(err);
    
    // Tratamento específico para erros de validação do Mongoose
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar meta'
    });
  }
};

// @desc    Excluir uma meta
// @route   DELETE /api/goals/:id
// @access  Private
exports.deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Meta não encontrada'
      });
    }
    
    // Verificar se o usuário é dono da meta
    if (goal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a excluir esta meta'
      });
    }
    
    await goal.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir meta'
    });
  }
};

// @desc    Adicionar um marco à meta
// @route   POST /api/goals/:id/milestones
// @access  Private
exports.addMilestone = async (req, res) => {
  try {
    const { title, dueDate } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, forneça um título para o marco'
      });
    }
    
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Meta não encontrada'
      });
    }
    
    // Verificar se o usuário é dono da meta
    if (goal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a modificar esta meta'
      });
    }
    
    // Adicionar novo marco
    const milestone = {
      title,
      dueDate: dueDate || null,
      completed: false
    };
    
    goal.milestones.push(milestone);
    
    // Recalcular o progresso
    goal.progress = goal.calculateProgress();
    
    await goal.save();
    
    res.status(200).json({
      success: true,
      data: goal
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar marco'
    });
  }
};

// @desc    Atualizar status de um marco
// @route   PUT /api/goals/:id/milestones/:milestoneId
// @access  Private
exports.updateMilestone = async (req, res) => {
  try {
    const { completed } = req.body;
    
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Meta não encontrada'
      });
    }
    
    // Verificar se o usuário é dono da meta
    if (goal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a modificar esta meta'
      });
    }
    
    // Encontrar e atualizar o marco
    const milestone = goal.milestones.id(req.params.milestoneId);
    
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Marco não encontrado'
      });
    }
    
    milestone.completed = completed;
    
    if (completed) {
      milestone.completedAt = Date.now();
    } else {
      milestone.completedAt = undefined;
    }
    
    // Recalcular o progresso
    goal.progress = goal.calculateProgress();
    
    await goal.save();
    
    res.status(200).json({
      success: true,
      data: goal
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar marco'
    });
  }
};

// @desc    Adicionar uma afirmação à meta
// @route   POST /api/goals/:id/affirmations
// @access  Private
exports.addAffirmation = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, forneça o texto da afirmação'
      });
    }
    
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Meta não encontrada'
      });
    }
    
    // Verificar se o usuário é dono da meta
    if (goal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a modificar esta meta'
      });
    }
    
    // Adicionar nova afirmação
    goal.affirmations.push({ text });
    
    await goal.save();
    
    res.status(200).json({
      success: true,
      data: goal
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar afirmação'
    });
  }
};

// @desc    Atualizar status de fixação da meta
// @route   PUT /api/goals/:id/pin
// @access  Private
exports.togglePin = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Meta não encontrada'
      });
    }
    
    // Verificar se o usuário é dono da meta
    if (goal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a modificar esta meta'
      });
    }
    
    // Alternar status de fixação
    goal.pinned = !goal.pinned;
    
    await goal.save();
    
    res.status(200).json({
      success: true,
      data: goal
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status de fixação'
    });
  }
};

// @desc    Obter estatísticas de metas do usuário
// @route   GET /api/goals/stats
// @access  Private
exports.getGoalStats = async (req, res) => {
  try {
    // Total de metas por categoria
    const categoryCounts = await Goal.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Total de metas por status
    const statusCounts = await Goal.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Metas concluídas nos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentlyCompleted = await Goal.countDocuments({
      user: req.user.id,
      status: 'concluida',
      updatedAt: { $gte: thirtyDaysAgo }
    });
    
    // Progresso médio de todas as metas ativas
    const progressStats = await Goal.aggregate([
      { 
        $match: { 
          user: mongoose.Types.ObjectId(req.user.id),
          status: { $in: ['planejada', 'em-progresso'] }
        } 
      },
      { 
        $group: { 
          _id: null,
          avgProgress: { $avg: '$progress' },
          count: { $sum: 1 }
        } 
      }
    ]);
    
    const avgProgress = progressStats.length > 0 ? progressStats[0].avgProgress : 0;
    
    res.status(200).json({
      success: true,
      data: {
        totalGoals: await Goal.countDocuments({ user: req.user.id }),
        categoryCounts,
        statusCounts,
        recentlyCompleted,
        avgProgress
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas'
    });
  }
};
