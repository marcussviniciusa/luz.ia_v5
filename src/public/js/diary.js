document.addEventListener('DOMContentLoaded', () => {
  // Elementos do DOM
  const diaryForm = document.getElementById('diaryForm');
  const diaryAlert = document.getElementById('diaryAlert');
  const hasTodayEntry = document.getElementById('hasTodayEntry');
  const saveButton = document.getElementById('saveButton');
  const viewEntriesButton = document.getElementById('viewEntriesButton');
  const entriesModal = new bootstrap.Modal(document.getElementById('entriesModal'));
  const entryDetailModal = new bootstrap.Modal(document.getElementById('entryDetailModal'));
  const entriesList = document.getElementById('entriesList');
  const entriesPagination = document.getElementById('entriesPagination');
  const entryDetailContent = document.getElementById('entryDetailContent');
  const deleteEntryBtn = document.getElementById('deleteEntryBtn');
  const editEntryBtn = document.getElementById('editEntryBtn');
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  // Variáveis globais
  let currentEntryId = null;
  let currentPage = 1;
  let totalPages = 1;
  let isEditMode = false;
  
  // Carregar estatísticas ao iniciar
  loadDiaryStats();
  
  // Verificar se já existe uma entrada para hoje
  checkTodayEntry();
  
  // Event Listeners
  diaryForm.addEventListener('submit', handleDiarySubmit);
  viewEntriesButton.addEventListener('click', () => {
    loadEntries();
    entriesModal.show();
  });
  
  deleteEntryBtn.addEventListener('click', deleteEntry);
  editEntryBtn.addEventListener('click', prepareEditEntry);
  
  startDateInput.addEventListener('change', () => loadEntries(1));
  endDateInput.addEventListener('change', () => loadEntries(1));
  
  // Funções
  async function checkTodayEntry() {
    try {
      // Obter entradas de hoje
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/tools/diary?startDate=${today}&endDate=${today}`);
      const data = await response.json();
      
      if (data.success && data.count > 0) {
        // Já existe uma entrada para hoje
        const entry = data.data[0];
        currentEntryId = entry._id;
        
        // Preencher o formulário com os dados da entrada existente
        document.getElementById('emotionalState').value = entry.emotionalState;
        document.getElementById('dominantThoughts').value = entry.dominantThoughts;
        document.getElementById('victories').value = entry.victories;
        document.getElementById('tomorrowGoals').value = entry.tomorrowGoals;
        document.getElementById('additionalNotes').value = entry.additionalNotes || '';
        
        // Alterar o botão para indicar edição
        saveButton.textContent = 'Atualizar Entrada';
        hasTodayEntry.classList.remove('d-none');
        isEditMode = true;
      }
    } catch (error) {
      console.error('Erro ao verificar entrada de hoje:', error);
    }
  }
  
  async function handleDiarySubmit(e) {
    e.preventDefault();
    
    // Coletar dados do formulário
    const formData = {
      emotionalState: document.getElementById('emotionalState').value,
      dominantThoughts: document.getElementById('dominantThoughts').value,
      victories: document.getElementById('victories').value,
      tomorrowGoals: document.getElementById('tomorrowGoals').value,
      additionalNotes: document.getElementById('additionalNotes').value
    };
    
    try {
      let response;
      let method;
      let url = '/api/tools/diary';
      
      if (isEditMode && currentEntryId) {
        // Atualizar entrada existente
        method = 'PUT';
        url = `/api/tools/diary/${currentEntryId}`;
      } else {
        // Criar nova entrada
        method = 'POST';
      }
      
      // Enviar dados para a API
      response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Mostrar mensagem de sucesso
        diaryAlert.textContent = isEditMode ? 'Entrada atualizada com sucesso!' : 'Entrada criada com sucesso!';
        diaryAlert.classList.remove('d-none');
        
        // Esconder a mensagem após 3 segundos
        setTimeout(() => {
          diaryAlert.classList.add('d-none');
        }, 3000);
        
        // Atualizar estatísticas
        loadDiaryStats();
        
        if (!isEditMode) {
          // Se for uma nova entrada, atualizar para modo de edição
          currentEntryId = data.data._id;
          saveButton.textContent = 'Atualizar Entrada';
          hasTodayEntry.classList.remove('d-none');
          isEditMode = true;
        }
      } else {
        // Mostrar mensagem de erro
        diaryAlert.textContent = data.message || 'Erro ao salvar entrada';
        diaryAlert.classList.remove('d-none');
        diaryAlert.classList.remove('alert-success');
        diaryAlert.classList.add('alert-danger');
      }
    } catch (error) {
      console.error('Erro ao salvar entrada:', error);
      diaryAlert.textContent = 'Erro ao salvar entrada. Tente novamente.';
      diaryAlert.classList.remove('d-none');
      diaryAlert.classList.remove('alert-success');
      diaryAlert.classList.add('alert-danger');
    }
  }
  
  async function loadEntries(page = 1) {
    try {
      currentPage = page;
      
      // Construir parâmetros de consulta
      let params = `page=${page}`;
      
      if (startDateInput.value) {
        params += `&startDate=${startDateInput.value}`;
      }
      
      if (endDateInput.value) {
        params += `&endDate=${endDateInput.value}`;
      }
      
      const response = await fetch(`/api/tools/diary?${params}`);
      const data = await response.json();
      
      if (data.success) {
        // Limpar lista atual
        entriesList.innerHTML = '';
        
        if (data.count === 0) {
          entriesList.innerHTML = '<div class="alert alert-info">Nenhuma entrada encontrada</div>';
          entriesPagination.innerHTML = '';
          return;
        }
        
        // Adicionar entradas à lista
        data.data.forEach(entry => {
          const date = new Date(entry.date);
          const formattedDate = date.toLocaleDateString('pt-BR');
          
          const entryElement = document.createElement('a');
          entryElement.href = '#';
          entryElement.className = 'list-group-item list-group-item-action';
          entryElement.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
              <h5 class="mb-1">${formattedDate}</h5>
              <small class="text-muted">${entry.emotionalState}</small>
            </div>
            <p class="mb-1">${entry.dominantThoughts.substring(0, 100)}${entry.dominantThoughts.length > 100 ? '...' : ''}</p>
          `;
          
          entryElement.addEventListener('click', (e) => {
            e.preventDefault();
            viewEntryDetails(entry._id);
          });
          
          entriesList.appendChild(entryElement);
        });
        
        // Adicionar paginação
        totalPages = Math.ceil(data.total / 10);
        updatePagination();
      }
    } catch (error) {
      console.error('Erro ao carregar entradas:', error);
      entriesList.innerHTML = '<div class="alert alert-danger">Erro ao carregar entradas</div>';
    }
  }
  
  function updatePagination() {
    entriesPagination.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    const pagination = document.createElement('nav');
    pagination.innerHTML = `
      <ul class="pagination">
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
          <a class="page-link" href="#" aria-label="Anterior">
            <span aria-hidden="true">&laquo;</span>
          </a>
        </li>
      </ul>
    `;
    
    const paginationList = pagination.querySelector('ul');
    
    // Adicionar páginas
    for (let i = 1; i <= totalPages; i++) {
      const pageItem = document.createElement('li');
      pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
      
      const pageLink = document.createElement('a');
      pageLink.className = 'page-link';
      pageLink.href = '#';
      pageLink.textContent = i;
      
      pageLink.addEventListener('click', (e) => {
        e.preventDefault();
        loadEntries(i);
      });
      
      pageItem.appendChild(pageLink);
      paginationList.appendChild(pageItem);
    }
    
    // Adicionar botão "Próximo"
    const nextButton = document.createElement('li');
    nextButton.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextButton.innerHTML = `
      <a class="page-link" href="#" aria-label="Próximo">
        <span aria-hidden="true">&raquo;</span>
      </a>
    `;
    
    if (currentPage < totalPages) {
      nextButton.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        loadEntries(currentPage + 1);
      });
    }
    
    paginationList.appendChild(nextButton);
    entriesPagination.appendChild(pagination);
  }
  
  async function viewEntryDetails(entryId) {
    try {
      const response = await fetch(`/api/tools/diary/${entryId}`);
      const data = await response.json();
      
      if (data.success) {
        const entry = data.data;
        currentEntryId = entry._id;
        
        // Formatação da data
        const date = new Date(entry.date);
        const formattedDate = date.toLocaleDateString('pt-BR');
        
        // Preencher conteúdo do modal
        entryDetailContent.innerHTML = `
          <div class="diary-detail">
            <div class="mb-3">
              <strong>Data:</strong> ${formattedDate}
            </div>
            <div class="mb-3">
              <strong>Estado Emocional:</strong>
              <div class="mt-1 emotion-badge">${entry.emotionalState}</div>
            </div>
            <div class="mb-3">
              <strong>Pensamentos Predominantes:</strong>
              <p class="mt-1">${entry.dominantThoughts}</p>
            </div>
            <div class="mb-3">
              <strong>Vitórias do Dia:</strong>
              <p class="mt-1">${entry.victories}</p>
            </div>
            <div class="mb-3">
              <strong>Objetivos para o Dia Seguinte:</strong>
              <p class="mt-1">${entry.tomorrowGoals}</p>
            </div>
            ${entry.additionalNotes ? `
              <div class="mb-3">
                <strong>Notas Adicionais:</strong>
                <p class="mt-1">${entry.additionalNotes}</p>
              </div>
            ` : ''}
          </div>
        `;
        
        entryDetailModal.show();
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes da entrada:', error);
    }
  }
  
  async function deleteEntry() {
    if (!currentEntryId) return;
    
    if (!confirm('Tem certeza que deseja excluir esta entrada?')) return;
    
    try {
      const response = await fetch(`/api/tools/diary/${currentEntryId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Fechar modal de detalhes
        entryDetailModal.hide();
        
        // Recarregar lista de entradas
        loadEntries(currentPage);
        
        // Atualizar estatísticas
        loadDiaryStats();
        
        // Se a entrada excluída for a de hoje, resetar o formulário
        if (isEditMode && currentEntryId === currentEntryId) {
          resetForm();
        }
      }
    } catch (error) {
      console.error('Erro ao excluir entrada:', error);
    }
  }
  
  function prepareEditEntry() {
    entryDetailModal.hide();
    entriesModal.hide();
    
    // Se for a entrada de hoje, não há necessidade de fazer nada (já está carregada no formulário)
    if (isEditMode && currentEntryId === currentEntryId) return;
    
    // Buscar detalhes da entrada e preencher o formulário
    fetch(`/api/tools/diary/${currentEntryId}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const entry = data.data;
          
          // Preencher o formulário
          document.getElementById('emotionalState').value = entry.emotionalState;
          document.getElementById('dominantThoughts').value = entry.dominantThoughts;
          document.getElementById('victories').value = entry.victories;
          document.getElementById('tomorrowGoals').value = entry.tomorrowGoals;
          document.getElementById('additionalNotes').value = entry.additionalNotes || '';
          
          // Atualizar estado
          isEditMode = true;
          saveButton.textContent = 'Atualizar Entrada';
          
          // Esconder mensagem de entrada para hoje
          hasTodayEntry.classList.add('d-none');
        }
      })
      .catch(error => {
        console.error('Erro ao carregar entrada para edição:', error);
      });
  }
  
  function resetForm() {
    diaryForm.reset();
    saveButton.textContent = 'Salvar Entrada';
    hasTodayEntry.classList.add('d-none');
    isEditMode = false;
    currentEntryId = null;
  }
  
  async function loadDiaryStats() {
    try {
      const response = await fetch('/api/tools/diary/stats');
      const data = await response.json();
      
      if (data.success) {
        const stats = data.data;
        
        // Atualizar estatísticas na UI
        document.getElementById('totalEntries').textContent = stats.totalEntries;
        document.getElementById('currentStreak').textContent = stats.currentStreak;
        
        // Renderizar gráfico de estados emocionais
        if (stats.emotionalStates && stats.emotionalStates.length > 0) {
          renderEmotionalStateChart(stats.emotionalStates);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  }
  
  function renderEmotionalStateChart(emotionalStates) {
    const chartContainer = document.getElementById('emotionalStateChart');
    
    // Limpar gráfico anterior se existir
    const existingChart = Chart.getChart(chartContainer);
    if (existingChart) {
      existingChart.destroy();
    }
    
    // Preparar dados para o gráfico
    const labels = emotionalStates.map(state => state._id);
    const data = emotionalStates.map(state => state.count);
    
    // Cores aleatórias para as barras
    const backgroundColors = [
      'rgba(142, 68, 173, 0.6)',
      'rgba(155, 89, 182, 0.6)',
      'rgba(214, 182, 230, 0.6)',
      'rgba(74, 35, 90, 0.6)',
      'rgba(185, 142, 198, 0.6)'
    ];
    
    // Criar gráfico
    const chart = new Chart(chartContainer, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Estados Emocionais',
          data: data,
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color.replace('0.6', '1')),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }
});
