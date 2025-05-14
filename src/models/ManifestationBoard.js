const mongoose = require('mongoose');

const ManifestationItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Por favor, adicione um título'],
    trim: true,
    maxlength: [100, 'Título não pode ter mais de 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'Por favor, adicione uma descrição'],
    maxlength: [1000, 'Descrição não pode ter mais de 1000 caracteres']
  },
  imageUrl: {
    type: String
  },
  emotions: {
    type: String,
    maxlength: [500, 'Emoções não podem ter mais de 500 caracteres']
  },
  steps: {
    type: [String],
    default: []
  },
  targetDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'achieved'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ManifestationBoardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Por favor, adicione um título'],
    trim: true,
    maxlength: [100, 'Título não pode ter mais de 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'Por favor, adicione uma descrição'],
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
  },
  personalSymbolUrl: {
    type: String
  },
  items: [ManifestationItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware para atualizar a data de modificação
ManifestationBoardSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Índice para melhorar a performance nas consultas por usuário
ManifestationBoardSchema.index({ user: 1 });

module.exports = mongoose.model('ManifestationBoard', ManifestationBoardSchema);
