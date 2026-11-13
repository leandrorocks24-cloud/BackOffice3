// Atalho global (ESC fechar modais)
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        var modal = document.getElementById('modalOverlay');
        var drawer = document.getElementById('drawerOverlay');
        if (modal && modal.style.display === 'flex') {
          closeModalDirect(null);
          return;
        }
        if (drawer && drawer.style.display === 'flex') {
          closeDrawerDirect();
        }
      }
    });

    // Inicialização direta e imediata
    refreshOperatorDropdowns();
    renderAll();
    // Atualiza tempo em aberto e semáforo sem exigir recarregar a página.
    window.setInterval(renderAll, 60000);
    syncFromGoogleSheets(false);
