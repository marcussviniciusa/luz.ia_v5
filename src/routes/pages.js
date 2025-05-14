const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Importar modelos para dashboard
const User = mongoose.model('User');
const DiaryEntry = mongoose.model('DiaryEntry');
const ManifestationBoard = mongoose.model('ManifestationBoard');
const Conversation = mongoose.model('Conversation');

// Quotes inspiracionais para o dashboard
const inspirationalQuotes = [
  {
    text: "Você não é seu passado, você é o poder e a força de seu futuro.",
    author: "Elis Regina",
    reflectionPrompt: "Como posso deixar para trás as limitações do meu passado e me conectar com o meu verdadeiro potencial?"
  },
  {
    text: "Sua mente é um jardim. Suas intenções e pensamentos são as sementes. Você pode cultivar flores ou ervas daninhas.",
    author: "Elis Regina",
    reflectionPrompt: "Quais sementes estou plantando hoje em minha mente, e como posso cultivar pensamentos mais elevados?"
  },
  {
    text: "A vibração que você emite para o universo é a mesma que retorna para você.",
    author: "Elis Regina",
    reflectionPrompt: "Como posso elevar minha vibração hoje para atrair mais do que desejo em minha vida?"
  },
  {
    text: "Não é o que acontece com você que importa, mas como você escolhe responder a isso.",
    author: "Elis Regina",
    reflectionPrompt: "Em quais situações posso mudar minha resposta emocional para criar resultados diferentes?"
  },
  {
    text: "Acredite em sua capacidade de transformar cada desafio em uma nova oportunidade.",
    author: "Elis Regina",
    reflectionPrompt: "Qual desafio atual posso reinterpretar como uma oportunidade de crescimento?"
  }
];

// Página inicial (pública)
router.get('/', (req, res) => {
  res.render('pages/index', {
    title: 'Bem-vinda',
    user: req.user || null,
    messages: []
  });
});

// Página de login (pública)
router.get('/login', (req, res) => {
  // Redirecionar se já estiver logado
  if (req.user) {
    return res.redirect('/dashboard');
  }
  
  res.render('pages/login', {
    title: 'Login',
    user: null,
    messages: []
  });
});

// Página de registro (pública)
router.get('/register', (req, res) => {
  // Redirecionar se já estiver logado
  if (req.user) {
    return res.redirect('/dashboard');
  }
  
  res.render('pages/register', {
    title: 'Cadastro',
    user: null,
    messages: []
  });
});

// Dashboard (protegido)
router.post('/dashboard', async (req, res) => {
  try {
    // Verificar se o token foi enviado no corpo da requisição
    const token = req.body.token;
    
    if (token) {
      // Definir o cookie com o token
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dias
      });
      
      // Redirecionar para a rota GET
      return res.redirect('/dashboard');
    } else {
      return res.redirect('/login');
    }
  } catch (error) {
    console.error('Erro no processamento do token:', error);
    return res.redirect('/login');
  }
});

