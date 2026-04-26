(function() {
    window.toggleGenesisFolder = function(element) {
        const subTree = element.nextElementSibling;
        if (!subTree || subTree.tagName !== 'UL') return;

        subTree.classList.toggle('open');
        const caret = element.querySelector('.caret');
        const folderIcon = element.querySelector('.folder-icon');

        if (subTree.classList.contains('open')) {
            caret.classList.replace('fa-chevron-right', 'fa-chevron-down');
            folderIcon.classList.replace('fa-folder', 'fa-folder-open');
        } else {
            caret.classList.replace('fa-chevron-down', 'fa-chevron-right');
            folderIcon.classList.replace('fa-folder-open', 'fa-folder');
        }
    };

    window.GenesisFiles = window.GenesisFiles || { isListeningGlobal: false };

    function initGenesisFiles() {
        const dropzone = document.getElementById('project-dropzone');
        const fileInput = document.getElementById('folder-input');
        const listContainer = document.getElementById('file-list-container');
        const collapseBtn = document.getElementById('collapse-all-btn');
        const rootNameLabel = document.getElementById('root-folder-name');

        if (!dropzone || !fileInput || !listContainer) return;

        // --- SISTEMA DE ICONOS (Añadido soporte para imágenes como iconos) ---
        function getFileIcon(filename) {
            const ext = filename.split('.').pop().toLowerCase();
            const iconMap = {
                'ogg': 'fas fa-file-audio', 'mp3': 'fas fa-file-audio', 'wav': 'fas fa-file-audio',
                'mp4': 'fas fa-file-video', 'webm': 'fas fa-file-video', 'avi': 'fas fa-file-video',
                'js': 'fab fa-js', 'json': 'fas fa-cog', 'html': 'fab fa-html5', 'css': 'fab fa-css3-alt',
                'md': 'fab fa-markdown', 'txt': 'fas fa-file-alt', 'cpp': 'fas fa-file-code', 'h': 'fas fa-file-code',
                'xml': 'fas fa-code',
                // Las imágenes ahora retornan el icono estándar de FontAwesome
                'png': 'fas fa-image', 'jpg': 'fas fa-image', 'jpeg': 'fas fa-image', 
                'gif': 'fas fa-image', 'webp': 'fas fa-image', 'svg': 'fas fa-image'
            };
            return iconMap[ext] || 'fas fa-file';
        }

        // --- PROCESAMIENTO DE DATOS ---
        function buildTree(fileList) {
            const root = {};
            for (let file of fileList) {
                // customPath es generado por nuestro lector recursivo de Drag&Drop
                const path = file.customPath || file.webkitRelativePath || file.name;
                const parts = path.split('/');
                
                const relevantParts = parts.length > 1 ? parts.slice(1) : parts; 
                let currentLevel = root;
                
                for (let i = 0; i < relevantParts.length; i++) {
                    const part = relevantParts[i];
                    const isFile = (i === relevantParts.length - 1);
                    
                    if (!currentLevel[part]) {
                        currentLevel[part] = isFile ? { _isFile: true, name: part } : {};
                    }
                    currentLevel = currentLevel[part];
                }
            }
            return root;
        }

        // --- RENDERIZADO DEL DOM ---
        function renderTree(node, container) {
            const ul = document.createElement('ul');

            const keys = Object.keys(node).sort((a, b) => {
                const isFolderA = !node[a]._isFile;
                const isFolderB = !node[b]._isFile;
                if (isFolderA && !isFolderB) return -1;
                if (!isFolderA && isFolderB) return 1;
                return a.localeCompare(b);
            });

            keys.forEach(key => {
                if (key === '_isFile' || key === 'name') return;

                const li = document.createElement('li');
                const isFile = node[key]._isFile;

                if (isFile) {
                    // Renderizado directo con icono de FontAwesome, sin miniaturas
                    const iconClass = getFileIcon(key);
                    li.innerHTML = `
                        <div class="item" title="${key}">
                            <i class="fas fa-chevron-right caret" style="visibility: hidden;"></i>
                            <i class="${iconClass}"></i>
                            <span>${key}</span>
                        </div>
                    `;
                } else {
                    li.innerHTML = `
                        <div class="item is-folder" onclick="window.toggleGenesisFolder(this)" title="${key}">
                            <i class="fas fa-chevron-right caret"></i>
                            <i class="fas fa-folder folder-icon"></i>
                            <span>${key}</span>
                        </div>
                    `;
                    renderTree(node[key], li);
                }
                ul.appendChild(li);
            });

            container.appendChild(ul);
        }

        // --- SISTEMA RECURSIVO PARA DRAG & DROP ---
        async function handleDropEvent(e) {
            const items = e.dataTransfer.items;
            const files = [];

            if (items && items.length > 0 && items[0].webkitGetAsEntry) {
                const promises = [];
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    if (item.kind === 'file') {
                        const entry = item.webkitGetAsEntry();
                        if (entry) {
                            promises.push(traverseFileTree(entry, '', files));
                        }
                    }
                }
                await Promise.all(promises);
                handleDirectoryLoad(files);
            } else {
                handleDirectoryLoad(e.dataTransfer.files);
            }
        }

        function traverseFileTree(item, path, filesArray) {
            return new Promise((resolve) => {
                path = path || "";
                if (item.isFile) {
                    item.file((file) => {
                        file.customPath = path + file.name;
                        filesArray.push(file);
                        resolve();
                    });
                } else if (item.isDirectory) {
                    const dirReader = item.createReader();
                    const entries = [];
                    const readEntries = () => {
                        dirReader.readEntries(async (results) => {
                            if (!results.length) {
                                for (let entry of entries) {
                                    await traverseFileTree(entry, path + item.name + "/", filesArray);
                                }
                                resolve();
                            } else {
                                entries.push(...results);
                                readEntries();
                            }
                        });
                    };
                    readEntries();
                }
            });
        }

        function handleDirectoryLoad(files) {
            if (!files || files.length === 0) return;

            let rootName = "Proyecto";
            if (files[0].customPath) {
                rootName = files[0].customPath.split('/')[0];
            } else if (files[0].webkitRelativePath) {
                rootName = files[0].webkitRelativePath.split('/')[0];
            }

            rootNameLabel.textContent = rootName;
            rootNameLabel.title = rootName;
            collapseBtn.style.display = 'block';
            dropzone.style.display = 'none';
            
            listContainer.innerHTML = ''; 
            
            const treeData = buildTree(files);
            
            const fragment = document.createDocumentFragment();
            renderTree(treeData, fragment);
            listContainer.appendChild(fragment);
            
            const rootUl = listContainer.querySelector('ul');
            if(rootUl) rootUl.style.display = 'block';
        }

        // Eventos
        fileInput.addEventListener('change', (e) => handleDirectoryLoad(e.target.files));

        collapseBtn.addEventListener('click', () => {
            const openLists = listContainer.querySelectorAll('ul.open');
            openLists.forEach(ul => {
                ul.classList.remove('open');
                const folderItem = ul.previousElementSibling;
                if (folderItem && folderItem.classList.contains('is-folder')) {
                    const caret = folderItem.querySelector('.caret');
                    const folderIcon = folderItem.querySelector('.folder-icon');
                    if (caret) caret.classList.replace('fa-chevron-down', 'fa-chevron-right');
                    if (folderIcon) folderIcon.classList.replace('fa-folder-open', 'fa-folder');
                }
            });
        });

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            await handleDropEvent(e); 
        });

        if (!window.GenesisFiles.isListeningGlobal) {
            document.addEventListener('genesis:ui-rebuilt', () => initGenesisFiles());
            window.GenesisFiles.isListeningGlobal = true;
        }
    }

    initGenesisFiles();
})();