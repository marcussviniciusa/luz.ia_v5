const mongoose = require('mongoose');

const DiaryEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  emotionalState: {
    type: String,
    required: [true, 'Por favor, informe seu estado emocional'],
    maxlength: [50, 'Estado emocional não pode ter mais de 50 caracteres']
  },
  dominantThoughts: {
    type: String,
    required: [true, 'Por favor, informe seus pensamentos predominantes'],
    maxlength: [500, 'Pensamentos predominantes não podem ter mais de 500 caracteres']
  },
  victories: {
    type: String,
    required: [true, 'Por favor, registre suas pequenas vitórias'],
    maxlength: [500, 'Suas vitórias não podem ter mais de 500 caracteres']
  },
  tomorrowGoals: {
    type: String,
    required: [true, 'Por favor, defina seus objetivos para o dia seguinte'],
    maxlength: [500, 'Objetivos para amanhã não podem ter mais de 500 caracteres']
  },
  additionalNotes: {
    type: String,
    maxlength: [1000, 'Notas adicionais não podem ter mais de 1000 caracteres']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índice para melhorar a performance nas consultas por usuário e data
DiaryEntrySchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('DiaryEntry', DiaryEntrySchema);
