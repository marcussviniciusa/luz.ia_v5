// Gerenciamento das Ferramentas de Manifestação
document.addEventListener('DOMContentLoaded', function() {
  // ======= Funções Auxiliares =======
  
  // Obter token de autenticação
  function getAuthToken() {
    return localStorage.getItem('token');
  }
  
  // Formatar data para exibição
  function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  // Formatar nome da categoria
  function formatCategory(category) {
    if (!category) return '';
    return category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ');
  }
  
  // Mostrar mensagem de alerta
  function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="close" data-dismiss="alert" aria-label="Fechar">
        <span aria-hidden="true">&times;</span>
      </button>
    `;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto-fechar após 5 segundos
    setTimeout(() => {
      alertDiv.classList.remove('show');
      setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
  }
  
  // ======= Gestão de Marcos =======
  let milestoneCounter = 1;
  
  // Adicionar novo marco
  document.getElementById('addMilestone').addEventListener('click', function() {
    const container = document.getElementById('milestones-container');
    const milestoneHtml = `
      <div class="milestone-item input-group mb-2">
        <input type="text" class="form-control" name="milestones[${milestoneCounter}][title]" placeholder="Descreva um marco para sua meta">
        <div class="input-group-append">
          <input type="date" class="form-control" name="milestones[${milestoneCounter}][dueDate]">
          <button type="button" class="btn btn-outline-danger remove-milestone">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', milestoneHtml);
    milestoneCounter++;
    
    // Adicionar evento de remoção
    container.lastElementChild.querySelector('.remove-milestone').addEventListener('click', function() {
      this.closest('.milestone-item').remove();
    });
  });
  
  // ======= Criar Nova Meta =======
  let isSubmitting = false;
  document.getElementById('saveGoalBtn').addEventListener('click', function() {
    // Prevenir submissões múltiplas
    if (isSubmitting) return;
    isSubmitting = true;
    
    const form = document.getElementById('novaMetaForm');
    
    // Extrair dados do formulário
    const formData = new FormData(form);
    const goalData = {
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      deadline: formData.get('deadline'),
      visualizationNotes: formData.get('visualizationNotes'),
      milestones: []
    };
    
    // Extrair marcos
    const milestoneItems = form.querySelectorAll('.milestone-item');
    milestoneItems.forEach((item, index) => {
      const titleInput = item.querySelector(`input[name="milestones[${index}][title]"]`);
      const dueDateInput = item.querySelector(`input[name="milestones[${index}][dueDate]"]`);
      
      if (titleInput && titleInput.value.trim()) {
        goalData.milestones.push({
          title: titleInput.value.trim(),
          dueDate: dueDateInput ? dueDateInput.value : null
        });
      }
    });
    
    // Validar dados
    if (!goalData.title) {
      showAlert('Por favor, forneça um título para sua meta.', 'danger');
      isSubmitting = false;
      return;
    }
    
    if (!goalData.category) {
      showAlert('Por favor, selecione uma categoria para sua meta.', 'danger');
      isSubmitting = false;
      return;
    }
    
    // Enviar para a API
    const token = getAuthToken();
    if (!token) {
      showAlert('Sua sessão expirou. Por favor, faça login novamente.', 'warning');
      window.location.href = '/login';
      isSubmitting = false;
      return;
    }
    
    fetch('/api/goals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(goalData)
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => {
          throw new Error(err.message || 'Erro ao criar meta');
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('Meta criada com sucesso:', data);
      showAlert('Meta criada com sucesso!');
      
      // Fechar modal e recarregar página
      $('#novaMetaModal').modal('hide');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    })
    .catch(error => {
      console.error('Erro ao criar meta:', error);
      showAlert(error.message || 'Erro ao criar meta. Tente novamente.', 'danger');
      isSubmitting = false;
    });
  });
  
  // ======= Visualizar Detalhes da Meta =======
  let currentGoalId = null;
  
  document.querySelectorAll('.view-goal').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const goalId = this.getAttribute('data-id');
      currentGoalId = goalId;
      
      if (!goalId) {
        console.error('ID da meta não encontrado');
        return;
      }
      
      // Mostrar modal com spinner
      $('#detalhesMetaModal').modal('show');
      document.getElementById('goalDetails').innerHTML = `
        <div class="text-center">
          <div class="spinner-border text-primary" role="status">
            <span class="sr-only">Carregando...</span>
          </div>
          <p class="mt-2">Carregando detalhes...</p>
        </div>
      `;
      
      // Buscar detalhes da meta
      const token = getAuthToken();
      if (!token) {
        showAlert('Sua sessão expirou. Por favor, faça login novamente.', 'warning');
        window.location.href = '/login';
        return;
      }
      
      fetch(`/api/goals/${goalId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.message || `Erro ${response.status}`);
          });
        }
        return response.json();
      })
      .then(data => {
        if (data.success && data.data) {
          const goal = data.data;
          
          // Formatar HTML de detalhes
          let milestonesHtml = '<p>Nenhum marco definido.</p>';
          if (goal.milestones && goal.milestones.length > 0) {
            milestonesHtml = '<ul class="milestone-list">';
            goal.milestones.forEach(milestone => {
              const completedClass = milestone.completed ? 'completed' : '';
              const checkIcon = milestone.completed ? 
                '<i class="fas fa-check-circle text-success mr-2"></i>' : 
                '<i class="far fa-circle text-secondary mr-2"></i>';
              
              milestonesHtml += `
                <li class="${completedClass}">
                  ${checkIcon}
                  ${milestone.title}
                  ${milestone.dueDate ? `<small class="text-muted ml-2">(Meta: ${formatDate(milestone.dueDate)})</small>` : ''}
                  ${milestone.completedAt ? `<small class="text-success ml-2">(Concluído em: ${formatDate(milestone.completedAt)})</small>` : ''}
                </li>
              `;
            });
            milestonesHtml += '</ul>';
          }
          
          // Formatar HTML de afirmações
          let affirmationsHtml = '<p>Nenhuma afirmação definida.</p>';
          if (goal.affirmations && goal.affirmations.length > 0) {
            affirmationsHtml = '<ul class="list-group">';
            goal.affirmations.forEach(affirmation => {
              affirmationsHtml += `
                <li class="list-group-item">
                  <i class="fas fa-quote-left text-muted mr-2 small"></i>
                  ${affirmation.text}
                  <i class="fas fa-quote-right text-muted ml-2 small"></i>
                </li>
              `;
            });
            affirmationsHtml += '</ul>';
          }
          
          // Atualizar conteúdo do modal
          document.getElementById('goalDetails').innerHTML = `
            <div class="goal-header mb-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h3>${goal.title}</h3>
                <span class="badge badge-${goal.status === 'concluida' ? 'success' : goal.status === 'em-progresso' ? 'info' : goal.status === 'pausada' ? 'warning' : 'secondary'} p-2">
                  ${goal.status.charAt(0).toUpperCase() + goal.status.slice(1).replace('-', ' ')}
                </span>
              </div>
              
              <div class="progress mb-3">
                <div class="progress-bar" role="progressbar" style="width: ${goal.progress}%" aria-valuenow="${goal.progress}" aria-valuemin="0" aria-valuemax="100">${goal.progress}%</div>
              </div>
              
              <div class="goal-meta d-flex justify-content-between">
                <span><i class="fas fa-tag"></i> ${formatCategory(goal.category)}</span>
                ${goal.deadline ? `<span><i class="fas fa-calendar-alt"></i> Meta: ${formatDate(goal.deadline)}</span>` : ''}
              </div>
            </div>
            
            ${goal.description ? `
              <div class="goal-description mb-4">
                <h5>Descrição</h5>
                <p>${goal.description}</p>
              </div>
            ` : ''}
            
            <div class="row">
              <div class="col-md-6">
                <div class="goal-milestones mb-4">
                  <h5>Marcos</h5>
                  ${milestonesHtml}
                </div>
              </div>
              
              <div class="col-md-6">
                <div class="goal-visualization mb-4">
                  <h5>Visualização</h5>
                  ${goal.visualizationNotes ? `<p class="font-italic">"${goal.visualizationNotes}"</p>` : '<p>Nenhuma nota de visualização.</p>'}
                </div>
                
                <div class="goal-affirmations">
                  <h5>Afirmações</h5>
                  <div class="mt-2">
                    ${affirmationsHtml}
                  </div>
                  <div class="mt-3">
                    <div class="input-group">
                      <input type="text" class="form-control" id="newAffirmation" placeholder="Nova afirmação...">
                      <div class="input-group-append">
                        <button class="btn btn-outline-primary" type="button" id="addAffirmationBtn" data-id="${goal._id}">
                          <i class="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
          
          // Configurar botão de edição
          document.getElementById('editGoalBtn').setAttribute('data-id', goal._id);
          
          // Configurar listener para adicionar afirmação
          document.getElementById('addAffirmationBtn').addEventListener('click', function() {
            addAffirmation(this.getAttribute('data-id'));
          });
          
        } else {
          document.getElementById('goalDetails').innerHTML = `
            <div class="alert alert-warning">
              Não foi possível carregar os detalhes desta meta.
            </div>
          `;
        }
      })
      .catch(error => {
        console.error('Erro ao carregar detalhes da meta:', error);
        document.getElementById('goalDetails').innerHTML = `
          <div class="alert alert-danger">
            Erro ao carregar detalhes: ${error.message || 'Tente novamente mais tarde.'}
          </div>
        `;
      });
    });
  });
  
  // ======= Adicionar Afirmação =======
  function addAffirmation(goalId) {
    const input = document.getElementById('newAffirmation');
    const text = input.value.trim();
    
    if (!text) {
      showAlert('Por favor, digite uma afirmação antes de adicionar.', 'warning');
      return;
    }
    
    const token = getAuthToken();
    if (!token) {
      showAlert('Sua sessão expirou. Por favor, faça login novamente.', 'warning');
      window.location.href = '/login';
      return;
    }
    
    fetch(`/api/goals/${goalId}/affirmations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => {
          throw new Error(err.message || 'Erro ao adicionar afirmação');
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('Afirmação adicionada com sucesso:', data);
      showAlert('Afirmação adicionada com sucesso!');
      
      // Limpar campo
      input.value = '';
      
      // Recarregar detalhes
      document.querySelector('.view-goal[data-id="' + goalId + '"]').click();
    })
    .catch(error => {
      console.error('Erro ao adicionar afirmação:', error);
      showAlert(error.message || 'Erro ao adicionar afirmação. Tente novamente.', 'danger');
    });
  }
  
  // ======= Alternar Fixação =======
  document.querySelectorAll('.toggle-pin').forEach(button => {
    button.addEventListener('click', function() {
      const goalId = this.getAttribute('data-id');
      
      if (!goalId) {
        console.error('ID da meta não encontrado');
        return;
      }
      
      const token = getAuthToken();
      if (!token) {
        showAlert('Sua sessão expirou. Por favor, faça login novamente.', 'warning');
        window.location.href = '/login';
        return;
      }
      
      fetch(`/api/goals/${goalId}/pin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.message || 'Erro ao atualizar meta');
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Status de fixação atualizado:', data);
        
        // Atualizar ícone e recarregar a página
        const icon = this.querySelector('i');
        icon.classList.toggle('text-primary');
        icon.classList.toggle('text-secondary');
        
        setTimeout(() => {
          window.location.reload();
        }, 300);
      })
      .catch(error => {
        console.error('Erro ao atualizar status de fixação:', error);
        showAlert(error.message || 'Erro ao atualizar meta. Tente novamente.', 'danger');
      });
    });
  });

