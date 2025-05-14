const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const { initializeMinio } = require('./config/minio');
const mongoose = require('mongoose');

// Carrega variáveis de ambiente antes de qualquer outra coisa
dotenv.config();

// Importa o middleware auth depois de carregar as variáveis de ambiente
const { protect } = require('./middleware/auth');

// Conecta ao banco de dados
connectDB();

// Inicializa MinIO
initializeMinio();

// Inicializa Express
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(cookieParser());
app.use(helmet({ contentSecurityPolicy: false }));

// Logging em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configuração de views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuração do express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Middleware para verificar usuário a partir do cookie JWT
app.use(async (req, res, next) => {
  if (req.cookies.token) {
    try {
      // Verificar token
      const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);

      // Buscar usuário pelo ID
      const user = await mongoose.model('User').findById(decoded.id);
      
      if (user && user.status === 'approved') {
        req.user = user;
      }
    } catch (err) {
      // Token inválido, continuar sem usuário
    }
  }
  next();
});

// Middleware para layout EJS
app.use((req, res, next) => {
  // Definir variáveis padrão para todas as views
  res.locals.user = req.user || null;
  res.locals.isAuthenticated = req.user ? true : false;
  res.locals.active = '';
  res.locals.messages = [];
  next();
});

// Rotas de API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/luz_ia', require('./routes/luz_ia'));
app.use('/api/tools', require('./routes/tools'));
app.use('/api/media', require('./routes/media'));
app.use('/api/goals', require('./routes/goals'));

// Rotas de páginas frontend
app.use('/', require('./routes/pages'));

// Porta
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Servidor rodando em ${process.env.NODE_ENV} na porta ${PORT}`);
});

// Manipulação de erros não tratados
process.on('unhandledRejection', (err) => {
  console.log(`Erro: ${err.message}`);
  server.close(() => process.exit(1));
});
