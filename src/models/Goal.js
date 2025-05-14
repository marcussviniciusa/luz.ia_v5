const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Por favor, adicione um título para sua meta'],
    trim: true,
    maxlength: [100, 'Título não pode ter mais de 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
  },
  category: {
    type: String,
    required: [true, 'Por favor, selecione uma categoria'],
    enum: [
      'financeiro', 
      'carreira', 
      'relacionamentos', 
      'saude', 
      'espiritualidade', 
      'desenvolvimento-pessoal',
      'outro'
    ]
  },
  status: {
    type: String,
    enum: ['planejada', 'em-progresso', 'concluida', 'pausada'],
    default: 'planejada'
  },
  image: {
    type: String, // URL da imagem
  },
  deadline: {
    type: Date
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  visualizationNotes: {
    type: String,
    maxlength: [1000, 'Notas de visualização não podem ter mais de 1000 caracteres']
  },
  affirmations: [{
    text: {
      type: String,
      trim: true,
      maxlength: [200, 'Afirmação não pode ter mais de 200 caracteres']
    },
    active: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  milestones: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date
    },
    dueDate: {
      type: Date
    }
  }],
  pinned: {
    type: Boolean,
    default: false
  },
  reminderFrequency: {
    type: String,
    enum: ['nenhum', 'diario', 'semanal', 'mensal'],
    default: 'nenhum'
  },
  nextReminderDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Middleware para garantir que sempre que uma meta for atualizada, o campo updatedAt seja atualizado
GoalSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Método para calcular progresso baseado em marcos
GoalSchema.methods.calculateProgress = function() {
  if (!this.milestones || this.milestones.length === 0) {
    return this.progress;
  }
  
  const totalMilestones = this.milestones.length;
  const completedMilestones = this.milestones.filter(m => m.completed).length;
  
  return Math.round((completedMilestones / totalMilestones) * 100);
};

// Criar índices para melhorar a performance de consultas
GoalSchema.index({ user: 1, category: 1 });
GoalSchema.index({ user: 1, status: 1 });
GoalSchema.index({ user: 1, pinned: -1, createdAt: -1 });

module.exports = mongoose.model('Goal', GoalSchema);
