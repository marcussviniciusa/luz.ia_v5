// Script para inicializar modais manualmente
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar botões que abrem o modal de Nova Meta
  document.querySelectorAll('[data-toggle="modal"][data-target="#novaMetaModal"]').forEach(button => {
    button.addEventListener('click', function() {
      // Abrir o modal manualmente
      const modal = document.getElementById('novaMetaModal');
      modal.style.display = 'block';
      modal.classList.add('show');
      document.body.classList.add('modal-open');
      
      // Criar backdrop para o modal
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
    });
  });

  // Inicializar botões que fecham modais
  document.querySelectorAll('[data-dismiss="modal"]').forEach(button => {
    button.addEventListener('click', function() {
      // Encontrar o modal pai
      const modal = this.closest('.modal');
      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
        
        // Remover backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
      }
    });
  });

  // Também fechar clicando fora do modal
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal') && e.target.classList.contains('show')) {
      e.target.style.display = 'none';
      e.target.classList.remove('show');
      document.body.classList.remove('modal-open');
      
      // Remover backdrop
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
    }
  });
});
