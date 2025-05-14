const DiaryEntry = require('../models/DiaryEntry');
const { validationResult } = require('express-validator');

// @desc    Criar uma nova entrada do diário
// @route   POST /api/tools/diary
// @access  Private
exports.createDiaryEntry = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { emotionalState, dominantThoughts, victories, tomorrowGoals, additionalNotes } = req.body;
  
  try {
    // Verificar se já existe uma entrada para o dia atual
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const existingEntry = await DiaryEntry.findOne({
      user: req.user.id,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: 'Você já criou uma entrada no diário hoje. Você pode editar a entrada existente.'
      });
    }
    
    const diaryEntry = await DiaryEntry.create({
      user: req.user.id,
      emotionalState,
      dominantThoughts,
      victories,
      tomorrowGoals,
      additionalNotes
    });
    
    res.status(201).json({
      success: true,
      data: diaryEntry
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// @desc    Obter todas as entradas do diário do usuário
// @route   GET /api/tools/diary
// @access  Private
exports.getDiaryEntries = async (req, res) => {
  try {
    // Opções de paginação
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filtragem por data
    let dateFilter = {};
    
    if (req.query.startDate) {
      const startDate = new Date(req.query.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      dateFilter.$gte = startDate;
    }
    
    if (req.query.endDate) {
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      dateFilter.$lte = endDate;
    }
    
    const query = { user: req.user.id };
    
    if (Object.keys(dateFilter).length > 0) {
      query.date = dateFilter;
    }
    
    // Executar consulta
    const entries = await DiaryEntry.find(query)
      .sort({ date: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Contar total de resultados para paginação
    const total = await DiaryEntry.countDocuments(query);
    
    // Montar resposta com paginação
    const pagination = {};
    
    if (startIndex + limit < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    res.status(200).json({
      success: true,
      count: entries.length,
      pagination,
      total,
      data: entries
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// @desc    Obter uma entrada específica do diário
// @route   GET /api/tools/diary/:id
// @access  Private
exports.getDiaryEntry = async (req, res) => {
  try {
    const entry = await DiaryEntry.findById(req.params.id);
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entrada não encontrada'
      });
    }
    
    // Verificar se o usuário é dono da entrada
    if (entry.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a acessar esta entrada'
      });
    }
    
    res.status(200).json({
      success: true,
      data: entry
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// @desc    Atualizar uma entrada do diário
// @route   PUT /api/tools/diary/:id
// @access  Private
exports.updateDiaryEntry = async (req, res) => {
  const { emotionalState, dominantThoughts, victories, tomorrowGoals, additionalNotes } = req.body;
  
  try {
    let entry = await DiaryEntry.findById(req.params.id);
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entrada não encontrada'
      });
    }
    
    // Verificar se o usuário é dono da entrada
    if (entry.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a atualizar esta entrada'
      });
    }
    
    const fieldsToUpdate = {
      emotionalState: emotionalState || entry.emotionalState,
      dominantThoughts: dominantThoughts || entry.dominantThoughts,
      victories: victories || entry.victories,
      tomorrowGoals: tomorrowGoals || entry.tomorrowGoals,
      additionalNotes: additionalNotes || entry.additionalNotes
    };
    
    entry = await DiaryEntry.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: entry
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// @desc    Excluir uma entrada do diário
// @route   DELETE /api/tools/diary/:id
// @access  Private
exports.deleteDiaryEntry = async (req, res) => {
  try {
    const entry = await DiaryEntry.findById(req.params.id);
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Entrada não encontrada'
      });
    }
    
    // Verificar se o usuário é dono da entrada
    if (entry.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a excluir esta entrada'
      });
    }
    
    await entry.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// @desc    Obter estatísticas das entradas do diário
// @route   GET /api/tools/diary/stats
// @access  Private
exports.getDiaryStats = async (req, res) => {
  try {
    // Contar total de entradas
    const totalEntries = await DiaryEntry.countDocuments({ user: req.user.id });
    
    // Calcular streak de dias consecutivos
    let currentStreak = 0;
    let maxStreak = 0;
    
    // Buscar todas as entradas ordenadas por data (mais recente primeiro)
    const entries = await DiaryEntry.find({ user: req.user.id })
      .sort({ date: -1 })
      .select('date');
    
    if (entries.length > 0) {
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      // Verificar se há entrada para hoje
      const latestEntryDate = new Date(entries[0].date);
      latestEntryDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((currentDate - latestEntryDate) / (1000 * 60 * 60 * 24));
      
      // Se não houver entrada hoje, o streak começa de zero
      if (diffDays > 1) {
        currentStreak = 0;
      } else {
        currentStreak = 1;
        
        // Verificar dias consecutivos
        for (let i = 0; i < entries.length - 1; i++) {
          const currentEntryDate = new Date(entries[i].date);
          currentEntryDate.setHours(0, 0, 0, 0);
          
          const nextEntryDate = new Date(entries[i + 1].date);
          nextEntryDate.setHours(0, 0, 0, 0);
          
          const diffDays = Math.floor((currentEntryDate - nextEntryDate) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
      
      // Calcular maior streak (isso seria mais complexo na realidade)
      maxStreak = currentStreak;
    }
    
    // Buscar estados emocionais mais frequentes
    const emotionalStates = await DiaryEntry.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: '$emotionalState', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalEntries,
        currentStreak,
        maxStreak,
        emotionalStates
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};
