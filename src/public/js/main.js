document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.getElementById('login-button');
    
    if (loginButton) {
        loginButton.addEventListener('click', async function(e) {
            
            // Desativar o botão durante o processamento
            const originalButtonText = this.innerHTML;
            this.disabled = true;
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processando...';
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Erro ao realizar login');
                }
                
                // Armazenar o token no localStorage
                if (data.token) {
                    localStorage.setItem('token', data.token);
                
                    console.log('Login bem-sucedido! Aguardando redirecionamento do servidor...');
                    
                    // Desabilitar o botão para evitar cliques múltiplos
                    loginButton.disabled = true;
                    loginButton.innerHTML = '<i class="fas fa-check"></i> Autenticado';
                    
                    // Redirecionar para a página de login normal, que agora tem o cookie apropriado
                    setTimeout(() => {
                        // Limpar as tentativas de login para evitar loops
                        sessionStorage.removeItem('loginAttempts');
                        
                        // Recarregar a página atual (login) - o servidor vai redirecionar
                        window.location.reload();
                    }, 1000);
                    
                    return;
                } else {
                    throw new Error('Token não recebido do servidor');
                }
            } catch (error) {
                // Restaurar o botão
                this.disabled = false;
                this.innerHTML = originalButtonText;
                
                // Mostrar mensagem de erro
                const messagesContainer = document.querySelector('.messages-container');
                const errorMessage = error.message || 'Erro desconhecido durante o login';
                console.error('Erro de login:', errorMessage);
                
                if (!messagesContainer) {
                    const newContainer = document.createElement('div');
                    newContainer.className = 'messages-container';
                    document.getElementById('login-form').insertAdjacentElement('beforebegin', newContainer);
                    
                    newContainer.innerHTML = `
                        <div class="alert alert-danger alert-dismissible fade show" role="alert">
                            ${errorMessage}
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    `;
                } else {
                    messagesContainer.innerHTML = `
                        <div class="alert alert-danger alert-dismissible fade show" role="alert">
                            ${errorMessage}
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    `;
                }
            }
        });
    }
});
