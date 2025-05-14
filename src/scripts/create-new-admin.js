const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Carrega variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Conecta ao MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB conectado');
  createAdmin();
}).catch(err => {
  console.error('Erro ao conectar ao MongoDB:', err);
  process.exit(1);
});

// Função para criar um novo administrador
async function createAdmin() {
  try {
    // Define o esquema do usuário manualmente
    const UserSchema = new mongoose.Schema({
      name: String,
      email: String,
      phone: String,
      password: String,
      role: String,
      status: String,
      createdAt: {
        type: Date,
        default: Date.now
      },
      lastLogin: Date
    });

    // Adiciona método para gerar token JWT
    UserSchema.methods.getSignedJwtToken = function() {
      return 'token-simulado';
    };

    // Não adiciona o hook de pre-save para não criptografar a senha automaticamente
    // Vamos fazer isso manualmente
    
    // Cria o modelo
    const User = mongoose.model('User', UserSchema, 'users');
    
    // Senha em texto puro para mostrar ao usuário
    const plainPassword = 'Admin@123456';
    
    // Gera salt e hash da senha manualmente
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    // Configura o usuário administrador
    const newAdmin = {
      name: 'Administrador Principal',
      email: 'admin@mentemerecedora.com',
      phone: '11999999999',
      password: hashedPassword,
      role: 'admin',
      status: 'approved',
      createdAt: new Date(),
      lastLogin: null
    };
    
    // Remove qualquer administrador existente com o mesmo email
    await User.deleteOne({ email: newAdmin.email });
    console.log(`Usuário existente com email ${newAdmin.email} removido (se existia).`);
    
    // Cria o novo administrador
    const admin = await User.create(newAdmin);
    
    console.log('\n======= ADMINISTRADOR CRIADO COM SUCESSO =======');
    console.log(`Nome: ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Senha: ${plainPassword}`);
    console.log(`Status: ${admin.status}`);
    console.log(`Função: ${admin.role}`);
    console.log('=================================================\n');
    console.log('Use estas credenciais para fazer login no sistema.');
    
    // Desconecta do MongoDB
    mongoose.disconnect();
  } catch (error) {
    console.error('Erro ao criar administrador:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}
