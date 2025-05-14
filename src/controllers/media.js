const { minioClient } = require('../config/minio');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Configuração do armazenamento temporário do multer
const storage = multer.memoryStorage();

// Função para filtrar tipos de arquivo
const fileFilter = (req, file, cb) => {
  // Tipos aceitos
  const filetypes = /jpeg|jpg|png|gif|webp/;
  
  // Verificar a extensão do arquivo
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
  // Verificar o mimetype
  const mimetype = filetypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Somente imagens são permitidas (jpeg, jpg, png, gif, webp)'));
  }
};

// Configuração do multer
exports.upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // limite de 5MB
  fileFilter
});

// @desc    Upload de imagem para avatar do usuário
// @route   POST /api/media/avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, envie um arquivo'
      });
    }
    
    // Gerar nome aleatório para o arquivo
    const objectName = `avatar-${req.user.id}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(req.file.originalname)}`;
    
    // Upload para o MinIO
    await minioClient.putObject(
      process.env.MINIO_BUCKET,
      `avatars/${objectName}`,
      req.file.buffer,
      req.file.size,
      req.file.mimetype
    );
    
    // Gerar URL para o arquivo
    const fileUrl = `/api/media/avatars/${objectName}`;
    
    // Atualizar o caminho da foto no perfil do usuário
    req.user.photo = objectName;
    await req.user.save();
    
    res.status(200).json({
      success: true,
      data: {
        fileUrl
      }
    });
  } catch (err) {
    console.error('Erro no upload de avatar:', err);
    res.status(500).json({
      success: false,
      message: 'Erro no upload de avatar'
    });
  }
};

// @desc    Upload de imagem para o quadro de manifestação
// @route   POST /api/media/manifestation
// @access  Private
exports.uploadManifestationImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, envie um arquivo'
      });
    }
    
    // Gerar nome aleatório para o arquivo
    const objectName = `manifest-${req.user.id}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(req.file.originalname)}`;
    
    // Upload para o MinIO
    await minioClient.putObject(
      process.env.MINIO_BUCKET,
      `manifestation/${objectName}`,
      req.file.buffer,
      req.file.size,
      req.file.mimetype
    );
    
    // Gerar URL para o arquivo
    const fileUrl = `/api/media/manifestation/${objectName}`;
    
    res.status(200).json({
      success: true,
      data: {
        fileUrl
      }
    });
  } catch (err) {
    console.error('Erro no upload de imagem de manifestação:', err);
    res.status(500).json({
      success: false,
      message: 'Erro no upload de imagem'
    });
  }
};

// @desc    Upload de símbolo pessoal
// @route   POST /api/media/symbol
// @access  Private
exports.uploadSymbol = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, envie um arquivo'
      });
    }
    
    // Gerar nome aleatório para o arquivo
    const objectName = `symbol-${req.user.id}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(req.file.originalname)}`;
    
    // Upload para o MinIO
    await minioClient.putObject(
      process.env.MINIO_BUCKET,
      `symbols/${objectName}`,
      req.file.buffer,
      req.file.size,
      req.file.mimetype
    );
    
    // Gerar URL para o arquivo
    const fileUrl = `/api/media/symbols/${objectName}`;
    
    res.status(200).json({
      success: true,
      data: {
        fileUrl
      }
    });
  } catch (err) {
    console.error('Erro no upload de símbolo:', err);
    res.status(500).json({
      success: false,
      message: 'Erro no upload de símbolo'
    });
  }
};

// @desc    Upload de arquivo de áudio para meditação
// @route   POST /api/media/meditation
// @access  Private/Admin
exports.uploadMeditationAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, envie um arquivo'
      });
    }
    
    // Verificar se é um arquivo de áudio
    if (!req.file.mimetype.startsWith('audio/')) {
      return res.status(400).json({
        success: false,
        message: 'O arquivo deve ser um áudio'
      });
    }
    
    // Gerar nome aleatório para o arquivo
    const objectName = `meditation-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(req.file.originalname)}`;
    
    // Upload para o MinIO
    await minioClient.putObject(
      process.env.MINIO_BUCKET,
      `meditations/${objectName}`,
      req.file.buffer,
      req.file.size,
      req.file.mimetype
    );
    
    // Gerar URL para o arquivo
    const fileUrl = `/api/media/meditations/${objectName}`;
    
    res.status(200).json({
      success: true,
      data: {
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    });
  } catch (err) {
    console.error('Erro no upload de áudio de meditação:', err);
    res.status(500).json({
      success: false,
      message: 'Erro no upload de áudio'
    });
  }
};

// @desc    Obter arquivo de mídia
// @route   GET /api/media/:type/:filename
// @access  Varia conforme o tipo
exports.getMedia = async (req, res) => {
  try {
    const { type, filename } = req.params;
    
    // Validar tipo
    const validTypes = ['avatars', 'manifestation', 'symbols', 'meditations'];
    if (!validTypes.includes(type)) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de mídia não encontrado'
      });
    }
    
    // Verificar se o arquivo existe
    try {
      await minioClient.statObject(process.env.MINIO_BUCKET, `${type}/${filename}`);
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo não encontrado'
      });
    }
    
    // Para meditações, verificar se o usuário está autenticado
    if (type === 'meditations' && (!req.user || req.user.status !== 'approved')) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado a acessar este recurso'
      });
    }
    
    // Obter informações sobre o objeto
    const stat = await minioClient.statObject(process.env.MINIO_BUCKET, `${type}/${filename}`);
    
    // Configurar headers para streaming
    res.setHeader('Content-Type', stat.metaData['content-type'] || 'application/octet-stream');
    res.setHeader('Content-Length', stat.size);
    
    // Stream do objeto para a resposta
    const stream = await minioClient.getObject(process.env.MINIO_BUCKET, `${type}/${filename}`);
    
    stream.on('error', (err) => {
      console.error('Erro ao streaming de arquivo:', err);
      if (!res.headersSent) {
        res.status(500).send('Erro ao obter arquivo');
      }
    });
    
    stream.pipe(res);
  } catch (err) {
    console.error('Erro ao obter mídia:', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter mídia'
    });
  }
};
