const { ChatOpenAI } = require('@langchain/openai');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { PromptTemplate } = require('@langchain/core/prompts');
const { createRetrievalChain } = require('langchain/chains/retrieval');
const { createStuffDocumentsChain } = require('langchain/chains/combine_documents');

// Garantir que as variáveis de ambiente estejam disponíveis
require('dotenv').config();

// Inicializa o modelo de linguagem GPT-4o mini
const initLLM = () => {
  return new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
};

// Função para criar uma cadeia RAG básica
const createRagChain = async (vectorStore) => {
  const llm = initLLM();
  const outputParser = new StringOutputParser();

  const promptTemplate = PromptTemplate.fromTemplate(`
  Você é LUZ IA, assistente especializada do curso "Jornada Mente Merecedora".
  
  Sua função é auxiliar as alunas em sua jornada de autoconhecimento e transformação pessoal,
  respondendo questões com base no conteúdo do curso e oferecendo orientações alinhadas
  com a metodologia ensinada.
  
  Contexto do curso:
  {context}
  
  Pergunta da aluna:
  {question}
  
  Por favor, responda de forma acolhedora, inspiradora e com base no contexto fornecido.
  Sempre encoraje a reflexão e práticas do curso. Se não tiver informações suficientes,
  sugira que a aluna consulte os materiais do curso ou entre em contato com a mentora Elis.
  `);

  const documentChain = await createStuffDocumentsChain({
    llm,
    prompt: promptTemplate,
    outputParser,
  });

  const retriever = vectorStore.asRetriever();
  
  return createRetrievalChain({
    retriever,
    combineDocsChain: documentChain,
  });
};

module.exports = { initLLM, createRagChain };
