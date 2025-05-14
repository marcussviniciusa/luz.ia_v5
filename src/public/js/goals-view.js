// Script focado apenas na visualização, edição e exclusão de metas
document.addEventListener('DOMContentLoaded', function() {
  let currentGoalId = null;
  let isSubmitting = false;
  
  // Obter token de autenticação
  function getAuthToken() {
    return localStorage.getItem('token');
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
  
  // ======= Criar Nova Meta =======
  const saveGoalBtn = document.getElementById('saveGoalBtn');
  if (saveGoalBtn) {
    saveGoalBtn.addEventListener('click', function() {
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
        const novaMetaModal = document.getElementById('novaMetaModal');
        const bsModal = bootstrap.Modal.getInstance(novaMetaModal);
        if (bsModal) bsModal.hide();
        
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
  }
  
  // ======= Adicionar Marco =======
  let milestoneCounter = 1;
  const addMilestoneBtn = document.getElementById('addMilestone');
  if (addMilestoneBtn) {
    addMilestoneBtn.addEventListener('click', function() {
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
  }
  
  // Obter token de autenticação
  function getAuthToken() {
    return localStorage.getItem('token');
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
  
  // Adicionar event listeners
  document.querySelectorAll('.view-goal').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const goalId = this.getAttribute('data-id');
      currentGoalId = goalId;
      
      if (!goalId) {
        console.error('ID da meta não encontrado');
        return;
      }
      
      // Mostrar modal
      const detalhesModal = document.getElementById('detalhesMetaModal');
      const bsModal = new bootstrap.Modal(detalhesModal);
      bsModal.show();
      
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
      
      // Realizar requisição à API
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
            milestonesHtml = `
              <div class="list-group">
                ${goal.milestones.map(milestone => `
                  <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 class="mb-1">${milestone.title}</h6>
                        <small class="text-muted">
                          ${milestone.dueDate ? 'Prazo: ' + formatDate(milestone.dueDate) : 'Sem prazo definido'}
                        </small>
                      </div>
                      <span class="badge badge-${milestone.completed ? 'success' : 'secondary'} p-2">
                        ${milestone.completed ? 'Concluído' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                `).join('')}
              </div>
            `;
          }
          
          // Exibir detalhes no modal
          document.getElementById('goalDetails').innerHTML = `
            <div class="row">
              <div class="col-md-6">
                <div class="progress-circle mx-auto mb-4" data-value="${goal.progress}">
                  <span class="progress-circle-left">
                    <span class="progress-circle-bar"></span>
                  </span>
                  <span class="progress-circle-right">
                    <span class="progress-circle-bar"></span>
                  </span>
                  <div class="progress-circle-value">
                    <div>
                      <span>${goal.progress}%</span><br>
                      <span class="small">concluído</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <h4>${goal.title}</h4>
                <p><span class="badge badge-${
                  goal.status === 'concluida' ? 'success' : 
                  goal.status === 'em-progresso' ? 'info' : 
                  goal.status === 'pausada' ? 'warning' : 'primary'
                }">${goal.status.charAt(0).toUpperCase() + goal.status.slice(1).replace('-', ' ')}</span></p>
                <p><strong>Categoria:</strong> ${goal.category.charAt(0).toUpperCase() + goal.category.slice(1).replace('-', ' ')}</p>
                <p><strong>Criada em:</strong> ${formatDate(goal.createdAt)}</p>
                ${goal.deadline ? `<p><strong>Prazo:</strong> ${formatDate(goal.deadline)}</p>` : ''}
              </div>
            </div>
            
            <div class="row mt-4">
              <div class="col-12">
                <hr>
                <h5>Descrição</h5>
                <p>${goal.description || 'Nenhuma descrição fornecida.'}</p>
              </div>
            </div>
            
            ${goal.visualizationNotes ? `
              <div class="row mt-3">
                <div class="col-12">
                  <hr>
                  <h5>Notas de Visualização</h5>
                  <p>${goal.visualizationNotes}</p>
                </div>
              </div>
            ` : ''}
            
            <div class="row mt-3">
              <div class="col-12">
                <hr>
                <h5>Marcos</h5>
                ${milestonesHtml}
              </div>
            </div>
            
            ${goal.affirmations && goal.affirmations.length > 0 ? `
              <div class="row mt-3">
                <div class="col-12">
                  <hr>
                  <h5>Afirmações Positivas</h5>
                  <ul class="list-group">
                    ${goal.affirmations.map(item => `
                      <li class="list-group-item">${item.text}</li>
                    `).join('')}
                  </ul>
                </div>
              </div>
            ` : ''}
          `;
          
          // Inicializar círculo de progresso
          const progressCircle = document.querySelector('.progress-circle');
          if (progressCircle) {
            const value = progressCircle.getAttribute('data-value');
            const left = progressCircle.querySelector('.progress-circle-left .progress-circle-bar');
            const right = progressCircle.querySelector('.progress-circle-right .progress-circle-bar');
            
            if (value > 0) {
              if (value <= 50) {
                right.style.transform = `rotate(${value * 3.6}deg)`;
              } else {
                right.style.transform = 'rotate(180deg)';
                left.style.transform = `rotate(${(value - 50) * 3.6}deg)`;
              }
            }
          }
        } else {
          document.getElementById('goalDetails').innerHTML = `
            <div class="alert alert-warning">
              Não foi possível encontrar os detalhes desta meta.
            </div>
          `;
        }
      })
      .catch(error => {
        console.error('Erro ao buscar detalhes da meta:', error);
        document.getElementById('goalDetails').innerHTML = `
          <div class="alert alert-danger">
            Erro ao buscar detalhes: ${error.message}
          </div>
        `;
      });
    });
  });
  
  // Botão Editar
  const editGoalBtn = document.getElementById('editGoalBtn');
  if (editGoalBtn) {
    editGoalBtn.addEventListener('click', function() {
      if (currentGoalId) {
        window.location.href = `/tools/manifestation/edit/${currentGoalId}`;
      }
    });
  }
  
  // Botão Excluir
  const deleteGoalBtn = document.getElementById('deleteGoalBtn');
  if (deleteGoalBtn) {
    deleteGoalBtn.addEventListener('click', function() {
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
        // Esconder modal
        const detalhesModal = document.getElementById('detalhesMetaModal');
        const bsModal = bootstrap.Modal.getInstance(detalhesModal);
        if (bsModal) bsModal.hide();
        
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
  }
});
