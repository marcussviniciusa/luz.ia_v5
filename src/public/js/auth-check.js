// Este script verifica se o usuário está autenticado quando acessa a página
document.addEventListener('DOMContentLoaded', function() {
  // IMPORTANTE: Vamos interromper completamente o redirecionamento automático
  // que está causando o loop infinito
  
  // Verificar se estamos na página de login e se há um token
  if (window.location.pathname === '/login') {
    // Se estamos na página de login, não vamos fazer nada automático
    // O login será processado normalmente pelo formulário
    console.log('Na página de login, não aplicando redirecionamento automático');
    return;
  }
  
  // Obter o token do localStorage (apenas para uso em requisições, não para redirecionamento)
  const token = localStorage.getItem('token');
  
  // Se temos um token válido, configurar interceptador de requisições
  if (token) {
    console.log('Token encontrado. Configurando interceptador de requisições...');
    
    // Interceptador para adicionar o token a todas as requisições fetch
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
      options = options || {};
      options.headers = options.headers || {};
      
      // Adicionar token às requisições que não são de autenticação
      if (!url.includes('/api/auth/login') && !url.includes('/api/auth/register')) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }
      
      return originalFetch(url, options);
    };
    
    // Também modificar XMLHttpRequest para adicionar o token
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
      this.addEventListener('readystatechange', function() {
        if (this.readyState === 1) {
          if (!url.includes('/api/auth/login') && !url.includes('/api/auth/register')) {
            this.setRequestHeader('Authorization', `Bearer ${token}`);
          }
        }
      });
      originalOpen.apply(this, arguments);
    };
  }
  
  // Verificar se estamos em uma página protegida sem estar autenticado
  // Isso só irá funcionar de forma client-side, sem redirecionar
  // O servidor já lida com o redirecionamento se necessário
  if (!token && window.location.pathname !== '/' && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
    console.log('Página protegida sem autenticação detectada');
  }
  
  console.log('Verificação de autenticação concluída.');
});
