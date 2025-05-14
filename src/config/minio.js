const Minio = require('minio');
require('dotenv').config();

// Função para criar o cliente MinIO para garantir que variáveis de ambiente estejam disponíveis
const createMinioClient = () => {
  if (!process.env.MINIO_ENDPOINT) {
    console.error('Variável de ambiente MINIO_ENDPOINT não definida');
    return null;
  }
  
  console.log(`Conectando ao MinIO: ${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`);
  
  return new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: Number(process.env.MINIO_PORT),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
  });
};

const minioClient = createMinioClient();

// Verifica/cria o bucket se não existir
const initializeMinio = async () => {
  // Se cliente MinIO não foi criado com sucesso
  if (!minioClient) {
    console.error('MinIO não pode ser inicializado: cliente não está disponível');
    console.error('Verifique as variáveis de ambiente MINIO_* no arquivo .env');
    return;
  }

  if (!process.env.MINIO_BUCKET) {
    console.error('Variável de ambiente MINIO_BUCKET não definida');
    return;
  }

  try {
    console.log(`Verificando se bucket '${process.env.MINIO_BUCKET}' existe...`);
    const bucketExists = await minioClient.bucketExists(process.env.MINIO_BUCKET);
    
    if (!bucketExists) {
      console.log(`Bucket '${process.env.MINIO_BUCKET}' não existe, criando...`);
      await minioClient.makeBucket(process.env.MINIO_BUCKET, 'us-east-1');
      console.log(`Bucket '${process.env.MINIO_BUCKET}' criado com sucesso`);
    } else {
      console.log(`Bucket '${process.env.MINIO_BUCKET}' já existe`);
    }
    console.log('Inicialização do MinIO concluída com sucesso');
  } catch (error) {
    console.error(`Erro ao inicializar MinIO: ${error.message}`);
    console.error(`Detalhes do erro: ${error.stack || 'Sem stack trace'}`);
  }
};

module.exports = { minioClient, initializeMinio };