// Dashboard (protegido)
router.get('/dashboard', protect, async (req, res) => {
  try {
    // Obter contagens para estatísticas
    const diaryCount = await DiaryEntry.countDocuments({ user: req.user.id });
    const manifestationCount = await ManifestationBoard.countDocuments({ user: req.user.id });
    const conversationCount = await Conversation.countDocuments({ user: req.user.id });
    
    // Calcular dias desde o registro
    const registrationDate = new Date(req.user.createdAt);
    const currentDate = new Date();
    const daysRegistered = Math.max(1, Math.floor((currentDate - registrationDate) / (1000 * 60 * 60 * 24)));
    
    // Obter atividades recentes (diários, manifestações, conversas)
    const recentDiaries = await DiaryEntry.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(2);
      
    const recentManifestations = await ManifestationBoard.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(2);
      
    const recentConversations = await Conversation.find({ user: req.user.id })
      .sort({ lastMessageAt: -1 })
      .limit(2)
      .select('title lastMessageAt');
    
    // Combinar atividades recentes e ordenar por data
    const recentActivities = [
      ...recentDiaries.map(diary => ({
        title: 'Nova Entrada no Diário',
        description: `Estado emocional: ${diary.emotionalState}`,
        date: diary.createdAt,
        icon: 'fas fa-book',
        link: {
          url: `/tools/diary/${diary._id}`,
          text: 'Ver entrada'
        }
      })),
      ...recentManifestations.map(board => ({
        title: 'Novo Quadro de Manifestação',
        description: board.title,
        date: board.createdAt,
        icon: 'fas fa-star',
        link: {
          url: `/tools/manifestation/${board._id}`,
          text: 'Ver quadro'
        }
      })),
      ...recentConversations.map(conv => ({
        title: 'Conversa com LUZ IA',
        description: conv.title,
        date: conv.lastMessageAt,
        icon: 'fas fa-robot',
        link: {
          url: `/luz-ia/conversations/${conv._id}`,
          text: 'Continuar conversa'
        }
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    
    // Escolher uma citação aleatória
    const randomIndex = Math.floor(Math.random() * inspirationalQuotes.length);
    const inspirationalQuote = inspirationalQuotes[randomIndex];
    
    res.render('pages/dashboard', {
      title: 'Dashboard',
      user: req.user,
      stats: {
        diaryCount,
        manifestationCount,
        conversationCount,
        daysRegistered
      },
      recentActivities,
      inspirationalQuote,
      formatDate: (date) => {
        // Função para formatar data (server-side)
        return new Date(date).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      },
      messages: []
    });
  } catch (err) {
    console.error('Erro no dashboard:', err);
    res.status(500).render('pages/error', {
      title: 'Erro',
      user: req.user,
      error: 'Erro ao carregar o dashboard. Por favor, tente novamente mais tarde.',
      messages: []
    });
  }
});

// Perfil do usuário (protegido)
router.get('/profile', protect, (req, res) => {
  res.render('pages/profile', {
    title: 'Meu Perfil',
    user: req.user,
    active: 'profile',
    messages: []
  });
});

// Configurações do perfil (protegido)
router.get('/profile/settings', protect, (req, res) => {
  res.render('pages/profile-settings', {
    title: 'Configurações',
    user: req.user,
    active: 'profile',
    messages: []
  });
});

// Página de LUZ IA (protegido)
router.get('/luz_ia', protect, async (req, res) => {
  try {
    // Obter prompts disponíveis
    const LuzPrompt = mongoose.model('LuzPrompt');
    const prompts = await LuzPrompt.find({ isActive: true })
      .sort({ category: 1, title: 1 })
      .select('title category description');
    
    // Agrupar prompts por categoria
    const promptsByCategory = {};
    prompts.forEach(prompt => {
      if (!promptsByCategory[prompt.category]) {
        promptsByCategory[prompt.category] = [];
      }
      promptsByCategory[prompt.category].push(prompt);
    });
    
    // Obter conversas recentes
    const conversations = await Conversation.find({ user: req.user.id })
      .sort({ lastMessageAt: -1 })
      .limit(10)
      .select('title lastMessageAt');
    
    res.render('pages/luz_ia', {
      title: 'LUZ IA',
      user: req.user,
      active: 'luz_ia',
      promptsByCategory,
      conversations,
      selectedPrompt: req.query.prompt || '',
      conversationId: req.query.conversation || '',
      messages: []
    });
  } catch (err) {
    console.error('Erro na página LUZ IA:', err);
    res.status(500).render('pages/error', {
      title: 'Erro',
      user: req.user,
      error: 'Erro ao carregar a página LUZ IA. Por favor, tente novamente mais tarde.',
      messages: []
    });
  }
});

// Página de conversa específica com LUZ IA (protegido)
router.get('/luz_ia/conversations/:id', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    
    if (!conversation) {
      return res.status(404).render('pages/error', {
        title: 'Erro',
        user: req.user,
        error: 'Conversa não encontrada.',
        messages: []
      });
    }
    
    if (conversation.user.toString() !== req.user.id) {
      return res.status(403).render('pages/error', {
        title: 'Erro',
        user: req.user,
        error: 'Você não tem permissão para acessar esta conversa.',
        messages: []
      });
    }
    
    // Obter prompts disponíveis (mesmo código da rota /luz-ia)
    const LuzPrompt = mongoose.model('LuzPrompt');
    const prompts = await LuzPrompt.find({ isActive: true })
      .sort({ category: 1, title: 1 })
      .select('title category description');
    
    const promptsByCategory = {};
    prompts.forEach(prompt => {
      if (!promptsByCategory[prompt.category]) {
        promptsByCategory[prompt.category] = [];
      }
      promptsByCategory[prompt.category].push(prompt);
    });
    
    // Obter conversas recentes
    const conversations = await Conversation.find({ user: req.user.id })
      .sort({ lastMessageAt: -1 })
      .limit(10)
      .select('title lastMessageAt');
    
    res.render('pages/luz_ia', {
      title: 'LUZ IA',
      user: req.user,
      active: 'luz_ia',
      promptsByCategory,
      conversations,
      conversation,
      conversationId: conversation._id,
      messages: []
    });
  } catch (err) {
    console.error('Erro na página de conversa:', err);
    res.status(500).render('pages/error', {
      title: 'Erro',
      user: req.user,
      error: 'Erro ao carregar a conversa. Por favor, tente novamente mais tarde.',
      messages: []
    });
  }
});

// Página de Diário Quântico (protegido)
router.get('/tools/diary', protect, async (req, res) => {
  try {
    // Obter estatísticas do diário para exibir na página
    const stats = await DiaryEntry.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: '$emotionalState', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Verificar se há entrada para hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayEntry = await DiaryEntry.findOne({
      user: req.user.id,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    // Contar total de entradas e streak atual
    const totalEntries = await DiaryEntry.countDocuments({ user: req.user.id });
    
    res.render('pages/diary', {
      title: 'Diário Quântico',
      user: req.user,
      active: 'diary',
      todayEntry,
      stats: {
        totalEntries,
        emotionalStates: stats
      },
      messages: []
    });
  } catch (err) {
    console.error('Erro na página de diário:', err);
    res.status(500).render('pages/error', {
      title: 'Erro',
      user: req.user,
      error: 'Erro ao carregar o diário. Por favor, tente novamente mais tarde.',
      messages: []
    });
  }
});

// Página de Ferramentas de Manifestação (protegido)
router.get('/tools/manifestation', protect, async (req, res) => {
  try {
    const Goal = mongoose.model('Goal');
    
    // Obter metas do usuário agrupadas por categoria
    const categories = [
      'financeiro', 'carreira', 'relacionamentos', 'saude', 'espiritualidade', 'desenvolvimento-pessoal', 'outro'
    ];
    
    // Buscar metas fixadas (pinned)
    const pinnedGoals = await Goal.find({ user: req.user.id, pinned: true })
      .sort({ updatedAt: -1 })
      .limit(5);
      
    // Buscar metas recentes não fixadas
    const recentGoals = await Goal.find({ user: req.user.id, pinned: false })
      .sort({ updatedAt: -1 })
      .limit(5);
      
    // Estatísticas básicas
    const stats = {
      total: await Goal.countDocuments({ user: req.user.id }),
      completed: await Goal.countDocuments({ user: req.user.id, status: 'concluida' }),
      inProgress: await Goal.countDocuments({ user: req.user.id, status: 'em-progresso' }),
      planned: await Goal.countDocuments({ user: req.user.id, status: 'planejada' })
    };

    // Calcular progresso médio
    const progressStats = await Goal.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: null, avgProgress: { $avg: '$progress' } } }
    ]);
    
    stats.avgProgress = progressStats.length > 0 ? Math.round(progressStats[0].avgProgress) : 0;
    
    // Buscar distribuição por categoria
    const categoryCounts = await Goal.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Renderizar a página
    res.render('pages/manifestation', {
      title: 'Ferramentas de Manifestação',
      user: req.user,
      active: 'manifestation',
      pinnedGoals,
      recentGoals,
      stats,
      categoryCounts,
      categories,
      messages: []
    });
  } catch (err) {
    console.error('Erro na página de manifestação:', err);
    res.status(500).render('pages/error', {
      title: 'Erro',
      user: req.user,
      error: 'Erro ao carregar as ferramentas de manifestação. Por favor, tente novamente mais tarde.',
      messages: []
    });
  }
});

