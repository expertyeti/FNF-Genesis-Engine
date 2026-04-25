(function() {
    // Objeto global para mantener el estado seguro entre reinicios de la escena
    window.GenesisToolbar = window.GenesisToolbar || {
        isActive: false,
        isListeningGlobal: false
    };

    function initGenesisToolbar() {
        window.GenesisToolbar.isActive = false;
        
        // Volvemos a buscar los elementos porque Phaser acaba de crear DOM nuevo
        const menuItems = document.querySelectorAll('.menu-item');

        function closeAllMenus() {
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('active');
            });
        }

        function openMenu(item) {
            closeAllMenus();
            item.classList.add('active');
        }

        menuItems.forEach(item => {
            if (item.getAttribute('expand') === 'true') {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (item.classList.contains('active')) {
                        closeAllMenus();
                        window.GenesisToolbar.isActive = false;
                    } else {
                        openMenu(item);
                        window.GenesisToolbar.isActive = true;
                    }
                });

                item.addEventListener('mouseenter', () => {
                    if (window.GenesisToolbar.isActive) openMenu(item);
                });
            }
        });

        const nestedParents = document.querySelectorAll('.submenu-item[expand="true"]');
        nestedParents.forEach(parent => {
            parent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });

        // Configuramos los listeners del document UNA SOLA VEZ para evitar fugas de memoria
        if (!window.GenesisToolbar.isListeningGlobal) {
            
            document.addEventListener('click', () => {
                closeAllMenus();
                window.GenesisToolbar.isActive = false;
            });
            
            // --- EL NÚCLEO DE LA SOLUCIÓN ---
            // Escuchamos cuando el Intérprete avise que la escena y el DOM se han reconstruido
            document.addEventListener('genesis:ui-rebuilt', () => {
                initGenesisToolbar();
            });

            window.GenesisToolbar.isListeningGlobal = true;
        }
    }

    // Ejecutar la primera vez que el archivo es descargado por el navegador
    initGenesisToolbar();
})();