# Portal Mente Merecedora

Uma plataforma web interativa que potencializa a experiência de transformação pessoal das alunas do curso "Jornada Mente Merecedora" através de ferramentas de autoconhecimento, práticas guiadas e acompanhamento de evolução.

## 🎯 Objetivo

Desenvolver uma plataforma web que ofereça:
- Assistente de IA integrado (LUZ IA) baseado no GPT-4o mini
- Sistema de Diário Quântico para registros diários
- Ferramentas de Manifestação (quadros de visualização, checklists)
- Biblioteca de meditações e práticas guiadas
- Painel administrativo para gerenciamento de usuárias

## 💻 Tecnologias Utilizadas

- **Backend**: Node.js, Express.js, MongoDB (Mongoose)
- **Frontend**: EJS, Bootstrap 5, FontAwesome, JavaScript
- **Armazenamento**: MinIO para objetos (imagens, áudios)
- **IA**: LangChain + GPT-4o mini para o sistema conversacional (LUZ IA)
- **Autenticação**: JWT com sistema de aprovação administrativa

## 🚀 Instalação e Execução

### Pré-requisitos

- Node.js (v14+)
- MongoDB
- MinIO (para armazenamento de objetos)
- Conta da OpenAI (para a API GPT-4o mini)

### Configuração

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/portal-mente-merecedora.git
cd portal-mente-merecedora
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/portal-mente-merecedora
JWT_SECRET=sua_chave_secreta_para_tokens_jwt
JWT_EXPIRE=30d
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=portal-mente-merecedora
OPENAI_API_KEY=sua_chave_api_openai
```

4. Inicialize o banco de dados:
```bash
mongod --dbpath=/caminho/para/seu/mongodb/data
```

5. Inicialize o MinIO (opcional para desenvolvimento):
```bash
# Instalar MinIO usando Docker
docker run -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"
```

### Execução

Para desenvolvimento:
```bash
npm run dev
```

Para produção:
```bash
npm start
```

O servidor estará disponível em `http://localhost:5000`

## 📂 Estrutura do Projeto

```
portal-mente-merecedora/
├── src/                # Código fonte do projeto
│   ├── config/         # Configurações (banco de dados, MinIO, LangChain)
│   ├── controllers/    # Controladores das rotas
│   ├── middleware/     # Middlewares (autenticação, validação)
│   ├── models/         # Modelos do MongoDB
│   ├── public/         # Arquivos estáticos (CSS, JS, imagens)
│   ├── routes/         # Definição de rotas
│   ├── services/       # Serviços (ex: integração com LangChain)
│   ├── utils/          # Utilitários
│   ├── views/          # Templates EJS
│   └── server.js       # Arquivo principal do servidor
├── .env                # Variáveis de ambiente
├── package.json        # Dependências e scripts
└── README.md           # Documentação
```

## 🔒 Sistema de Autenticação

O portal utiliza um sistema de autenticação com níveis:

1. Usuário se cadastra na plataforma
2. Administrador aprova o cadastro
3. Após aprovação, usuário pode fazer login e acessar as funcionalidades

## 🤖 LUZ IA - Assistente de Desenvolvimento Pessoal

LUZ IA é um assistente conversacional baseado no GPT-4o mini, treinado com o conteúdo do curso "Jornada Mente Merecedora". Ele oferece:

- Respostas contextualizadas sobre o conteúdo do curso
- Prompts pré-definidos para reflexão e desenvolvimento pessoal
- Suporte para perguntas sobre a metodologia e ferramentas

## 📋 Funcionalidades Principais

### Para Usuários
- Dashboard personalizado
- LUZ IA (assistente conversacional)
- Diário Quântico (registros diários de estado emocional, pensamentos, vitórias)
- Ferramentas de Manifestação (quadros, visualizações, símbolos pessoais)
- Biblioteca de práticas guiadas e meditações
- Análise pessoal e visualização de progresso

### Para Administradores
- Gestão de usuárias (aprovação, suspensão)
- Estatísticas de uso da plataforma
- Gerenciamento de conteúdo
- Upload de material para treinamento da IA

## 🛠️ Desenvolvimento

Para contribuir com o desenvolvimento:

1. Crie um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das alterações (`git commit -m 'Adiciona nova funcionalidade'`)
4. Faça push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é licenciado sob a licença ISC.
