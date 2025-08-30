
const JSON_URL = 'https://drive.google.com/uc?export=download&id=1HXkXhHbPj7RtPs-yv2Vnvr1rju54Imb0';


document.addEventListener('DOMContentLoaded', () => {
    const idSelector = document.getElementById('id-selector');
    const spoolSelector = document.getElementById('spool-selector');
    const resultsContainer = document.getElementById('results-container');
    const loader = document.getElementById('loader');
    
    let spoolsData = [];

    /**
     * Carga los datos desde el JSON y puebla los selectores.
     */
    async function fetchData() {
        loader.style.display = 'block';
        resultsContainer.style.display = 'none';
        try {
            // Se agrega un timestamp para evitar problemas de caché
            const response = await fetch(`${JSON_URL}&t=${new Date().getTime()}`);
            if (!response.ok) {
                throw new Error(`Error al cargar los datos: ${response.statusText}`);
            }
            spoolsData = await response.json();
            populateSelectors(spoolsData);
        } catch (error) {
            resultsContainer.innerHTML = `<p style="color: red;">Error: No se pudo cargar la información. ${error.message}</p>`;
            resultsContainer.style.display = 'block';
        } finally {
            loader.style.display = 'none';
        }
    }

    /**
     * Llena los <select> con las opciones de ID y Spool.
     * @param {Array} data - El array de objetos de los spools.
     */
    function populateSelectors(data) {
        // Limpiar selectores existentes (excepto la primera opción)
        idSelector.innerHTML = '<option value="">Selecciona un ID...</option>';
        spoolSelector.innerHTML = '<option value="">Selecciona un Spool...</option>';

        data.forEach(item => {
            // Poblar selector de ID_Item
            const idOption = document.createElement('option');
            idOption.value = item.ID_Item;
            idOption.textContent = item.ID_Item;
            idSelector.appendChild(idOption);

            // Poblar selector de Spool
            const spoolOption = document.createElement('option');
            spoolOption.value = item.ID_Item; // Usamos ID_Item como valor único
            spoolOption.textContent = item.Spool;
            spoolSelector.appendChild(spoolOption);
        });
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
            const isPdf = selectedItem.Plano_URL.toLowerCase().includes('.pdf');
            const planViewerHtml = isPdf 
                ? `<iframe src="${selectedItem.Plano_URL}" title="Visor de Plano PDF"></iframe>`
                : `<img src="${selectedItem.Plano_URL}" alt="Plano Isométrico">`;

            resultsContainer.innerHTML = `
                <div class="result-card">
                    <div class="result-photo">
                        <img src="${selectedItem.Foto_URL}" alt="Foto del Spool ${selectedItem.Spool}">
                    </div>
                    <div class="result-details">
                        <h2>Spool: ${selectedItem.Spool}</h2>
                        <div class="detail-item"><strong>Status:</strong> <span class="status-badge ${statusClass}">${selectedItem.Status}</span></div>
                        <div class="detail-item"><strong>Ubicación:</strong> ${selectedItem.Ubicacion}</div>
                        <div class="detail-item"><strong>ID:</strong> ${selectedItem.ID_Item}</div>
                    </div>
                </div>
                <div class="plan-viewer">
                    <h3>Plano Isométrico</h3>
                    ${planViewerHtml}
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
    fetchData();
});