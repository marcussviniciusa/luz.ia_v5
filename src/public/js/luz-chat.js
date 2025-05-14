/**
 * Script de gerenciamento do chat da LUZ IA
 * Versão simplificada e eficiente
 */

// Função para obter token JWT do localStorage
function getAuthToken() {
  // Obter o token do localStorage, que é onde o auth-check.js o armazena
  return localStorage.getItem('token');
}

// Função principal de envio de mensagem
function enviarMensagem() {
  const messageInput = document.getElementById('messageInput');
  const chatMessages = document.getElementById('chatMessages');
  const conversationIdInput = document.getElementById('conversationIdInput');
  
  // Verificar elementos e conteúdo
  if (!messageInput || !chatMessages) {
    console.error('[LUZ IA] Elementos de chat não encontrados');
    return;
  }
  
  const mensagem = messageInput.value.trim();
  const conversationId = conversationIdInput ? conversationIdInput.value : '';
  
  if (!mensagem) return;
  
  // Obter token JWT
  const token = getAuthToken();
  if (!token) {
    console.error('[LUZ IA] Token de autenticação não encontrado');
    alert('Sua sessão expirou. Por favor, faça login novamente.');
    window.location.href = '/login';
    return;
  }
  
  // Adicionar mensagem do usuário
  const userDiv = document.createElement('div');
  userDiv.className = 'message user-message';
  userDiv.innerHTML = `
    <div class="message-content">
      <div class="message-header"><strong>Você</strong></div>
      <div class="message-text">${mensagem}</div>
    </div>
  `;
  chatMessages.appendChild(userDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Limpar campo de entrada
  messageInput.value = '';
  
  // Indicador de digitação
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message ai-message typing-indicator';
  typingDiv.innerHTML = `
    <div class="message-content">
      <div class="message-header"><strong>LUZ IA</strong></div>
      <div class="message-text">
        <div class="typing-dots"><span></span><span></span><span></span></div>
      </div>
    </div>
  `;
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Enviar requisição para a API
  fetch('/api/luz_ia/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message: mensagem,
      conversationId: conversationId
    })
  })
  .then(response => response.json())
  .then(data => {
    // Remover indicador de digitação
    if (typingDiv.parentNode) {
      chatMessages.removeChild(typingDiv);
    }
    
    if (data.success) {
      // Adicionar resposta da IA
      const aiDiv = document.createElement('div');
      aiDiv.className = 'message ai-message';
      aiDiv.innerHTML = `
        <div class="message-content">
          <div class="message-header"><strong>LUZ IA</strong></div>
          <div class="message-text">${data.data.message}</div>
        </div>
      `;
      chatMessages.appendChild(aiDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
      // Atualizar ID da conversa se necessário
      if (data.data.conversationId) {
        conversationIdInput.value = data.data.conversationId;
        
        if (!conversationId) {
          window.history.replaceState(
            null, 
            null, 
            `/luz_ia/conversations/${data.data.conversationId}`
          );
        }
      }
    } else {
      console.error('[LUZ IA] Erro na resposta:', data.message);
      alert(`Erro: ${data.message || 'Ocorreu um erro ao processar sua mensagem.'}`);
    }
  })
  .catch(error => {
    console.error('[LUZ IA] Erro de requisição:', error);
    
    if (typingDiv.parentNode) {
      chatMessages.removeChild(typingDiv);
    }
    
    alert('Erro de conexão. Por favor, tente novamente.');
  });
}

