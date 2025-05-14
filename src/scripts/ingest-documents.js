/**
 * Script para ingestão de documentos para a base de conhecimento da LUZ IA
 * 
 * Este script carrega documentos de texto/markdown, divide-os em pequenos pedaços,
 * gera embeddings e armazena-os em um vector store para uso pelo sistema RAG.
 */

const fs = require('fs');
const path = require('path');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { Document } = require('@langchain/core/documents');
const { HNSWLib } = require('@langchain/community/vectorstores/hnswlib');

// Carregando variáveis de ambiente
require('dotenv').config();

// Diretórios e caminhos importantes
const DOCS_DIR = path.join(__dirname, '../../documents');
const VECTOR_STORE_PATH = path.join(__dirname, '../../data/vectorstore');

// Verificando se o diretório de documentos existe, caso contrário, cria-o
if (!fs.existsSync(DOCS_DIR)) {
  console.log(`Criando diretório de documentos em ${DOCS_DIR}`);
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

// Verificando se o diretório para o vector store existe, caso contrário, cria-o
if (!fs.existsSync(path.dirname(VECTOR_STORE_PATH))) {
  console.log(`Criando diretório para o vector store em ${path.dirname(VECTOR_STORE_PATH)}`);
  fs.mkdirSync(path.dirname(VECTOR_STORE_PATH), { recursive: true });
}

/**
 * Carrega todos os documentos de um diretório
 * @returns {Promise<Document[]>} Array de documentos
 */
async function loadDocuments() {
  // Verificar se o diretório existe
  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`Diretório ${DOCS_DIR} não encontrado`);
    return [];
  }

  const files = fs.readdirSync(DOCS_DIR);
  const documents = [];

  for (const file of files) {
    const filePath = path.join(DOCS_DIR, file);
    const fileStat = fs.statSync(filePath);

    // Pular diretórios
    if (fileStat.isDirectory()) continue;

    // Processar apenas arquivos de texto/markdown
    if (file.endsWith('.txt') || file.endsWith('.md')) {
      console.log(`Carregando ${file}...`);
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        documents.push(
          new Document({
            pageContent: content,
            metadata: {
              source: file,
              created: fileStat.birthtime,
              modified: fileStat.mtime,
              size: fileStat.size
            }
          })
        );
      } catch (error) {
        console.error(`Erro ao carregar ${file}: ${error.message}`);
      }
    }
  }

  console.log(`Carregados ${documents.length} documentos.`);
  return documents;
}

/**
 * Divide os documentos em fragmentos menores
 * @param {Document[]} documents Array de documentos
 * @returns {Promise<Document[]>} Array de fragmentos de documentos
 */
async function splitDocuments(documents) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const splits = await splitter.splitDocuments(documents);
  console.log(`Documentos divididos em ${splits.length} fragmentos.`);
  return splits;
}

/**
 * Cria ou atualiza o vector store com os documentos processados
 * @param {Document[]} splits Fragmentos de documentos
 * @returns {Promise<HNSWLib>} Instância do vector store
 */
async function createVectorStore(splits) {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  let vectorStore;

  // Verificar se já existe um vector store completo (não apenas o diretório)
  const vectorStoreFilesExist = fs.existsSync(path.join(VECTOR_STORE_PATH, 'hnswlib.index')) && 
                               fs.existsSync(path.join(VECTOR_STORE_PATH, 'docstore.json'));

  if (vectorStoreFilesExist) {
    try {
      console.log(`Carregando vector store existente de ${VECTOR_STORE_PATH}`);
      vectorStore = await HNSWLib.load(VECTOR_STORE_PATH, embeddings);
      
      // Adicionar novos documentos
      console.log('Adicionando novos documentos ao vector store existente...');
      await vectorStore.addDocuments(splits);
    } catch (error) {
      console.log(`Erro ao carregar vector store existente: ${error.message}`);
      console.log('Criando novo vector store...');
      vectorStore = await HNSWLib.fromDocuments(splits, embeddings);
    }
  } else {
    console.log('Criando novo vector store...');
    vectorStore = await HNSWLib.fromDocuments(splits, embeddings);
  }

  // Salvar vector store
  await vectorStore.save(VECTOR_STORE_PATH);
  console.log(`Vector store salvo em ${VECTOR_STORE_PATH}`);

  return vectorStore;
}

/**
 * Função principal para execução do processo de ingestão
 */
async function ingestDocuments() {
  try {
    console.log('Iniciando ingestão de documentos...');

    // 1. Carregar documentos
    const documents = await loadDocuments();
    if (documents.length === 0) {
      console.log('Nenhum documento encontrado para ingestão. Adicione documentos ao diretório documents/');
      return;
    }

    // 2. Dividir documentos em fragmentos
    const splits = await splitDocuments(documents);

    // 3. Criar ou atualizar vector store
    const vectorStore = await createVectorStore(splits);

    console.log('Ingestão de documentos concluída com sucesso!');
    return vectorStore;
  } catch (error) {
    console.error('Erro durante a ingestão de documentos:', error);
    throw error;
  }
}

/**
 * Função para carregar o vector store existente
 * @returns {Promise<HNSWLib>} Instância do vector store
 */
async function loadVectorStore() {
  if (!fs.existsSync(VECTOR_STORE_PATH)) {
    throw new Error(`Vector store não encontrado em ${VECTOR_STORE_PATH}`);
  }

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  return await HNSWLib.load(VECTOR_STORE_PATH, embeddings);
}

// Executar script se chamado diretamente
if (require.main === module) {
  ingestDocuments()
    .then(() => {
      console.log('Script de ingestão executado com sucesso!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Falha na execução do script de ingestão:', error);
      process.exit(1);
    });
}

module.exports = {
  ingestDocuments,
  loadVectorStore,
  VECTOR_STORE_PATH,
};
