// ------------------------------------------------------------------------------------------
// CONFIGURACIÓN - ¡MODIFICAR ESTOS VALORES!
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZzw5BB_KGVBgYmgRX20q2HlcSahOeBEr0DddFMCBKB_APp5_H-qqM1kMtbbgG-vXM6w/exec';
const ADMIN_PASSWORD = 'Narkis2025'; // Cambia esta contraseña
// ------------------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    const updateButton = document.getElementById('force-update-btn');
    const passwordInput = document.getElementById('password');
    const feedbackMessage = document.getElementById('feedback-message');

    updateButton.addEventListener('click', async () => {
        if (passwordInput.value !== ADMIN_PASSWORD) {
            displayFeedback('Contraseña incorrecta ❌', 'error');
            return;
        }

        displayFeedback('Actualizando, por favor espera...', 'loading');
        updateButton.disabled = true;

        try {
            const response = await fetch(APPS_SCRIPT_URL);
            const result = await response.json();

            if (result.status === 'success') {
                displayFeedback('Datos actualizados correctamente ✅', 'success');
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            displayFeedback(`Error en la actualización: ${error.message} ❌`, 'error');
        } finally {
            updateButton.disabled = false;
        }
    });

    function displayFeedback(message, type) {
        feedbackMessage.textContent = message;
        feedbackMessage.style.display = 'block';
        feedbackMessage.style.color = type === 'error' ? 'red' : (type === 'success' ? 'green' : 'black');
        feedbackMessage.style.padding = '10px';
        feedbackMessage.style.marginTop = '15px';
        feedbackMessage.style.border = `1px solid ${type === 'error' ? 'red' : (type === 'success' ? 'green' : 'grey')}`;
        feedbackMessage.style.borderRadius = '4px';
    }
});