// Função para excluir conversa
function excluirConversa(id) {
  if (!id) {
    console.error('[LUZ IA] ID da conversa não fornecido para exclusão');
    return;
  }

  console.log(`[LUZ IA] Tentando excluir conversa com ID: ${id}`);
  
  if (!confirm('Tem certeza que deseja excluir esta conversa?')) {
    return;
  }
  
  const token = getAuthToken();
  if (!token) {
    console.error('[LUZ IA] Token de autenticação não encontrado');
    alert('Sua sessão expirou. Por favor, faça login novamente.');
    window.location.href = '/login';
    return;
  }
  
  // Configuração da requisição com caminho corrigido (garantindo que é realmente a API)
  const url = `/api/luz_ia/conversations/${id}`;
  
  console.log(`[LUZ IA] Preparando requisição DELETE para: ${url}`);
  
  // Tentativa com XMLHttpRequest para obter mais detalhes de erro
  const xhr = new XMLHttpRequest();
  xhr.open('DELETE', url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  
  // Acompanhar o progresso da requisição
  xhr.onreadystatechange = function() {
    console.log(`[LUZ IA] Estado da requisição: ${xhr.readyState}, status: ${xhr.status}`);
    
    if (xhr.readyState === 4) { // Requisição completa
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log('[LUZ IA] Conversa excluída com sucesso');
        
        try {
          // Tentar analisar a resposta como JSON
          const response = JSON.parse(xhr.responseText);
          console.log('[LUZ IA] Resposta do servidor:', response);
        } catch (e) {
          console.log('[LUZ IA] Resposta não é um JSON válido:', xhr.responseText);
        }
        
        // Remover o elemento da conversa do DOM em vez de recarregar a página
        const conversationElement = document.querySelector(`.list-group-item[data-id="${id}"]`);
        if (conversationElement) {
          conversationElement.remove();
          // Verificar se ainda existem conversas
          const remainingConversations = document.querySelectorAll('.list-group-item[data-id]');
          if (remainingConversations.length === 0) {
            // Se não houver mais conversas, adicionar mensagem
            const listGroup = document.querySelector('.sidebar-conversations .list-group');
            if (listGroup) {
              listGroup.innerHTML = '<p class="text-muted small mt-3">Você ainda não iniciou nenhuma conversa com LUZ IA.</p>';
            }
          }
        } else {
          // Se não conseguimos encontrar o elemento para remover, recarregar a página
          setTimeout(() => {
            window.location.href = '/luz_ia';
          }, 300);
        }
      } else {
        // Erro na requisição
        console.error(`[LUZ IA] Erro ao excluir conversa: ${xhr.status} ${xhr.statusText}`);
        console.error('[LUZ IA] Resposta de erro:', xhr.responseText);
        
        try {
          const errorData = JSON.parse(xhr.responseText);
          alert(`Erro ao excluir conversa: ${errorData.message || 'Falha na requisição'}`);
        } catch (e) {
          alert(`Erro ao excluir conversa: ${xhr.statusText || 'Falha na requisição'}`);
        }
      }
    }
  };
  
  xhr.onerror = function() {
    console.error('[LUZ IA] Erro de rede na requisição');
    alert('Erro de conexão. Verifique sua conexão com a internet e tente novamente.');
  };
  
  console.log('[LUZ IA] Enviando requisição DELETE...');
  xhr.send();
}

// Inicialização do chat quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  // Configurar formulário de chat
  const chatForm = document.getElementById('chatForm');
  if (chatForm) {
    chatForm.addEventListener('submit', e => {
      e.preventDefault();
      enviarMensagem();
    });
  }
  
  // Configurar tecla Enter para enviar mensagem
  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    messageInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensagem();
      }
    });
  }
  
  // Configurar botões de exclusão
  const deleteButtons = document.querySelectorAll('.delete-conversation');
  if (deleteButtons.length > 0) {
    deleteButtons.forEach(button => {
      button.addEventListener('click', function() {
        const conversationId = this.getAttribute('data-id');
        excluirConversa(conversationId);
      });
    });
  }
  
  // Carregar prompt selecionado, se houver
  const urlParams = new URLSearchParams(window.location.search);
  const promptId = urlParams.get('prompt');
  
  if (promptId && messageInput) {
    fetch(`/api/luz_ia/prompts/${promptId}`)
      .then(response => response.json())
      .then(data => {
        if (data.success && data.data && data.data.content) {
          messageInput.value = data.data.content;
          messageInput.focus();
        }
      })
      .catch(error => console.error('[LUZ IA] Erro ao carregar prompt:', error));
  }
  
  // Scroll para o final do chat
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});