// Página de edição de meta
router.get('/tools/manifestation/edit/:id', protect, async (req, res) => {
  try {
    const Goal = mongoose.model('Goal');
    
    // Buscar a meta a ser editada
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).render('pages/error', {
        title: 'Erro',
        user: req.user,
        error: 'Meta não encontrada.',
        messages: []
      });
    }
    
    // Verificar se o usuário é dono da meta
    if (goal.user.toString() !== req.user.id) {
      return res.status(403).render('pages/error', {
        title: 'Erro',
        user: req.user,
        error: 'Você não tem permissão para editar esta meta.',
        messages: []
      });
    }
    
    // Renderizar a página de edição
    res.render('pages/edit-manifestation', {
      title: 'Editar Meta',
      user: req.user,
      active: 'manifestation',
      goal,
      categories: [
        'financeiro', 'carreira', 'relacionamentos', 'saude', 'espiritualidade', 'desenvolvimento-pessoal', 'outro'
      ],
      statuses: [
        'planejada', 'em-progresso', 'concluida', 'pausada'
      ],
      messages: []
    });
  } catch (err) {
    console.error('Erro na página de edição de meta:', err);
    res.status(500).render('pages/error', {
      title: 'Erro',
      user: req.user,
      error: 'Erro ao carregar a página de edição de meta. Por favor, tente novamente mais tarde.',
      messages: []
    });
  }
});

// Rota para página 404
router.get('*', (req, res) => {
  res.status(404).render('pages/404', {
    title: 'Página não encontrada',
    user: req.user || null,
    messages: []
  });
});

module.exports = router;
