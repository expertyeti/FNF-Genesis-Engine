(function() {
    console.log("%c[Genesis Toolbar] Script inyectado y ejecutándose", "color: #000; background: #fff; font-weight: bold;");

    const viewMenu = document.getElementById('view-menu');
    const viewSubmenu = document.getElementById('view-submenu');

    if (viewMenu && viewSubmenu) {
        viewMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = viewSubmenu.style.display === 'flex';
            viewSubmenu.style.display = isVisible ? 'none' : 'flex';
            
            // Posicionar el submenú justo debajo del item
            const rect = viewMenu.getBoundingClientRect();
            viewSubmenu.style.top = rect.height + "px";
            viewSubmenu.style.left = "0px";
        });
    }

    // Cerrar submenús al hacer clic fuera
    document.addEventListener('click', () => {
        if (viewSubmenu) viewSubmenu.style.display = 'none';
    });

    const configBtn = document.getElementById('config-btn');
    if (configBtn) {
        configBtn.onclick = () => console.log("Abriendo Configuración...");
    }
})();