const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protege rotas - verifica autenticação
exports.protect = async (req, res, next) => {
  let token;

  // Verificar várias fontes para o token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // 1. Extrair token do cabeçalho "Bearer token"
    token = req.headers.authorization.split(' ')[1];
    console.log('Token extraído do cabeçalho Authorization:', token ? 'Presente' : 'Ausente');
  } else if (req.cookies && req.cookies.token) {
    // 2. Extrair token dos cookies
    token = req.cookies.token;
    console.log('Token extraído do cookie:', token ? 'Presente' : 'Ausente');
  } else if (req.body && req.body.token) {
    // 3. Extrair do corpo da requisição (para requisições POST)
    token = req.body.token;
    console.log('Token extraído do corpo da requisição:', token ? 'Presente' : 'Ausente');
  } else if (req.query && req.query.token) {
    // 4. Extrair da query string (menos seguro, mas útil para testes)
    token = req.query.token;
    console.log('Token extraído da query string:', token ? 'Presente' : 'Ausente');
  }

  // Verifica se o token existe
  if (!token) {
    console.log('Nenhum token encontrado em qualquer fonte');
    
    // Se estiver acessando uma página, redirecionar para login
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.redirect('/login');
    }
    
    // Caso contrário, retornar erro JSON
    return res.status(401).json({
      success: false,
      message: 'Não autorizado para acessar esta rota'
    });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuário pelo ID e verificar status
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    if (user.status !== 'approved') {
      return res.status(401).json({
        success: false,
        message: 'Sua conta está aguardando aprovação ou foi desativada'
      });
    }

    // Atualiza último acesso
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Não autorizado para acessar esta rota'
    });
  }
};

// Concede acesso a funções específicas baseadas no papel
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Usuário com papel '${req.user.role}' não está autorizado a acessar esta rota`
      });
    }
    next();
  };
};
