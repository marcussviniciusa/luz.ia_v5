const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Obter perfil do usuário
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// @desc    Atualizar perfil do usuário
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  const { name, personalDescription } = req.body;

  try {
    const fieldsToUpdate = {};
    
    if (name) fieldsToUpdate.name = name;
    if (personalDescription !== undefined) fieldsToUpdate.personalDescription = personalDescription;

    // Se não há campos para atualizar, retorna o usuário sem modificação
    if (Object.keys(fieldsToUpdate).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum dado fornecido para atualização'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// @desc    Atualizar senha do usuário
// @route   PUT /api/users/password
// @access  Private
exports.updatePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id).select('+password');

    // Verificar senha atual
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }

    // Atualizar senha
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Senha atualizada com sucesso'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// @desc    Obter estatísticas do usuário
// @route   GET /api/users/stats
// @access  Private
exports.getUserStats = async (req, res) => {
  try {
    // Obter estatísticas de uso do usuário
    const userId = req.user.id;

    // Contar diários
    const diaryCount = await mongoose.model('DiaryEntry').countDocuments({ user: userId });

    // Contar quadros de manifestação
    const manifestationCount = await mongoose.model('ManifestationBoard').countDocuments({ user: userId });

    // Contar conversas com a LUZ IA
    const conversationCount = await mongoose.model('Conversation').countDocuments({ user: userId });

    // Data de cadastro
    const registrationDate = new Date(req.user.createdAt);
    const currentDate = new Date();
    const daysRegistered = Math.floor((currentDate - registrationDate) / (1000 * 60 * 60 * 24));

    res.status(200).json({
      success: true,
      data: {
        diaryCount,
        manifestationCount,
        conversationCount,
        daysRegistered
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
