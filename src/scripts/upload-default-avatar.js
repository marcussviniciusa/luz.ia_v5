/**
 * Script para upload do avatar padrão para o MinIO
 * Este script resolve o problema de 404 nas imagens de avatar
 */

const fs = require('fs');
const path = require('path');
const { minioClient } = require('../config/minio');

async function uploadDefaultAvatar() {
  try {
    console.log('Iniciando upload do avatar padrão...');
    
    // Criar diretório para o avatar padrão se não existir
    const avatarDir = path.join(__dirname, '../public/media/avatars');
    if (!fs.existsSync(avatarDir)) {
      fs.mkdirSync(avatarDir, { recursive: true });
      console.log(`Diretório ${avatarDir} criado com sucesso.`);
    }
    
    // Caminho para o avatar SVG
    const avatarSvgPath = path.join(avatarDir, 'default-avatar.svg');
    
    // Criar o avatar SVG se não existir
    if (!fs.existsSync(avatarSvgPath)) {
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <circle cx="100" cy="70" r="50" fill="#CCCCCC"/>
  <path d="M100 120 Q 100 120 100 120 C 60 120 30 150 30 190 L170 190 C 170 150 140 120 100 120 Z" fill="#CCCCCC"/>
</svg>`;
      
      fs.writeFileSync(avatarSvgPath, svgContent);
      console.log(`Avatar SVG criado em ${avatarSvgPath}`);
    }
    
    // Também criar uma versão PNG para compatibilidade
    const defaultPngName = 'default-avatar.png';
    const avatarPngPath = path.join(avatarDir, defaultPngName);
    
    // Se não temos a versão PNG, usamos o SVG por enquanto
    const fileToUpload = avatarSvgPath;
    const mimeType = 'image/svg+xml';
    
    // Verificar se o bucket existe
    const bucketExists = await minioClient.bucketExists(process.env.MINIO_BUCKET);
    if (!bucketExists) {
      throw new Error(`Bucket ${process.env.MINIO_BUCKET} não existe.`);
    }
    
    // Ler o conteúdo do arquivo
    const fileContent = fs.readFileSync(fileToUpload);
    
    // Upload para o MinIO
    await minioClient.putObject(
      process.env.MINIO_BUCKET,
      'avatars/default-avatar.png', // Usar extensão PNG por compatibilidade
      fileContent,
      fileContent.length,
      mimeType
    );
    
    console.log(`Avatar padrão enviado para ${process.env.MINIO_BUCKET}/avatars/default-avatar.png`);
    console.log('Upload concluído com sucesso!');
    
  } catch (error) {
    console.error('Erro ao fazer upload do avatar padrão:', error);
  }
}

// Executar a função
uploadDefaultAvatar();
