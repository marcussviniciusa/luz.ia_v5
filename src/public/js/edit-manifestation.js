// Gerenciamento da edição de metas
document.addEventListener('DOMContentLoaded', function() {
  // ======= Funções Auxiliares =======
  
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

  // Animação do círculo de progresso
  function setProgressCircle(percent) {
    const progressCircles = document.querySelectorAll('.progress-circle');
    
    progressCircles.forEach(circle => {
      circle.setAttribute('data-value', percent);
      
      if (percent < 50) {
        circle.querySelector('.progress-circle-right .progress-circle-bar').style.transform = `rotate(${percent * 3.6}deg)`;
        circle.querySelector('.progress-circle-left .progress-circle-bar').style.transform = 'rotate(0deg)';
      } else {
        circle.querySelector('.progress-circle-right .progress-circle-bar').style.transform = 'rotate(180deg)';
        circle.querySelector('.progress-circle-left .progress-circle-bar').style.transform = `rotate(${(percent - 50) * 3.6}deg)`;
      }
      
      circle.querySelector('.progress-circle-value span').textContent = percent;
    });
  }
  
  // Função para refrescar a página sem recarregar
  function refreshPage() {
    const goalId = document.getElementById('goalId').value;
    
    if (!goalId) {
      showAlert('ID da meta não encontrado.', 'danger');
      return;
    }
    
    // Redirecionar para esta mesma página para garantir dados atualizados
    window.location.href = `/tools/manifestation/edit/${goalId}`;
  }

  // ======= Edição de Detalhes da Meta =======
  const editDetailsForm = document.getElementById('editDetailsForm');
  if (editDetailsForm) {
    editDetailsForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const goalId = document.getElementById('goalId').value;
      
      if (!goalId) {
        showAlert('ID da meta não encontrado.', 'danger');
        return;
      }
      
      const token = getAuthToken();
      if (!token) {
        showAlert('Sua sessão expirou. Por favor, faça login novamente.', 'warning');
        window.location.href = '/login';
        return;
      }
      
      // Preparar dados do formulário
      const formData = new FormData(editDetailsForm);
      const goalData = {
        title: formData.get('title'),
        description: formData.get('description'),
        category: formData.get('category'),
        status: formData.get('status'),
        deadline: formData.get('deadline') || null,
        progress: formData.get('progress') ? parseInt(formData.get('progress')) : null,
        pinned: formData.get('pinned') === 'on',
        reminderFrequency: formData.get('reminderFrequency')
      };
      
      // Validar dados
      if (!goalData.title) {
        showAlert('Por favor, forneça um título para sua meta.', 'danger');
        return;
      }
      
      // Enviar para a API
      fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(goalData)
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
        console.log('Meta atualizada com sucesso:', data);
        showAlert('Detalhes da meta atualizados com sucesso!');
        
        // Atualizar círculo de progresso se necessário
        if (goalData.progress !== null) {
          setProgressCircle(goalData.progress);
        }
      })
      .catch(error => {
        console.error('Erro ao atualizar meta:', error);
        showAlert(error.message || 'Erro ao atualizar meta. Tente novamente.', 'danger');
      });
    });
  }

  // ======= Gerenciamento de Marcos =======
  
  // Adicionar novo marco
  const addMilestoneForm = document.getElementById('addMilestoneForm');
  if (addMilestoneForm) {
    addMilestoneForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const goalId = document.getElementById('goalId').value;
      const title = document.getElementById('newMilestoneTitle').value.trim();
      const dueDate = document.getElementById('newMilestoneDueDate').value || null;
      
      if (!title) {
        showAlert('Por favor, forneça uma descrição para o marco.', 'warning');
        return;
      }
      
      const token = getAuthToken();
      if (!token) {
        showAlert('Sua sessão expirou. Por favor, faça login novamente.', 'warning');
        window.location.href = '/login';
        return;
      }
      
      fetch(`/api/goals/${goalId}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, dueDate })
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.message || 'Erro ao adicionar marco');
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Marco adicionado com sucesso:', data);
        showAlert('Marco adicionado com sucesso!');
        
        // Limpar formulário
        document.getElementById('newMilestoneTitle').value = '';
        document.getElementById('newMilestoneDueDate').value = '';
        
        // Atualizar a página para mostrar o novo marco
        refreshPage();
      })
      .catch(error => {
        console.error('Erro ao adicionar marco:', error);
        showAlert(error.message || 'Erro ao adicionar marco. Tente novamente.', 'danger');
      });
    });
  }
  
  // Marcar/desmarcar marco como concluído
  document.querySelectorAll('.milestone-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const goalId = document.getElementById('goalId').value;
      const milestoneItem = this.closest('.milestone-item');
      const milestoneId = milestoneItem.getAttribute('data-id');
      const completed = this.checked;
      
      const token = getAuthToken();
      if (!token) {
        showAlert('Sua sessão expirou. Por favor, faça login novamente.', 'warning');
        window.location.href = '/login';
        return;
      }
      
      fetch(`/api/goals/${goalId}/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed })
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.message || 'Erro ao atualizar marco');
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Marco atualizado com sucesso:', data);
        
        // Atualizar estilo visual
        const label = milestoneItem.querySelector('.custom-control-label');
        if (completed) {
          label.classList.add('text-muted');
        } else {
          label.classList.remove('text-muted');
        }
        
        // Atualizar progresso
        if (data.data && data.data.progress !== undefined) {
          setProgressCircle(data.data.progress);
        }
      })
      .catch(error => {
        console.error('Erro ao atualizar marco:', error);
        showAlert(error.message || 'Erro ao atualizar marco. Tente novamente.', 'danger');
        
        // Reverter o checkbox para o estado anterior
        this.checked = !completed;
      });
    });
  });
  
  // Excluir marco
  document.querySelectorAll('.delete-milestone').forEach(button => {
    button.addEventListener('click', function() {
      if (!confirm('Tem certeza que deseja excluir este marco?')) {
        return;
      }
      
      const goalId = document.getElementById('goalId').value;
      const milestoneItem = this.closest('.milestone-item');
      const milestoneId = milestoneItem.getAttribute('data-id');
      
      const token = getAuthToken();
      if (!token) {
        showAlert('Sua sessão expirou. Por favor, faça login novamente.', 'warning');
        window.location.href = '/login';
        return;
      }
      
      // Nota: O backend precisa implementar esta rota específica
      fetch(`/api/goals/${goalId}/milestones/${milestoneId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.message || 'Erro ao excluir marco');
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Marco excluído com sucesso:', data);
        showAlert('Marco excluído com sucesso!');
        
        // Remover item da lista
        milestoneItem.remove();
        
        // Verificar se a lista está vazia
        if (document.querySelectorAll('.milestone-item').length === 0) {
          document.getElementById('milestones-list').innerHTML = '<p class="text-muted">Nenhum marco adicionado ainda.</p>';
        }
        
        // Atualizar progresso
        if (data.data && data.data.progress !== undefined) {
          setProgressCircle(data.data.progress);
        }
      })
      .catch(error => {
        console.error('Erro ao excluir marco:', error);
        showAlert(error.message || 'Erro ao excluir marco. Tente novamente.', 'danger');
      });
    });
  });

  // ======= Gerenciamento de Visualização =======
  const visualizationForm = document.getElementById('visualizationForm');
  if (visualizationForm) {
    visualizationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const goalId = document.getElementById('goalId').value;
      const visualizationNotes = document.getElementById('visualizationNotes').value.trim();
      
      const token = getAuthToken();
      if (!token) {
        showAlert('Sua sessão expirou. Por favor, faça login novamente.', 'warning');
        window.location.href = '/login';
        return;
      }
      
      fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ visualizationNotes })
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.message || 'Erro ao atualizar visualização');
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Visualização atualizada com sucesso:', data);
        showAlert('Notas de visualização atualizadas com sucesso!');
      })
      .catch(error => {
        console.error('Erro ao atualizar visualização:', error);
        showAlert(error.message || 'Erro ao atualizar visualização. Tente novamente.', 'danger');
      });
    });
  }
  
  // Upload de imagem (será implementado quando o feature de upload estiver pronto)
  const visualizationImage = document.getElementById('visualizationImage');
  if (visualizationImage) {
    visualizationImage.addEventListener('change', function() {
      // Atualizar o nome do arquivo na label
      const fileName = this.files[0]?.name || 'Escolher arquivo...';
      this.nextElementSibling.textContent = fileName;
      
      // O upload só será implementado quando a funcionalidade estiver pronta
      showAlert('O upload de imagens será implementado em breve!', 'info');
    });
  }
  
  // Remover imagem
  const removeImageBtn = document.getElementById('removeImage');
  if (removeImageBtn) {
    removeImageBtn.addEventListener('click', function() {
      if (!confirm('Tem certeza que deseja remover esta imagem?')) {
        return;
      }
      
      const goalId = document.getElementById('goalId').value;
      
      const token = getAuthToken();
      if (!token) {
        showAlert('Sua sessão expirou. Por favor, faça login novamente.', 'warning');
        window.location.href = '/login';
        return;
      }
      
      fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ image: null })
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.message || 'Erro ao remover imagem');
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Imagem removida com sucesso:', data);
        showAlert('Imagem removida com sucesso!');
        
        // Atualizar a página para refletir a mudança
        refreshPage();
      })
      .catch(error => {
        console.error('Erro ao remover imagem:', error);
        showAlert(error.message || 'Erro ao remover imagem. Tente novamente.', 'danger');
      });
    });
  }

  // ======= Gerenciamento de Afirmações =======
  
  // Adicionar nova afirmação
  const addAffirmationForm = document.getElementById('addAffirmationForm');
  if (addAffirmationForm) {
    addAffirmationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const goalId = document.getElementById('goalId').value;
      const text = document.getElementById('newAffirmationText').value.trim();
      
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
        document.getElementById('newAffirmationText').value = '';
        
        // Atualizar a página
        refreshPage();
      })
      .catch(error => {
        console.error('Erro ao adicionar afirmação:', error);
        showAlert(error.message || 'Erro ao adicionar afirmação. Tente novamente.', 'danger');
      });
    });
  }
  
  // Alternar estado da afirmação (ativar/desativar)
  document.querySelectorAll('.toggle-affirmation').forEach(button => {
    button.addEventListener('click', function() {
      const goalId = document.getElementById('goalId').value;
      const affirmationItem = this.closest('.affirmation-item');
      const affirmationId = affirmationItem.getAttribute('data-id');
      const currentActive = this.getAttribute('data-active') === 'true';
      const newActive = !currentActive;
      
      const token = getAuthToken();
      if (!token) {
        showAlert('Sua sessão expirou. Por favor, faça login novamente.', 'warning');
        window.location.href = '/login';
        return;
      }
      
      // Nota: O backend precisa implementar esta rota específica
      fetch(`/api/goals/${goalId}/affirmations/${affirmationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ active: newActive })
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.message || 'Erro ao atualizar afirmação');
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Estado da afirmação atualizado:', data);
        showAlert(`Afirmação ${newActive ? 'ativada' : 'desativada'} com sucesso!`);
        
        // Atualizar a página
        refreshPage();
      })
      .catch(error => {
        console.error('Erro ao atualizar afirmação:', error);
        showAlert(error.message || 'Erro ao atualizar afirmação. Tente novamente.', 'danger');
      });
    });
  });
  
  // Excluir afirmação
  document.querySelectorAll('.delete-affirmation').forEach(button => {
    button.addEventListener('click', function() {
      if (!confirm('Tem certeza que deseja excluir esta afirmação?')) {
        return;
      }
      
      const goalId = document.getElementById('goalId').value;
      const affirmationItem = this.closest('.affirmation-item');
      const affirmationId = affirmationItem.getAttribute('data-id');
      
      const token = getAuthToken();
      if (!token) {
        showAlert('Sua sessão expirou. Por favor, faça login novamente.', 'warning');
        window.location.href = '/login';
        return;
      }
      
      // Nota: O backend precisa implementar esta rota específica
      fetch(`/api/goals/${goalId}/affirmations/${affirmationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.message || 'Erro ao excluir afirmação');
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Afirmação excluída com sucesso:', data);
        showAlert('Afirmação excluída com sucesso!');
        
        // Remover item da lista
        affirmationItem.remove();
        
        // Verificar se a lista está vazia
        if (document.querySelectorAll('.affirmation-item').length === 0) {
          document.getElementById('affirmations-list').innerHTML = '<p class="text-muted">Nenhuma afirmação adicionada ainda.</p>';
        }
      })
      .catch(error => {
        console.error('Erro ao excluir afirmação:', error);
        showAlert(error.message || 'Erro ao excluir afirmação. Tente novamente.', 'danger');
      });
    });
  });

  // ======= Exclusão da Meta =======
  const deleteGoalBtn = document.getElementById('deleteGoalBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  
  if (deleteGoalBtn) {
    deleteGoalBtn.addEventListener('click', function() {
      $('#deleteConfirmModal').modal('show');
    });
  }
  
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', function() {
      const goalId = document.getElementById('goalId').value;
      
      if (!goalId) {
        showAlert('ID da meta não encontrado.', 'danger');
        return;
      }
      
      const token = getAuthToken();
      if (!token) {
        showAlert('Sua sessão expirou. Por favor, faça login novamente.', 'warning');
        window.location.href = '/login';
        return;
      }
      
      fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.message || 'Erro ao excluir meta');
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Meta excluída com sucesso:', data);
        showAlert('Meta excluída com sucesso!');
        
        // Redirecionar para a página de Manifestação
        setTimeout(() => {
          window.location.href = '/tools/manifestation';
        }, 1000);
      })
      .catch(error => {
        console.error('Erro ao excluir meta:', error);
        showAlert(error.message || 'Erro ao excluir meta. Tente novamente.', 'danger');
        
        // Fechar o modal
        $('#deleteConfirmModal').modal('hide');
      });
    });
  }

  // ======= Inicialização do Círculo de Progresso =======
  const progressCircle = document.querySelector('.progress-circle');
  if (progressCircle) {
    const progress = parseInt(progressCircle.getAttribute('data-value')) || 0;
    setProgressCircle(progress);
  }
});
