/**
 * Configuração e gerenciamento do vector store para a LUZ IA
 */

const path = require('path');
const { loadVectorStore } = require('../scripts/ingest-documents');

// Caminho para o vector store
const VECTOR_STORE_PATH = path.join(__dirname, '../../data/vectorstore');

/**
 * Carrega o vector store existente para uso
 * @returns {Promise<Object>} O vector store
 */
async function getVectorStore() {
  try {
    // Tenta carregar o vector store existente
    return await loadVectorStore();
  } catch (error) {
    console.error('Erro ao carregar vector store:', error.message);
    console.log('Para criar o vector store, execute: node src/scripts/ingest-documents.js');
    
    // Retornar null se não conseguir carregar o vector store
    return null;
  }
}

module.exports = {
  getVectorStore,
  VECTOR_STORE_PATH
};
