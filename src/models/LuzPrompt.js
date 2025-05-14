const mongoose = require('mongoose');

const LuzPromptSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Por favor, adicione um título'],
    trim: true,
    maxlength: [100, 'Título não pode ter mais de 100 caracteres']
  },
  category: {
    type: String,
    required: [true, 'Por favor, adicione uma categoria'],
    enum: [
      'Autoimagem',
      'Vibração Financeira',
      'Meditação Alpha',
      'Protocolo Chave Mestra',
      'Padrões Emocionais',
      'Crenças Limitantes',
      'Escala de Consciência',
      'Outro'
    ]
  },
  prompt: {
    type: String,
    required: [true, 'Por favor, adicione o conteúdo do prompt'],
    maxlength: [2000, 'Prompt não pode ter mais de 2000 caracteres']
  },
  description: {
    type: String,
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
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
LuzPromptSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('LuzPrompt', LuzPromptSchema);
