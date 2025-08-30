// URL original de tu archivo JSON en Google Drive
const JSON_URL_ORIGINAL = 'https://drive.google.com/uc?export=download&id=1HXkXhHbPj7RtPs-yv2Vnvr1rju54Imb0';

// Proxies CORS disponibles (se probarán en orden)
const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://cors.sh/'
];

document.addEventListener('DOMContentLoaded', () => {
    const idInput = document.getElementById('id-input');
    const spoolInput = document.getElementById('spool-input');
    const idSuggestions = document.getElementById('id-suggestions');
    const spoolSuggestions = document.getElementById('spool-suggestions');
    const resultsContainer = document.getElementById('results-container');
    const loader = document.getElementById('loader');
    
    let spoolsData = [];
    let filteredIds = [];
    let filteredSpools = [];

    /**
     * Convierte URLs de Google Drive al formato correcto para visualización
     */
    function fixGoogleDriveUrl(url) {
        if (!url) return '';
        
        // Extraer el ID del archivo de diferentes formatos de URL de Google Drive
        let fileId = null;
        
        // Formato: https://drive.google.com/file/d/ID/view
        let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match) {
            fileId = match[1];
        }
        
        // Formato: https://drive.google.com/uc?export=view&id=ID
        if (!fileId) {
            match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (match) {
                fileId = match[1];
            }
        }
        
        // Si encontramos el ID, devolver la URL correcta para visualización
        if (fileId) {
            return `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
        
        // Si no podemos extraer el ID, devolver la URL original
        return url;
    }

    /**
     * Carga los datos usando proxies CORS
     */
    async function fetchData() {
        loader.style.display = 'block';
        resultsContainer.style.display = 'none';
        
        // Intentar primero sin proxy
        try {
            console.log('Intentando acceso directo...');
            const directResponse = await fetch(`${JSON_URL_ORIGINAL}&t=${new Date().getTime()}`, {
                method: 'GET',
                mode: 'cors'
            });
            
            if (directResponse.ok) {
                spoolsData = await directResponse.json();
                initializeSearchInputs();
                console.log('✅ Acceso directo exitoso');
                return;
            }
        } catch (directError) {
            console.log('❌ Acceso directo falló, probando proxies...');
        }
        
        // Si el acceso directo falla, probar con proxies
        for (let i = 0; i < CORS_PROXIES.length; i++) {
            try {
                const proxyUrl = CORS_PROXIES[i] + encodeURIComponent(JSON_URL_ORIGINAL + '&t=' + new Date().getTime());
                console.log(`🔄 Intentando proxy ${i + 1}:`, CORS_PROXIES[i]);
                
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    signal: AbortSignal.timeout(10000)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const responseText = await response.text();
                
                try {
                    spoolsData = JSON.parse(responseText);
                } catch (parseError) {
                    throw new Error('La respuesta no es JSON válido');
                }
                
                if (!Array.isArray(spoolsData) || spoolsData.length === 0) {
                    throw new Error('Los datos no tienen el formato esperado');
                }
                
                initializeSearchInputs();
                console.log(`✅ Proxy ${i + 1} funcionó correctamente`);
                console.log(`📊 ${spoolsData.length} registros cargados`);
                return;
                
            } catch (error) {
                console.warn(`❌ Proxy ${i + 1} falló:`, error.message);
                
                if (i === CORS_PROXIES.length - 1) {
                    showError(`Todos los métodos fallaron. Último error: ${error.message}`);
                }
            }
        }
    }

    /**
     * Inicializa los inputs de búsqueda
     */
    function initializeSearchInputs() {
        if (!Array.isArray(spoolsData) || spoolsData.length === 0) {
            showError('No hay datos disponibles');
            return;
        }

        console.log('🔍 Inicializando búsqueda con', spoolsData.length, 'registros');
        
        // Limpiar los inputs
        idInput.value = '';
        spoolInput.value = '';
        
        // Mostrar mensaje de éxito
        const successMsg = document.createElement('div');
        successMsg.style.cssText = 'color: green; text-align: center; padding: 10px; margin: 10px 0; border: 1px solid green; border-radius: 4px; background-color: #f0fff0;';
        successMsg.innerHTML = `✅ ${spoolsData.length} registros cargados correctamente. Puedes empezar a buscar.`;
        resultsContainer.innerHTML = '';
        resultsContainer.appendChild(successMsg);
        resultsContainer.style.display = 'block';
        
        setTimeout(() => {
            resultsContainer.style.display = 'none';
        }, 3000);
    }

    /**
     * Filtra y muestra sugerencias para IDs
     */
    function filterIds(query) {
        if (!query || query.length < 1) {
            idSuggestions.style.display = 'none';
            return;
        }

        filteredIds = spoolsData.filter(item => 
            item.ID_Item && item.ID_Item.toString().toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10); // Máximo 10 sugerencias

        if (filteredIds.length > 0) {
            idSuggestions.innerHTML = filteredIds.map(item => 
                `<div class="suggestion-item" data-id="${item.ID_Item}">
                    <strong>${item.ID_Item}</strong> - ${item.Spool || 'Sin spool'}
                </div>`
            ).join('');
            idSuggestions.style.display = 'block';
        } else {
            idSuggestions.innerHTML = '<div class="suggestion-item no-results">No se encontraron coincidencias</div>';
            idSuggestions.style.display = 'block';
        }
    }

    /**
     * Filtra y muestra sugerencias para Spools
     */
    function filterSpools(query) {
        if (!query || query.length < 1) {
            spoolSuggestions.style.display = 'none';
            return;
        }

        filteredSpools = spoolsData.filter(item => 
            item.Spool && item.Spool.toString().toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10); // Máximo 10 sugerencias

        if (filteredSpools.length > 0) {
            spoolSuggestions.innerHTML = filteredSpools.map(item => 
                `<div class="suggestion-item" data-id="${item.ID_Item}">
                    <strong>${item.Spool}</strong> - ID: ${item.ID_Item}
                </div>`
            ).join('');
            spoolSuggestions.style.display = 'block';
        } else {
            spoolSuggestions.innerHTML = '<div class="suggestion-item no-results">No se encontraron coincidencias</div>';
            spoolSuggestions.style.display = 'block';
        }
    }

    /**
     * Muestra el resultado seleccionado
     */
    function displayResult(selectedId) {
        if (!selectedId) {
            resultsContainer.style.display = 'none';
            return;
        }

        const selectedItem = spoolsData.find(item => item.ID_Item.toString() === selectedId.toString());

        if (selectedItem) {
            console.log('📋 Mostrando item:', selectedItem);
            
            // Limpiar y procesar el status
            const rawStatus = selectedItem.Status || 'Sin estado';
            const cleanStatus = rawStatus.toString().trim();
            const statusClass = `status-${cleanStatus.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
            
            // Arreglar URLs de Google Drive
            const fotoUrl = fixGoogleDriveUrl(selectedItem.Foto_URL);
            const planoUrl = fixGoogleDriveUrl(selectedItem.Plano_URL);
            
            console.log('🖼️ URL foto original:', selectedItem.Foto_URL);
            console.log('🖼️ URL foto corregida:', fotoUrl);
            console.log('📄 URL plano original:', selectedItem.Plano_URL);
            console.log('📄 URL plano corregida:', planoUrl);
            
            // Determinar si el plano es PDF
            const isPdf = planoUrl.toLowerCase().includes('.pdf') || 
                         selectedItem.Plano_URL.toLowerCase().includes('.pdf');
            
            const planViewerHtml = planoUrl ? (isPdf 
                ? `<iframe src="${planoUrl}" title="Visor de Plano PDF" style="width: 100%; height: 600px; border: 1px solid #dee2e6; border-radius: 4px;"></iframe>`
                : `<img src="${planoUrl}" alt="Plano Isométrico" style="width: 100%; height: auto; max-height: 600px; border: 1px solid #dee2e6; border-radius: 4px; object-fit: contain;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                   <div style="display: none; text-align: center; padding: 40px; border: 1px solid #dee2e6; border-radius: 4px; background-color: #f8f9fa; color: #6c757d;">
                       ❌ No se pudo cargar el plano<br><small>URL: ${planoUrl}</small>
                   </div>`) : '<p style="text-align: center; color: #6c757d; padding: 40px; border: 1px solid #dee2e6; border-radius: 4px; background-color: #f8f9fa;">📄 No hay plano disponible</p>';

            resultsContainer.innerHTML = `
                <div class="result-card">
                    <div class="result-photo">
                        <img src="${fotoUrl}" alt="Foto del Spool ${selectedItem.Spool}" 
                             style="width: 100%; height: auto; border-radius: 4px; object-fit: cover;"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <div style="display: none; text-align: center; padding: 40px; border: 1px solid #dee2e6; border-radius: 4px; background-color: #f8f9fa; color: #6c757d;">
                            📷 Foto no disponible<br><small>URL: ${fotoUrl}</small>
                        </div>
                    </div>
                    <div class="result-details">
                        <h2>Spool: ${selectedItem.Spool || 'Sin identificar'}</h2>
                        <div class="detail-item">
                            <strong>Status:</strong> 
                            <span class="status-badge ${statusClass}" title="Estado: ${cleanStatus}">
                                ${cleanStatus}
                            </span>
                        </div>
                        <div class="detail-item"><strong>Ubicación:</strong> ${selectedItem.Ubicacion || 'No especificada'}</div>
                        <div class="detail-item"><strong>ID:</strong> ${selectedItem.ID_Item}</div>
                    </div>
                </div>
                <div class="plan-viewer">
                    <h3>📋 Plano Isométrico</h3>
                    ${planViewerHtml}
                </div>
            `;
            resultsContainer.style.display = 'block';
        } else {
            resultsContainer.innerHTML = `
                <div style="color: red; text-align: center; padding: 20px; border: 1px solid red; border-radius: 4px; background-color: #fff5f5;">
                    <h3>❌ Item no encontrado</h3>
                    <p>No se pudo encontrar el item con ID: ${selectedId}</p>
                </div>
            `;
            resultsContainer.style.display = 'block';
        }
    }

    /**
     * Muestra mensaje de error
     */
    function showError(errorMessage) {
        resultsContainer.innerHTML = `
            <div style="color: red; padding: 20px; border: 1px solid red; border-radius: 4px; background-color: #fff5f5; margin: 20px 0;">
                <h3>❌ Error al cargar los datos</h3>
                <p><strong>Mensaje:</strong> ${errorMessage}</p>
                
                <details style="margin-top: 15px;">
                    <summary style="cursor: pointer; font-weight: bold;">🔍 Información técnica</summary>
                    <div style="margin-top: 10px; font-size: 0.9em;">
                        <p><strong>URL original:</strong> ${JSON_URL_ORIGINAL}</p>
                        <p><strong>Proxies probados:</strong></p>
                        <ul>
                            ${CORS_PROXIES.map((proxy, i) => `<li>Proxy ${i + 1}: ${proxy}</li>`).join('')}
                        </ul>
                    </div>
                </details>
                
                <div style="margin-top: 15px;">
                    <button onclick="location.reload()" 
                            style="margin-right: 10px; padding: 8px 16px; background: #007BFF; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        🔄 Intentar de nuevo
                    </button>
                    <button onclick="window.open('${JSON_URL_ORIGINAL}', '_blank')" 
                            style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        🔗 Abrir archivo JSON
                    </button>
                </div>
            </div>
        `;
        resultsContainer.style.display = 'block';
    }

    // Event Listeners
    idInput.addEventListener('input', (e) => {
        spoolInput.value = ''; // Limpiar el otro campo
        spoolSuggestions.style.display = 'none';
        filterIds(e.target.value);
        
        if (!e.target.value) {
            resultsContainer.style.display = 'none';
        }
    });

    spoolInput.addEventListener('input', (e) => {
        idInput.value = ''; // Limpiar el otro campo
        idSuggestions.style.display = 'none';
        filterSpools(e.target.value);
        
        if (!e.target.value) {
            resultsContainer.style.display = 'none';
        }
    });

    // Click en sugerencias
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('suggestion-item') && e.target.dataset.id) {
            const selectedId = e.target.dataset.id;
            displayResult(selectedId);
            
            // Ocultar sugerencias
            idSuggestions.style.display = 'none';
            spoolSuggestions.style.display = 'none';
            
            // Actualizar el input correspondiente
            if (e.target.closest('#id-suggestions')) {
                idInput.value = selectedId;
            } else if (e.target.closest('#spool-suggestions')) {
                const item = spoolsData.find(item => item.ID_Item.toString() === selectedId);
                spoolInput.value = item ? item.Spool : selectedId;
            }
        } else if (!e.target.closest('.search-controls')) {
            // Ocultar sugerencias si se hace click fuera
            idSuggestions.style.display = 'none';
            spoolSuggestions.style.display = 'none';
        }
    });

    // Carga inicial de datos
    fetchData().finally(() => {
        loader.style.display = 'none';
    });
});