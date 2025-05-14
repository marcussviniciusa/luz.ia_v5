document.addEventListener('DOMContentLoaded', function() {
  const logoutLink = document.getElementById('logout-link');
  
  if (logoutLink) {
    logoutLink.addEventListener('click', async function(e) {
      e.preventDefault();
      
      try {
        // Mostrar um pequeno feedback visual
        this.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Saindo...';
        
        // Limpar todos os dados de autenticação do cliente
        localStorage.removeItem('token');
        sessionStorage.removeItem('loginAttempts');
        
        // Limpar cookies manualmente
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = 'token=; path=/dashboard; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        
        // Chamar a API de logout para limpar cookies no servidor
        await fetch('/api/auth/logout', {
          method: 'GET',
          headers: {
            'Accept': 'text/html'
          }
        });
        
        console.log('Logout realizado com sucesso');
        
        // Usar location.replace em vez de location.href para evitar que o navegador mantenha a página na história
        window.location.replace('/');
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
        
        // Limpar dados mesmo em caso de erro
        localStorage.removeItem('token');
        sessionStorage.removeItem('loginAttempts');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        
        // Em caso de erro, forçar redirecionamento para a página inicial
        window.location.replace('/');
      }
    });
  }
});
