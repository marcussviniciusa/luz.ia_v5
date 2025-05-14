const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Carrega variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Modelo de usuário
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório']
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    match: [
      /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
      'Por favor, informe um email válido'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Telefone é obrigatório']
  },
  password: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'disabled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  }
});

// Criptografar senha usando bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

// Função para criar o primeiro usuário administrador
const createAdminUser = async () => {
  try {
    // Conecta ao MongoDB
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Conectado ao MongoDB!');

    // Verificar se já existe algum admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('Já existe um usuário administrador:', existingAdmin.email);
      process.exit(0);
    }

    // Configuração do admin
    const adminData = {
      name: 'Administrador',
      email: 'admin@mentemerecedora.com',
      phone: '11999999999',
      password: 'Admin@123',
      role: 'admin',
      status: 'approved'
    };

    // Criar o usuário admin
    const admin = await User.create(adminData);
    
    console.log('Usuário administrador criado com sucesso:');
    console.log('Email:', admin.email);
    console.log('Senha:', 'Admin@123');
    console.log('Role:', admin.role);
    console.log('Status:', admin.status);
    console.log('\nFaça login utilizando estas credenciais.');

  } catch (err) {
    console.error('Erro ao criar usuário administrador:', err.message);
  } finally {
    // Encerra a conexão com o MongoDB
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Executa a função
createAdminUser();