// ======= Editar Meta (redirecionar para página de edição) =======
document.getElementById('editGoalBtn').addEventListener('click', function() {
  if (currentGoalId) {
    window.location.href = `/tools/manifestation/edit/${currentGoalId}`;
  }
});

// Excluir meta
document.getElementById('deleteGoalBtn').addEventListener('click', function() {
  if (!currentGoalId) return;
  
  // Confirmar exclusão
  if (!confirm('Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.')) {
    return;
  }
  
  const token = getAuthToken();
  if (!token) {
    showAlert('Sua sessão expirou. Por favor, faça login novamente.', 'warning');
    window.location.href = '/login';
    return;
  }
  
  // Exibir indicador de carregamento
  this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Excluindo...';
  this.disabled = true;
  
  // Fazer requisição DELETE para a API
  fetch(`/api/goals/${currentGoalId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => {
        throw new Error(err.message || `Erro ${response.status}`);
      });
    }
    return response.json();
  })
  .then(data => {
    // Esconder modal e mostrar mensagem de sucesso
    $('#detalhesMetaModal').modal('hide');
    showAlert('Meta excluída com sucesso!');
    
    // Recarregar a página após um breve atraso
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  })
  .catch(error => {
    console.error('Erro ao excluir meta:', error);
    showAlert(error.message || 'Erro ao excluir meta. Tente novamente.', 'danger');
    
    // Restaurar botão
    this.innerHTML = '<i class="fas fa-trash"></i> Excluir';
    this.disabled = false;
  });
});
