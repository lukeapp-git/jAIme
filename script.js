// URL original de tu archivo JSON en Google Drive
const JSON_URL_ORIGINAL = 'https://drive.google.com/uc?export=download&id=1HXkXhHbPj7RtPs-yv2Vnvr1rju54Imb0';

// Proxies CORS disponibles (se probarán en orden)
const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://cors.sh/'
];

document.addEventListener('DOMContentLoaded', () => {
    const idSelector = document.getElementById('id-selector');
    const spoolSelector = document.getElementById('spool-selector');
    const resultsContainer = document.getElementById('results-container');
    const loader = document.getElementById('loader');
    
    let spoolsData = [];

    /**
     * Carga los datos usando proxies CORS y puebla los selectores.
     */
    async function fetchData() {
        loader.style.display = 'block';
        resultsContainer.style.display = 'none';
        
        // Intentar primero sin proxy (por si Google Drive permite el acceso)
        try {
            console.log('Intentando acceso directo...');
            const directResponse = await fetch(`${JSON_URL_ORIGINAL}&t=${new Date().getTime()}`, {
                method: 'GET',
                mode: 'cors'
            });
            
            if (directResponse.ok) {
                spoolsData = await directResponse.json();
                populateSelectors(spoolsData);
                console.log('✅ Acceso directo exitoso');
                return;
            }
        } catch (directError) {
            console.log('❌ Acceso directo falló, probando proxies...');
        }
        
        // Si el acceso directo falla, probar con proxies
        let lastError = null;
        
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
                    // Timeout de 10 segundos
                    signal: AbortSignal.timeout(10000)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const responseText = await response.text();
                
                // Verificar que la respuesta sea JSON válido
                try {
                    spoolsData = JSON.parse(responseText);
                } catch (parseError) {
                    throw new Error('La respuesta no es JSON válido');
                }
                
                // Verificar que sea un array con datos
                if (!Array.isArray(spoolsData) || spoolsData.length === 0) {
                    throw new Error('Los datos no tienen el formato esperado');
                }
                
                populateSelectors(spoolsData);
                console.log(`✅ Proxy ${i + 1} funcionó correctamente`);
                return; // Salir si funciona
                
            } catch (error) {
                lastError = error;
                console.warn(`❌ Proxy ${i + 1} falló:`, error.message);
                
                // Si es el último proxy, mostrar error
                if (i === CORS_PROXIES.length - 1) {
                    showError(`Todos los métodos fallaron. Último error: ${error.message}`);
                }
            }
        }
    }

    /**
     * Muestra un mensaje de error detallado
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

    /**
     * Llena los <select> con las opciones de ID y Spool.
     * @param {Array} data - El array de objetos de los spools.
     */
    function populateSelectors(data) {
        if (!Array.isArray(data) || data.length === 0) {
            resultsContainer.innerHTML = `
                <div style="color: orange; text-align: center; padding: 20px; border: 1px solid orange; border-radius: 4px; background-color: #fff9e6;">
                    <h3>⚠️ No hay datos disponibles</h3>
                    <p>El archivo JSON está vacío o no contiene datos válidos.</p>
                </div>
            `;
            resultsContainer.style.display = 'block';
            return;
        }

        // Limpiar selectores existentes
        idSelector.innerHTML = '<option value="">Selecciona un ID...</option>';
        spoolSelector.innerHTML = '<option value="">Selecciona un Spool...</option>';

        data.forEach(item => {
            // Verificar que el item tenga las propiedades necesarias
            if (!item.ID_Item || !item.Spool) {
                console.warn('Item sin ID_Item o Spool:', item);
                return;
            }

            // Poblar selector de ID_Item
            const idOption = document.createElement('option');
            idOption.value = item.ID_Item;
            idOption.textContent = item.ID_Item;
            idSelector.appendChild(idOption);

            // Poblar selector de Spool
            const spoolOption = document.createElement('option');
            spoolOption.value = item.ID_Item;
            spoolOption.textContent = item.Spool;
            spoolSelector.appendChild(spoolOption);
        });

        console.log(`✅ ${data.length} elementos cargados en los selectores`);
    }

    /**
     * Muestra el resultado seleccionado en la interfaz.
     * @param {string} selectedId - El ID_Item del spool a mostrar.
     */
    function displayResult(selectedId) {
        if (!selectedId) {
            resultsContainer.style.display = 'none';
            return;
        }

        const selectedItem = spoolsData.find(item => item.ID_Item.toString() === selectedId.toString());

        if (selectedItem) {
            const statusClass = `status-${selectedItem.Status.toLowerCase().replace(/\s+/g, '-')}`;
            
            // Determinar si el plano es PDF o imagen
            const isPdf = selectedItem.Plano_URL && selectedItem.Plano_URL.toLowerCase().includes('.pdf');
            const planViewerHtml = isPdf 
                ? `<iframe src="${selectedItem.Plano_URL}" title="Visor de Plano PDF" style="width: 100%; height: 600px; border: 1px solid #dee2e6; border-radius: 4px;"></iframe>`
                : `<img src="${selectedItem.Plano_URL}" alt="Plano Isométrico" style="width: 100%; height: auto; border: 1px solid #dee2e6; border-radius: 4px;" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIiBzdHJva2U9IiNkZWUyZTYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNmM3NTdkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UGxhbm8gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';">`;

            resultsContainer.innerHTML = `
                <div class="result-card">
                    <div class="result-photo">
                        <img src="${selectedItem.Foto_URL}" alt="Foto del Spool ${selectedItem.Spool}" 
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIiBzdHJva2U9IiNkZWUyZTYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNmM3NTdkIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Rm90byBubyBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';">
                    </div>
                    <div class="result-details">
                        <h2>Spool: ${selectedItem.Spool}</h2>
                        <div class="detail-item"><strong>Status:</strong> <span class="status-badge ${statusClass}">${selectedItem.Status}</span></div>
                        <div class="detail-item"><strong>Ubicación:</strong> ${selectedItem.Ubicacion || 'No especificada'}</div>
                        <div class="detail-item"><strong>ID:</strong> ${selectedItem.ID_Item}</div>
                    </div>
                </div>
                <div class="plan-viewer">
                    <h3>Plano Isométrico</h3>
                    ${selectedItem.Plano_URL ? planViewerHtml : '<p style="text-align: center; color: #6c757d;">No hay plano disponible</p>'}
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

    // Event Listeners para los selectores
    idSelector.addEventListener('change', (e) => {
        spoolSelector.value = ""; // Resetea el otro selector
        displayResult(e.target.value);
    });

    spoolSelector.addEventListener('change', (e) => {
        idSelector.value = ""; // Resetea el otro selector
        displayResult(e.target.value);
    });

    // Carga inicial de datos
    fetchData().finally(() => {
        loader.style.display = 'none';
    });
});