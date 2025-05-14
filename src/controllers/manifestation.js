const ManifestationBoard = require('../models/ManifestationBoard');
const { minioClient } = require('../config/minio');
const { validationResult } = require('express-validator');

// @desc    Criar novo quadro de manifestação
// @route   POST /api/tools/manifestation
// @access  Private
exports.createManifestationBoard = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description } = req.body;
  
  try {
    const board = await ManifestationBoard.create({
      user: req.user.id,
      title,
      description
    });
    
    res.status(201).json({
      success: true,
      data: board
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// @desc    Obter todos os quadros de manifestação do usuário
// @route   GET /api/tools/manifestation
// @access  Private
exports.getManifestationBoards = async (req, res) => {
  try {
    const boards = await ManifestationBoard.find({ user: req.user.id })
      .sort({ updatedAt: -1 });
    
    res.status(200).json({
      success: true,
      count: boards.length,
      data: boards
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// @desc    Obter um quadro de manifestação específico
// @route   GET /api/tools/manifestation/:id
// @access  Private
exports.getManifestationBoard = async (req, res) => {
  try {
    const board = await ManifestationBoard.findById(req.params.id);
    
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Quadro não encontrado'
      });
    }
    
    // Verificar se o usuário é dono do quadro
    if (board.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a acessar este quadro'
      });
    }
    
    res.status(200).json({
      success: true,
      data: board
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// @desc    Atualizar um quadro de manifestação
// @route   PUT /api/tools/manifestation/:id
// @access  Private
exports.updateManifestationBoard = async (req, res) => {
  const { title, description, personalSymbolUrl } = req.body;
  
  try {
    let board = await ManifestationBoard.findById(req.params.id);
    
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Quadro não encontrado'
      });
    }
    
    // Verificar se o usuário é dono do quadro
    if (board.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a atualizar este quadro'
      });
    }
    
    const fieldsToUpdate = {};
    
    if (title) fieldsToUpdate.title = title;
    if (description) fieldsToUpdate.description = description;
    if (personalSymbolUrl) fieldsToUpdate.personalSymbolUrl = personalSymbolUrl;
    
    // Se não há campos para atualizar, retorna o quadro sem modificação
    if (Object.keys(fieldsToUpdate).length === 0) {
      return res.status(200).json({
        success: true,
        data: board
      });
    }
    
    board = await ManifestationBoard.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: board
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// @desc    Excluir um quadro de manifestação
// @route   DELETE /api/tools/manifestation/:id
// @access  Private
exports.deleteManifestationBoard = async (req, res) => {
  try {
    const board = await ManifestationBoard.findById(req.params.id);
    
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Quadro não encontrado'
      });
    }
    
    // Verificar se o usuário é dono do quadro
    if (board.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a excluir este quadro'
      });
    }
    
    // Se houver imagens associadas, excluí-las do MinIO
    const imagePromises = [];
    
    if (board.personalSymbolUrl) {
      const objectName = board.personalSymbolUrl.split('/').pop();
      imagePromises.push(
        minioClient.removeObject(process.env.MINIO_BUCKET, `symbols/${objectName}`)
      );
    }
    
    board.items.forEach(item => {
      if (item.imageUrl) {
        const objectName = item.imageUrl.split('/').pop();
        imagePromises.push(
          minioClient.removeObject(process.env.MINIO_BUCKET, `manifestation/${objectName}`)
        );
      }
    });
    
    // Aguardar a exclusão das imagens
    await Promise.all(imagePromises).catch(err => console.error('Erro ao excluir imagens:', err));
    
    // Excluir o quadro
    await board.deleteOne();
    
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

// @desc    Adicionar item ao quadro de manifestação
// @route   POST /api/tools/manifestation/:id/items
// @access  Private
exports.addManifestationItem = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, imageUrl, emotions, steps, targetDate } = req.body;
  
  try {
    const board = await ManifestationBoard.findById(req.params.id);
    
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Quadro não encontrado'
      });
    }
    
    // Verificar se o usuário é dono do quadro
    if (board.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a modificar este quadro'
      });
    }
    
    // Criar novo item
    const newItem = {
      title,
      description,
      imageUrl,
      emotions,
      steps: steps || [],
      targetDate: targetDate ? new Date(targetDate) : undefined,
      status: 'pending'
    };
    
    // Adicionar item ao quadro
    board.items.push(newItem);
    await board.save();
    
    res.status(201).json({
      success: true,
      data: board.items[board.items.length - 1]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// @desc    Atualizar um item do quadro de manifestação
// @route   PUT /api/tools/manifestation/:boardId/items/:itemId
// @access  Private
exports.updateManifestationItem = async (req, res) => {
  const { title, description, imageUrl, emotions, steps, targetDate, status } = req.body;
  
  try {
    const board = await ManifestationBoard.findById(req.params.boardId);
    
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Quadro não encontrado'
      });
    }
    
    // Verificar se o usuário é dono do quadro
    if (board.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a modificar este quadro'
      });
    }
    
    // Encontrar o item a ser atualizado
    const itemIndex = board.items.findIndex(
      item => item._id.toString() === req.params.itemId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado'
      });
    }
    
    // Atualizar campos
    if (title) board.items[itemIndex].title = title;
    if (description) board.items[itemIndex].description = description;
    if (imageUrl) board.items[itemIndex].imageUrl = imageUrl;
    if (emotions) board.items[itemIndex].emotions = emotions;
    if (steps) board.items[itemIndex].steps = steps;
    if (targetDate) board.items[itemIndex].targetDate = new Date(targetDate);
    if (status) board.items[itemIndex].status = status;
    
    await board.save();
    
    res.status(200).json({
      success: true,
      data: board.items[itemIndex]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// @desc    Excluir um item do quadro de manifestação
// @route   DELETE /api/tools/manifestation/:boardId/items/:itemId
// @access  Private
exports.deleteManifestationItem = async (req, res) => {
  try {
    const board = await ManifestationBoard.findById(req.params.boardId);
    
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Quadro não encontrado'
      });
    }
    
    // Verificar se o usuário é dono do quadro
    if (board.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a modificar este quadro'
      });
    }
    
    // Encontrar o item a ser excluído
    const itemIndex = board.items.findIndex(
      item => item._id.toString() === req.params.itemId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado'
      });
    }
    
    // Se o item tiver uma imagem, excluí-la do MinIO
    if (board.items[itemIndex].imageUrl) {
      const objectName = board.items[itemIndex].imageUrl.split('/').pop();
      await minioClient.removeObject(process.env.MINIO_BUCKET, `manifestation/${objectName}`)
        .catch(err => console.error('Erro ao excluir imagem:', err));
    }
    
    // Remover o item do array
    board.items.splice(itemIndex, 1);
    await board.save();
    
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
