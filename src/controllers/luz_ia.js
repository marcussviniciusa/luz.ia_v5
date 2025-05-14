const { initLLM, createRagChain } = require('../config/langchain');
const { getVectorStore } = require('../config/vectorstore');
const LuzPrompt = require('../models/LuzPrompt');
const Conversation = require('../models/Conversation');
const { validationResult } = require('express-validator');

// @desc    Enviar mensagem para LUZ IA
// @route   POST /api/luz-ia/chat
// @access  Private
exports.chatWithLuzIA = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { message, conversationId } = req.body;

  try {
    // Inicializa o modelo
    const llm = initLLM();
    
    let conversation;
    
    // Se há um ID de conversa, busca a conversa existente
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversa não encontrada'
        });
      }
      
      // Verifica se o usuário é dono da conversa
      if (conversation.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Não autorizado a acessar esta conversa'
        });
      }
    } else {
      // Cria uma nova conversa
      conversation = await Conversation.create({
        user: req.user.id,
        title: message.substring(0, 30) + '...',
        messages: []
      });
    }
    
    // Adiciona a mensagem do usuário à conversa
    conversation.messages.push({
      role: 'user',
      content: message
    });
    
    // Gera contexto com base em mensagens anteriores (limitado às últimas 10)
    const recentMessages = conversation.messages.slice(-10);
    const conversationContext = recentMessages
      .map(msg => `${msg.role === 'user' ? 'Aluna' : 'LUZ IA'}: ${msg.content}`)
      .join('\n\n');
    
    let aiResponse;
    
    // Tenta usar RAG se o vector store estiver disponível
    try {
      const vectorStore = await getVectorStore();
      
      if (vectorStore) {
        console.log('Usando RAG para responder à pergunta');
        
        // Cria uma cadeia RAG
        const chain = await createRagChain(vectorStore);
        
        // Invoca a cadeia RAG com a pergunta
        const result = await chain.invoke({
          question: message
        });
        
        aiResponse = result.answer;
      } else {
        console.log('Vector store não disponível. Usando apenas o LLM.');
        
        // Fallback para o método antigo se o vector store não estiver disponível
        // Prepara o prompt para o LLM
        const promptContent = `
        Você é LUZ IA, assistente especializada do curso "Jornada Mente Merecedora".
        
        Sua função é auxiliar as alunas em sua jornada de autoconhecimento e transformação pessoal,
        respondendo questões com base no conteúdo do curso e oferecendo orientações alinhadas
        com a metodologia ensinada.
        
        Histórico da conversa:
        ${conversationContext}
        
        Pergunta atual da aluna:
        ${message}
        
        Por favor, responda de forma acolhedora, inspiradora e com base nos princípios do curso.
        Sempre encoraje a reflexão e práticas do curso. Se não tiver informações suficientes,
        sugira que a aluna consulte os materiais do curso ou entre em contato com a mentora Elis.
        `;
        
        // Envia a pergunta ao modelo LLM
        const response = await llm.invoke(promptContent);
        aiResponse = response.content;
      }
    } catch (ragError) {
      console.error('Erro ao usar RAG:', ragError);
      
      // Fallback para o método antigo se houver erro no RAG
      const promptContent = `
      Você é LUZ IA, assistente especializada do curso "Jornada Mente Merecedora".
      
      Sua função é auxiliar as alunas em sua jornada de autoconhecimento e transformação pessoal,
      respondendo questões com base no conteúdo do curso e oferecendo orientações alinhadas
      com a metodologia ensinada.
      
      Histórico da conversa:
      ${conversationContext}
      
      Pergunta atual da aluna:
      ${message}
      
      Por favor, responda de forma acolhedora, inspiradora e com base nos princípios do curso.
      Sempre encoraje a reflexão e práticas do curso. Se não tiver informações suficientes,
      sugira que a aluna consulte os materiais do curso ou entre em contato com a mentora Elis.
      `;
      
      // Envia a pergunta ao modelo LLM
      const response = await llm.invoke(promptContent);
      aiResponse = response.content;
    }
    
    // Adiciona a resposta da IA à conversa
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse
    });
    
    // Atualiza a data da última mensagem
    conversation.lastMessageAt = Date.now();
    
    // Salva a conversa
    await conversation.save();
    
    res.status(200).json({
      success: true,
      data: {
        conversationId: conversation._id,
        message: aiResponse
      }
    });
  } catch (err) {
    console.error('Erro ao processar mensagem:', err);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar sua mensagem'
    });
  }
};

// @desc    Obter prompts pré-definidos
// @route   GET /api/luz-ia/prompts
// @access  Private
exports.getPrompts = async (req, res) => {
  try {
    const category = req.query.category;
    
    let query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    const prompts = await LuzPrompt.find(query)
      .sort({ category: 1, title: 1 })
      .select('title category description');
    
    res.status(200).json({
      success: true,
      count: prompts.length,
      data: prompts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter prompts'
    });
  }
};

// @desc    Obter um prompt específico
// @route   GET /api/luz-ia/prompts/:id
// @access  Private
exports.getPrompt = async (req, res) => {
  try {
    const prompt = await LuzPrompt.findById(req.params.id);
    
    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: 'Prompt não encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: prompt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter prompt'
    });
  }
};

// @desc    Obter histórico de conversas do usuário
// @route   GET /api/luz-ia/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ user: req.user.id })
      .sort({ lastMessageAt: -1 })
      .select('title lastMessageAt');
    
    res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter conversas'
    });
  }
};

// @desc    Obter uma conversa específica
// @route   GET /api/luz-ia/conversations/:id
// @access  Private
exports.getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversa não encontrada'
      });
    }
    
    // Verifica se o usuário é dono da conversa
    if (conversation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a acessar esta conversa'
      });
    }
    
    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter conversa'
    });
  }
};

// @desc    Excluir uma conversa
// @route   DELETE /api/luz-ia/conversations/:id
// @access  Private
exports.deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversa não encontrada'
      });
    }
    
    // Verifica se o usuário é dono da conversa
    if (conversation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a excluir esta conversa'
      });
    }
    
    await conversation.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir conversa'
    });
  }
};
