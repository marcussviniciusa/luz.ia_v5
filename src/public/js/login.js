document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Desativar o botão de envio durante o processamento
            const submitButton = this.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processando...';
            
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
                
                // Armazenar o token no localStorage para uso futuro
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    
                    // Forçar redirecionamento para o dashboard
                    console.log('Login bem-sucedido! Redirecionando...');
                    window.location.href = '/dashboard';
                } else {
                    throw new Error('Token não recebido do servidor');
                }
            } catch (error) {
                // Restaurar o botão
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
                
                // Mostrar mensagem de erro
                const messagesContainer = document.querySelector('.messages-container');
                const errorMessage = error.message || 'Erro desconhecido durante o login';
                console.error('Erro de login:', errorMessage);
                
                if (!messagesContainer) {
                    const newContainer = document.createElement('div');
                    newContainer.className = 'messages-container';
                    loginForm.insertAdjacentElement('beforebegin', newContainer);
                    
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
