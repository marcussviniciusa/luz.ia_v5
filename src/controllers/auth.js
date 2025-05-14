const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Registrar um novo usuário
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    // Verificar se o usuário já existe
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        success: false,
        message: 'Email já cadastrado'
      });
    }

    // Criar usuário
    user = await User.create({
      name,
      email,
      password,
      status: 'pending' // Aguardando aprovação do administrador
    });

    // Resposta sem token, já que precisa de aprovação
    res.status(201).json({
      success: true,
      message: 'Cadastro realizado com sucesso! Aguarde a aprovação do administrador para acessar o sistema.'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// @desc    Login do usuário
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Verificar email e senha
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Verificar status da conta
    if (user.status !== 'approved') {
      return res.status(401).json({
        success: false,
        message: user.status === 'pending' 
          ? 'Sua conta está aguardando aprovação do administrador' 
          : 'Sua conta foi desativada'
      });
    }

    // Verificar se a senha corresponde
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Atualizar último login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    
    // Verificar se a solicitação veio do navegador (pode ser uma API ou cliente móvel)
    const isHtmlRequest = req.headers.accept && req.headers.accept.includes('text/html');
    
    // Gerar token JWT
    const token = user.getSignedJwtToken();
    
    // Configurar opções para o cookie
    const options = {
      expires: new Date(
        Date.now() + process.env.JWT_EXPIRE.match(/\d+/)[0] * 24 * 60 * 60 * 1000
      ),
      httpOnly: true
    };
    
    if (process.env.NODE_ENV === 'production') {
      options.secure = true;
    }
    
    // Se for uma solicitação do navegador, configurar o cookie e redirecionar
    if (isHtmlRequest) {
      res.cookie('token', token, options);
      return res.redirect('/dashboard');
    } else {
      // Para API, retornar JSON com o token
      return res.status(200).cookie('token', token, options).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          photo: user.photo,
          personalDescription: user.personalDescription
        }
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// @desc    Obter usuário atual
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// @desc    Atualizar detalhes do usuário
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res) => {
  const fieldsToUpdate = {
    name: req.body.name,
    personalDescription: req.body.personalDescription
  };

  try {
    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// @desc    Atualizar senha
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Verificar senha atual
    const isMatch = await user.matchPassword(req.body.currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

// @desc    Fazer logout / limpar cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  // Limpar o cookie de forma agressiva
  res.clearCookie('token');
  res.cookie('token', 'none', {
    expires: new Date(Date.now() - 1000),  // Expira imediatamente
    httpOnly: true,
    path: '/' // Garantir que seja removido em todos os caminhos
  });

  // Verificar se a solicitação veio de um navegador ou é uma chamada API
  const isHtmlRequest = req.headers.accept && req.headers.accept.includes('text/html');
  
  if (isHtmlRequest) {
    // Para efeitos de debug, adicionar uma mensagem de log
    console.log('Logout realizado com sucesso, redirecionando para home...');
    // Redirecionar para a página inicial
    return res.redirect('/');
  } else {
    // Se for uma chamada API, retornar JSON
    return res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso',
      data: {}
    });
  }
};

// Criar e enviar token e cookie
const sendTokenResponse = (user, statusCode, res) => {
  // Criar token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_EXPIRE.match(/\d+/)[0] * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo,
        personalDescription: user.personalDescription
      }
    });
};
