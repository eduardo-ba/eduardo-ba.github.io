// bloody-project/js/main.js
// Script principal para funcionalidades de JavaScript en todo el sitio.

// Define la URL base de tu API PHP.
const API_URL = '/bloody-project/api/api.php';

// --- Funciones de Utilidad ---

/**
 * Muestra un mensaje en un elemento HTML.
 * @param {HTMLElement} element El elemento HTML donde se mostrará el mensaje.
 * @param {string} message El texto del mensaje.
 * @param {boolean|null} isSuccess Si es true, el mensaje es de éxito (verde); false para error (rojo); null para neutro (azul).
 */
function showMessage(element, message, isSuccess) {
    if (element) {
        element.textContent = message;
        // Limpia todas las clases de color y base de mensaje antes de añadir las nuevas
        element.classList.remove('bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800', 'bg-blue-100', 'text-blue-800');
        element.classList.add('message-display'); // Asegura la clase base para el estilo

        if (isSuccess === true) {
            element.classList.add('bg-green-100', 'text-green-800');
        } else if (isSuccess === false) {
            element.classList.add('bg-red-100', 'text-red-800');
        } else { // Para mensajes neutros o de carga (isSuccess es null o undefined)
            element.classList.add('bg-blue-100', 'text-blue-800');
        }
    } else {
        console.warn('showMessage: El elemento para mostrar el mensaje no fue encontrado.', message);
    }
}

/**
 * Realiza una petición fetch a la API.
 * @param {string} action La acción de la API (ej. 'get_donantes', 'login').
 * @param {string} method El método HTTP ('GET' o 'POST' o 'PUT' o 'DELETE').
 * @param {object} [bodyData=null] Los datos a enviar en el cuerpo de la petición (para POST/PUT/DELETE).
 * @param {string} [params=''] Parámetros de URL para peticiones GET (ej. 'user_id=1').
 * @returns {Promise<object>} La respuesta JSON de la API.
 */
async function callApi(action, method = 'GET', bodyData = null, params = '') {
    let url = `${API_URL}?action=${action}`;
    if (params) {
        url += `&${params}`;
    }

    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
    };

    if (bodyData) {
        options.body = JSON.stringify(bodyData);
    }

    console.log(`[API Call] Haciendo petición a: ${url} con método ${method}`, bodyData || '');

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `HTTP error! Status: ${response.status}`;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.message) {
                    errorMessage += `, Message: ${errorJson.message}`;
                }
            } catch (e) {
                errorMessage += `, Raw Response: ${errorText.substring(0, 200)}... (No es JSON)`;
            }
            console.error(`[API Error] Error en la respuesta de la API para acción ${action}:`, errorMessage, errorText);
            throw new Error(errorMessage);
        }
        const jsonResponse = await response.json();
        console.log(`[API Response] Respuesta para ${action}:`, jsonResponse);
        return jsonResponse;
    } catch (error) {
        console.error(`[API Call Error] Error al llamar a la API (${action}):`, error);
        throw error;
    }
}

// --- Funciones para Interacciones Específicas de Páginas ---

// --- index.html ---
async function cargarDonantesIndex() {
    console.log('[Index Page] Cargando donantes...');
    const listaDonantes = document.getElementById('listaDonantes');
    if (!listaDonantes) { console.log('[Index Page] Elemento #listaDonantes no encontrado.'); return; }

    listaDonantes.innerHTML = '<p class="text-gray-500">Cargando donantes...</p>';
    try {
        const data = await callApi('get_donantes');
        if (data.success && data.data.length > 0) {
            listaDonantes.innerHTML = '';
            data.data.forEach(donante => {
                const li = document.createElement('li');
                li.className = 'bg-gray-50 p-2 rounded-md shadow-sm';
                li.textContent = `ID: ${donante.id} - ${donante.nombre_completo} (${donante.tipo_sangre}, Tel: ${donante.telefono})`;
                listaDonantes.appendChild(li);
            });
        } else {
            listaDonantes.innerHTML = `<p class="text-gray-500">${data.message || 'No se encontraron donantes.'}</p>`;
        }
    } catch (error) {
        listaDonantes.innerHTML = '<p class="text-red-500">Error al cargar donantes. Inténtalo más tarde.</p>';
    }
}

async function cargarCentrosSaludIndex() {
    console.log('[Index Page] Cargando centros de salud...');
    const listaCentros = document.getElementById('listaCentros');
    if (!listaCentros) { console.log('[Index Page] Elemento #listaCentros no encontrado.'); return; }

    listaCentros.innerHTML = '<p class="text-gray-500">Cargando centros de salud...</p>';
    try {
        const data = await callApi('get_centros_salud');
        if (data.success && data.data.length > 0) {
            listaCentros.innerHTML = '';
            data.data.forEach(centro => {
                const li = document.createElement('li');
                li.className = 'bg-gray-50 p-2 rounded-md shadow-sm';
                li.textContent = `ID: ${centro.id} - ${centro.nombre} (${centro.direccion}, Tel: ${centro.telefono})`;
                listaCentros.appendChild(li);
            });
        } else {
            listaCentros.innerHTML = `<p class="text-gray-500">${data.message || 'No se encontraron centros de salud.'}</p>`;
        }
    } catch (error) {
        listaCentros.innerHTML = '<p class="text-red-500">Error al cargar centros de salud. Inténtalo más tarde.</p>';
    }
}

// --- login.html ---
async function handleLoginFormSubmit(event) {
    event.preventDefault();
    console.log('[Login Form] Intentando iniciar sesión...');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginMessage = document.getElementById('loginMessage');
    const rememberMe = document.getElementById('remember')?.checked || false;

    showMessage(loginMessage, 'Iniciando sesión...', null); // Usar null para mensaje neutro

    try {
        const data = await callApi('login', 'POST', { email, password });
        if (data.success) {
            showMessage(loginMessage, data.message + ' Redirigiendo...', true);
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('user_id', data.user_id);
            storage.setItem('user_type', data.user_type);
            console.log(`[Login Success] User ID: ${data.user_id}, User Type: ${data.user_type}`);

            setTimeout(() => {
                if (data.user_type === 'admin') {
                    window.location.href = '../admin/admin.html';
                } else if (data.user_type === 'donante') {
                    window.location.href = '../donor/profile.html';
                } else if (data.user_type === 'centro_salud') {
                    window.location.href = '../admin/workspace_center.html';
                } else {
                    console.warn('[Login Redirect] Tipo de usuario desconocido:', data.user_type, 'Redirigiendo a index.html');
                    window.location.href = '../../index.html';
                }
            }, 1000);
        } else {
            showMessage(loginMessage, data.message, false);
            console.warn('[Login Failed]', data.message);
        }
    } catch (error) {
        showMessage(loginMessage, 'Error de red o servidor. Inténtalo más tarde.', false);
        console.error('Error durante el proceso de login:', error);
    }
}


// --- register.html ---
async function handleRegisterFormSubmit(event) {
    event.preventDefault();
    console.log('[Register Form] Intentando registrar usuario...');
    const form = event.target;
    const registerMessage = document.getElementById('registerMessage');

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Renombrar campos para coincidir con la API (si tus IDs de input no coinciden con los nombres de la API)
    // Asumiendo que los nombres de los inputs en register.html ya coinciden con la API:
    // data.nombre_completo = data.nombre; // Si tu input es name="nombre" y la API espera nombre_completo
    // data.email = data.correo;          // Si tu input es name="correo" y la API espera email
    // data.password = data.contrasena;   // Si tu input es name="contrasena" y la API espera password

    // Si los nombres en HTML ya son los correctos (nombre_completo, email, password), estas líneas no son necesarias
    // y podrían causar problemas si se ejecutan. Revisa tu register.html y ajústalas si es necesario.
    // En el último register.html que me diste, los names SÍ coincidían, así que estas líneas deberían eliminarse
    // o comentarse si no son necesarias:
    // delete data.nombre;
    // delete data.correo;
    // delete data.contrasena;

    showMessage(registerMessage, 'Registrando usuario...', null);

    try {
        const response = await callApi('register', 'POST', data);
        if (response.success) {
            showMessage(registerMessage, response.message + ' Redirigiendo a login...', true);
            console.log('[Register Success]', response.message);
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showMessage(registerMessage, response.message, false);
            console.warn('[Register Failed]', response.message);
        }
    } catch (error) {
        showMessage(registerMessage, 'Error de red o servidor al registrar. Inténtalo más tarde.', false);
        console.error('Error durante el proceso de registro:', error);
    }
}

// --- contact.html ---
async function handleContactFormSubmit(event) {
    event.preventDefault();
    console.log('[Contact Form] Enviando mensaje de contacto...');
    const form = event.target;
    const contactMessageDisplay = document.getElementById('contactMessageDisplay');

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    showMessage(contactMessageDisplay, 'Enviando mensaje...', null);

    try {
        const response = await callApi('send_contact_message', 'POST', data);
        if (response.success) {
            showMessage(contactMessageDisplay, response.message, true);
            form.reset();
            console.log('[Contact Success]', response.message);
        } else {
            showMessage(contactMessageDisplay, response.message, false);
            console.warn('[Contact Failed]', response.message);
        }
    } catch (error) {
        showMessage(contactMessageDisplay, 'Error al enviar el mensaje. Inténtalo de nuevo.', false);
        console.error('Error durante el envío de contacto:', error);
    }
}

// --- faq.html ---
async function loadFaqs() {
    console.log('[FAQ Page] Cargando preguntas frecuentes...');
    const faqsList = document.getElementById('faqsList');
    if (!faqsList) { console.log('[FAQ Page] Elemento #faqsList no encontrado.'); return; }

    faqsList.innerHTML = '<p class="text-center text-gray-500">Cargando preguntas frecuentes...</p>';
    try {
        const data = await callApi('get_faqs');
        if (data.success && data.data.length > 0) {
            faqsList.innerHTML = '';
            data.data.forEach(faq => {
                const faqItem = document.createElement('div');
                faqItem.className = 'faq-item bg-white p-4 rounded-lg shadow-md mb-4';
                faqItem.innerHTML = `
                    <div class="faq-question text-lg font-semibold text-gray-800 cursor-pointer flex justify-between items-center py-2">
                        ${faq.pregunta}
                        <span class="faq-toggle-icon text-gray-600">&#9660;</span>
                    </div>
                    <div class="faq-answer text-gray-700 mt-2 hidden">
                        <p>${faq.respuesta}</p>
                    </div>
                `;
                faqsList.appendChild(faqItem);

                faqItem.querySelector('.faq-question').addEventListener('click', () => {
                    faqItem.classList.toggle('active');
                    const answer = faqItem.querySelector('.faq-answer');
                    answer.classList.toggle('hidden');
                    const icon = faqItem.querySelector('.faq-toggle-icon');
                    icon.innerHTML = faqItem.classList.contains('active') ? '&#9650;' : '&#9660;';
                });
            });
        } else {
            faqsList.innerHTML = '<p class="text-center text-gray-500">No se encontraron preguntas frecuentes.</p>';
        }
    } catch (error) {
        faqsList.innerHTML = '<p class="text-red-500">Error al cargar las FAQs. Inténtalo más tarde.</p>';
    }
}

async function loadDonanteProfile() {
    console.log('[Profile Page] Iniciando carga de perfil del donante...');
    const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
    const userType = sessionStorage.getItem('user_type') || localStorage.getItem('user_type');
    const profileMessage = document.getElementById('profileMessage');

    showMessage(profileMessage, 'Cargando perfil...', null);

    if (!userId || userType !== 'donante') {
        showMessage(profileMessage, 'No has iniciado sesión como donante o tu sesión ha expirado.', false);
        console.warn('[Profile Page] Acceso denegado: User ID o User Type incorrecto.', {userId, userType});
        setTimeout(() => window.location.href = '../auth/login.html', 1500);
        return;
    }

    try {
        const profileData = await callApi('get_donante_profile', 'GET', null, `user_id=${userId}`);
        if (profileData.success) {
            const data = profileData.data;
            console.log('[Profile Page] Datos de perfil recibidos:', data);

            // Mostrar datos en perfil (spans o divs)
            document.getElementById('donante-nombre').textContent = data.nombre_completo || 'N/A';
            document.getElementById('donante-email').textContent = data.email || 'N/A';
            document.getElementById('donante-curp').textContent = data.curp || 'N/A';
            document.getElementById('donante-tipo-sangre').textContent = data.tipo_sangre || 'N/A';
            document.getElementById('donante-telefono').textContent = data.telefono || 'N/A';
            document.getElementById('donante-nacimiento').textContent = data.fecha_nacimiento || 'N/A';
            document.getElementById('donante-genero').textContent = data.genero || 'N/A';
            document.getElementById('donante-discapacidad').textContent = data.discapacidad || 'N/A';

            // Cargar datos en formulario de edición (inputs, selects, textarea)

            const curpInput = document.getElementById('curp');
            if (curpInput) curpInput.value = data.curp || '';

            const telefonoInput = document.getElementById('telefono');
            if (telefonoInput) telefonoInput.value = data.telefono || '';

            const emailInput = document.getElementById('email');
            if (emailInput) emailInput.value = data.email || '';

            const nombreInput = document.getElementById('nombre');
            if (nombreInput) nombreInput.value = data.nombre_completo || '';

            // ... haz esto para todos los inputs/selecciones que tengas en el formulario

            // Cargar otras secciones del perfil
            loadCitasDonante(userId);
            loadDonacionesDonante(userId);
            loadNotificacionesDonante(userId);

            showMessage(profileMessage, 'Perfil cargado exitosamente.', true);
        } else {
            showMessage(profileMessage, `Error al cargar perfil: ${profileData.message}`, false);
            console.error('[Profile Page] Error API al cargar perfil:', profileData.message);
        }
    } catch (error) {
        showMessage(profileMessage, 'Error de red o servidor al cargar perfil. Revisa la consola.', false);
        console.error('[Profile Page] Error fatal al cargar perfil:', error);
    }
}


async function loadCitasDonante(donanteId) {
    console.log(`[Profile Page] Cargando citas para donante ID: ${donanteId}`);
    const listaCitas = document.getElementById('lista-citas');
    if (!listaCitas) { console.log('[Profile Page] Elemento #lista-citas no encontrado.'); return; }
    listaCitas.innerHTML = '<li>Cargando citas...</li>'; // Placeholder de carga

    try {
        const data = await callApi('get_citas_donante', 'GET', null, `donante_id=${donanteId}`);
        if (data.success && data.data.length > 0) {
            listaCitas.innerHTML = ''; // Limpiar placeholder
            data.data.forEach(cita => {
                const li = document.createElement('li');
                li.className = 'appointment-card';
                li.innerHTML = `
                    <div>
                        <strong class="appointment-date">${new Date(cita.fecha_hora).toLocaleString()}</strong><br />
                        <span class="appointment-info">${cita.centro_nombre} (${cita.centro_direccion})</span><br />
                        <span class="status-badge ${cita.estado === 'confirmada' ? 'status-completed' : (cita.estado === 'pendiente' ? 'status-pending' : 'status-cancelled')}">Estado: ${cita.estado}</span>
                    </div>
                    <div class="appointment-actions">
                        <button class="btn-custom-primary btn-confirmar-cita" data-cita-id="${cita.id}" ${cita.estado !== 'pendiente' ? 'disabled' : ''}>Confirmar</button>
                        <button class="btn-custom-secondary btn-cancelar-cita" data-cita-id="${cita.id}" ${cita.estado === 'cancelada' || cita.estado === 'completada' ? 'disabled' : ''}>Cancelar</button>
                    </div>
                `;
                listaCitas.appendChild(li);
            });
            listaCitas.querySelectorAll('.btn-confirmar-cita').forEach(button => {
                button.addEventListener('click', async () => {
                    const citaId = button.dataset.citaId;
                    try {
                        const response = await callApi('confirm_cita', 'POST', { cita_id: parseInt(citaId) });
                        alert(response.message);
                        loadCitasDonante(donanteId);
                    } catch (e) { console.error('Error al confirmar cita:', e); alert('Error al confirmar cita.'); }
                });
            });
            listaCitas.querySelectorAll('.btn-cancelar-cita').forEach(button => {
                button.addEventListener('click', async () => {
                    const citaId = button.dataset.citaId;
                    try {
                        const response = await callApi('cancel_cita', 'POST', { cita_id: parseInt(citaId) });
                        alert(response.message);
                        loadCitasDonante(donanteId);
                    } catch (e) { console.error('Error al cancelar cita:', e); alert('Error al cancelar cita.'); }
                });
            });
            console.log('[Profile Page] Citas cargadas exitosamente.');
        } else {
            listaCitas.innerHTML = '<li>No tienes citas agendadas.</li>';
            console.log('[Profile Page] No se encontraron citas para el donante.');
        }
    } catch (error) {
        listaCitas.innerHTML = '<li class="text-red-500">Error al cargar citas.</li>';
        console.error('[Profile Page] Error al cargar citas:', error);
    }
}

async function loadDonacionesDonante(donanteId) {
    console.log(`[Profile Page] Cargando donaciones para donante ID: ${donanteId}`);
    const listaDonaciones = document.getElementById('lista-donaciones');
    if (!listaDonaciones) { console.log('[Profile Page] Elemento #lista-donaciones no encontrado.'); return; }
    listaDonaciones.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">Cargando historial de donaciones...</td></tr>';

    try {
        const data = await callApi('get_donaciones_donante', 'GET', null, `donante_id=${donanteId}`);
        if (data.success && data.data.length > 0) {
            listaDonaciones.innerHTML = '';
            data.data.forEach(donacion => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${new Date(donacion.fecha).toLocaleDateString()}</td>
                    <td>${donacion.volumen_ml} ml</td>
                    <td><span class="status-badge ${donacion.resultado === 'aprobado' ? 'status-completed' : 'status-pending'}">${donacion.resultado}</span></td>
                    <td>${donacion.centro_nombre}</td>
                `;
                listaDonaciones.appendChild(tr);
            });
            console.log('[Profile Page] Donaciones cargadas exitosamente.');
        } else {
            listaDonaciones.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">No tienes historial de donaciones.</td></tr>';
            console.log('[Profile Page] No se encontraron donaciones para el donante.');
        }
    } catch (error) {
        listaDonaciones.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-red-500">Error al cargar historial de donaciones.</td></tr>';
        console.error('[Profile Page] Error al cargar donaciones:', error);
    }
}

async function loadNotificacionesDonante(userId) {
    console.log(`[Profile Page] Cargando notificaciones para user ID: ${userId}`);
    const listaNotificaciones = document.getElementById('lista-notificaciones');
    if (!listaNotificaciones) { console.log('[Profile Page] Elemento #lista-notificaciones no encontrado.'); return; }
    listaNotificaciones.innerHTML = '<li>Cargando notificaciones...</li>';

    try {
        const data = await callApi('get_notificaciones', 'GET', null, `user_id=${userId}`);
        if (data.success && data.data.length > 0) {
            listaNotificaciones.innerHTML = '';
            data.data.forEach(notif => {
                const li = document.createElement('li');
                li.className = `appointment-card ${notif.leida ? 'opacity-75' : ''}`;
                li.innerHTML = `
                    <span class="emoji" aria-hidden="true">${notif.tipo === 'cita' ? '📅' : (notif.tipo === 'donacion' ? '🩸' : '🔔')}</span>
                    <div>
                        <strong class="appointment-date">${notif.titulo}</strong>
                        <p class="appointment-info">${notif.mensaje}</p>
                        <span class="text-gray-500 text-sm">${new Date(notif.fecha_envio).toLocaleString()}</span>
                    </div>
                    <div class="appointment-actions">
                        ${!notif.leida ? `<button class="btn-custom-secondary btn-mark-read" data-notif-id="${notif.id}">Marcar como leída</button>` : '<span class="text-green-600 font-semibold">Leída</span>'}
                    </div>
                `;
                listaNotificaciones.appendChild(li);
            });
            listaNotificaciones.querySelectorAll('.btn-mark-read').forEach(button => {
                button.addEventListener('click', async () => {
                    const notifId = button.dataset.notifId;
                    try {
                        const response = await callApi('mark_notif_read', 'POST', { notif_id: parseInt(notifId) });
                        alert(response.message);
                        loadNotificacionesDonante(userId);
                    } catch (e) { console.error('Error al marcar como leída:', e); alert('Error al marcar como leída.'); }
                });
            });
            console.log('[Profile Page] Notificaciones cargadas exitosamente.');
        } else {
            listaNotificaciones.innerHTML = '<li>No tienes notificaciones.</li>';
            console.log('[Profile Page] No se encontraron notificaciones.');
        }
    } catch (error) {
        listaNotificaciones.innerHTML = '<li class="text-red-500">Error al cargar notificaciones.</li>';
        console.error('[Profile Page] Error al cargar notificaciones:', error);
    }
}

async function loadHospitalesParaCita() {
    console.log('[Profile Page] Cargando hospitales para la cita...');
    const selectHospital = document.getElementById('hospital-select');
    if (!selectHospital) { console.log('[Profile Page] Elemento #hospital-select no encontrado.'); return; }
    selectHospital.innerHTML = '<option value="">Cargando hospitales...</option>';

    try {
        const data = await callApi('get_centros_salud');
        if (data.success && data.data.length > 0) {
            selectHospital.innerHTML = '<option value="">Selecciona un hospital</option>';
            data.data.forEach(centro => {
                const option = document.createElement('option');
                option.value = centro.id;
                option.textContent = centro.nombre;
                selectHospital.appendChild(option);
            });
            console.log('[Profile Page] Hospitales cargados para la cita.');
        } else {
            selectHospital.innerHTML = '<option value="">No hay hospitales disponibles</option>';
            console.log('[Profile Page] No se encontraron centros de salud.');
        }
    } catch (error) {
        selectHospital.innerHTML = '<option value="">Error al cargar hospitales</option>';
        console.error('[Profile Page] Error al cargar hospitales para cita:', error);
    }
}

async function handleAddCitaFormSubmit(event) {
    event.preventDefault();
    console.log('[Profile Page] Intentando agendar nueva cita...');
    const form = event.target;
    const addCitaMessage = document.getElementById('addCitaMessage');
    const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');

    if (!userId) {
        showMessage(addCitaMessage, 'Error: No se pudo obtener el ID del donante.', false);
        return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.donante_id = parseInt(userId);
    data.centro_salud_id = parseInt(data.centro_salud_id);

    showMessage(addCitaMessage, 'Agendando cita...', null);

    try {
        const response = await callApi('add_cita', 'POST', data);
        if (response.success) {
            showMessage(addCitaMessage, response.message, true);
            form.reset();
            loadCitasDonante(userId);
            console.log('[Profile Page] Cita agendada exitosamente.');
        } else {
            showMessage(addCitaMessage, response.message, false);
            console.warn('[Profile Page] Error al agendar cita:', response.message);
        }
    } catch (error) {
        showMessage(addCitaMessage, 'Error de red o servidor al agendar cita.', false);
        console.error('[Profile Page] Error durante agendar cita:', error);
    }
}


function setupProfilePageListeners() {
    console.log('[Profile Page] Configurando listeners de la página de perfil...');
    const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
    const userType = sessionStorage.getItem('user_type') || localStorage.getItem('user_type');

    if (!userId || userType !== 'donante') {
        console.warn('[Profile Page] No hay ID de usuario o no es donante. Los listeners de perfil no se adjuntarán.');
        return;
    }

  

    // Adjuntar listener para el formulario de agendar nueva cita
    const formCita = document.getElementById('form-cita');
    if (formCita) {
        formCita.addEventListener('submit', handleAddCitaFormSubmit);
        console.log('[Profile Page] Listener para form-cita adjuntado.');
    } else {
        console.warn('[Profile Page] Formulario #form-cita no encontrado.');
    }

    // Adjuntar listener para el botón "Marcar todas como leídas"
    const btnMarcarTodasLeidas = document.getElementById('btn-marcar-todas-leidas');
    if (btnMarcarTodasLeidas) {
        btnMarcarTodasLeidas.addEventListener('click', async () => {
            console.log('[Profile Page] Intentando marcar todas las notificaciones como leídas...');
            // Considerar reemplazar confirm/alert con un modal personalizado para UX
            if (confirm('¿Estás seguro de que quieres marcar todas las notificaciones como leídas?')) {
                try {
                    const response = await callApi('mark_notif_read', 'POST', { user_id: parseInt(userId), mark_all: true });
                    alert(response.message);
                    loadNotificacionesDonante(userId);
                    console.log('[Profile Page] Todas las notificaciones marcadas como leídas.');
                } catch (e) {
                    console.error('Error al marcar todas como leídas:', e);
                    alert('Error al marcar todas como leídas.');
                }
            }
        });
        console.log('[Profile Page] Listener para marcar todas las notificaciones adjuntado.');
    } else {
        console.warn('[Profile Page] Botón #btn-marcar-todas-leidas no encontrado.');
    }

    // Cargar el perfil principal al inicio de la página
    loadDonanteProfile();
}


// --- admin.html (Panel de Administración) ---
async function loadAdminStats() {
    console.log('[Admin Page] Cargando estadísticas de administrador...');
    const adminStatsDiv = document.getElementById('admin-stats-overview');
    if (!adminStatsDiv) { console.log('[Admin Page] Elemento #admin-stats-overview no encontrado.'); return; }
    adminStatsDiv.innerHTML = '<p class="text-center text-gray-500">Cargando estadísticas...</p>';
    try {
        const data = await callApi('get_admin_stats');
        if (data.success) {
            adminStatsDiv.innerHTML = `
                <div class="stat-card bg-white p-6 rounded-lg shadow-md text-center">
                    <h3 class="text-xl font-semibold text-gray-700">Donantes Registrados</h3>
                    <p class="text-3xl font-bold text-red-600 mt-2">${data.data.total_donantes}</p>
                </div>
                <div class="stat-card bg-white p-6 rounded-lg shadow-md text-center">
                    <h3 class="text-xl font-semibold text-gray-700">Centros de Salud Activos</h3>
                    <p class="text-3xl font-bold text-red-600 mt-2">${data.data.total_centros}</p>
                </div>
                <div class="stat-card bg-white p-6 rounded-lg shadow-md text-center">
                    <h3>Citas Pendientes</h3>
                    <p class="text-3xl font-bold text-orange-500 mt-2">${data.data.citas_pendientes}</p>
                </div>
                <div class="stat-card bg-white p-6 rounded-lg shadow-md text-center">
                    <h3>Donaciones Aprobadas (Último mes)</h3>
                    <p class="text-3xl font-bold text-green-600 mt-2">${data.data.donaciones_aprobadas_mes}</p>
                </div>
            `;
            console.log('[Admin Page] Estadísticas cargadas exitosamente.');
        } else {
            adminStatsDiv.innerHTML = `<p class="text-red-500 text-center">Error al cargar estadísticas: ${data.message}</p>`;
            console.error('[Admin Page] Error API al cargar estadísticas:', data.message);
        }
    } catch (error) {
        adminStatsDiv.innerHTML = '<p class="text-red-500 text-center">Error de red al cargar estadísticas.</p>';
        console.error('[Admin Page] Error fatal al cargar estadísticas:', error);
    }
}

async function loadUserManagement() {
    console.log('[Admin Page] Cargando gestión de usuarios...');
    const userTableBody = document.getElementById('userTableBody');
    if (!userTableBody) { console.log('[Admin Page] Elemento #userTableBody no encontrado.'); return; }
    userTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">Cargando usuarios...</td></tr>';
    try {
        const data = await callApi('get_all_users');
        if (data.success && data.data.length > 0) {
            userTableBody.innerHTML = '';
            data.data.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.tipo}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <select class="estado-select bg-white border border-gray-300 rounded-md shadow-sm p-1" data-user-id="${user.id}">
                            <option value="activo" ${user.estado === 'activo' ? 'selected' : ''}>Activo</option>
                            <option value="inactivo" ${user.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
                            <option value="pendiente" ${user.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        </select>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(user.fecha_registro).toLocaleDateString()}</td>
                `;
                userTableBody.appendChild(tr);
            });
            userTableBody.querySelectorAll('.estado-select').forEach(select => {
                select.addEventListener('change', async (e) => {
                    const userId = e.target.dataset.userId;
                    const newStatus = e.target.value;
                    if (confirm(`¿Estás seguro de cambiar el estado del usuario ${userId} a ${newStatus}?`)) {
                        try {
                            const response = await callApi('update_user_status', 'POST', { user_id: parseInt(userId), estado: newStatus });
                            alert(response.message);
                            loadUserManagement();
                            console.log(`[Admin Page] Estado de usuario ${userId} actualizado a ${newStatus}.`);
                        } catch (err) {
                            console.error('Error al actualizar estado:', err);
                            alert('Error al actualizar estado.');
                        }
                    } else {
                        e.target.value = e.target.dataset.originalStatus;
                    }
                });
                select.dataset.originalStatus = select.value;
            });
            console.log('[Admin Page] Gestión de usuarios cargada exitosamente.');
        } else {
            userTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No se encontraron usuarios.</td></tr>';
            console.log('[Admin Page] No se encontraron usuarios para la gestión.');
        }
    } catch (error) {
        userTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-red-500">Error al cargar usuarios.</td></tr>';
        console.error('[Admin Page] Error al cargar gestión de usuarios:', error);
    }
}

async function loadContactMessages() {
    console.log('[Admin Page] Cargando mensajes de contacto...');
    const messagesTableBody = document.getElementById('messagesTableBody');
    if (!messagesTableBody) { console.log('[Admin Page] Elemento #messagesTableBody no encontrado.'); return; }
    messagesTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">Cargando mensajes...</td></tr>';
    try {
        const data = await callApi('get_contact_messages');
        if (data.success && data.data.length > 0) {
            messagesTableBody.innerHTML = '';
            data.data.forEach(msg => {
                const tr = document.createElement('tr');
                tr.className = msg.estado === 'nuevo' ? 'font-bold' : '';
                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${msg.nombre}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${msg.email}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${msg.mensaje}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(msg.fecha_envio).toLocaleString()}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${msg.estado === 'nuevo' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">${msg.estado}</span>
                        ${msg.estado === 'nuevo' ? `<button class="btn-mark-message-read ml-2 text-indigo-600 hover:text-indigo-900" data-message-id="${msg.id}">Marcar como leído</button>` : ''}
                    </td>
                `;
                messagesTableBody.appendChild(tr);
            });
            messagesTableBody.querySelectorAll('.btn-mark-message-read').forEach(button => {
                button.addEventListener('click', async () => {
                    const messageId = button.dataset.messageId;
                    try {
                        const response = await callApi('mark_contact_message_read', 'POST', { message_id: parseInt(messageId) });
                        alert(response.message);
                        loadContactMessages();
                        console.log(`[Admin Page] Mensaje ${messageId} marcado como leído.`);
                    } catch (e) {
                        console.error('Error al marcar mensaje como leído:', e);
                        alert('Error al marcar mensaje como leído.');
                    }
                });
            });
            console.log('[Admin Page] Mensajes de contacto cargados exitosamente.');
        } else {
            messagesTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No se encontraron mensajes de contacto.</td></tr>';
            console.log('[Admin Page] No se encontraron mensajes de contacto.');
        }
    } catch (error) {
        messagesTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-red-500">Error al cargar mensajes.</td></tr>';
        console.error('[Admin Page] Error al cargar mensajes de contacto:', error);
    }
}

function setupAdminPageListeners() {
    console.log('[Admin Page] Configurando listeners de la página de administrador...');
    window.mostrarAdminTab = function(tab) {
        console.log(`[Admin Page] Mostrando pestaña: ${tab}`);
        document.querySelectorAll('.admin-tab-content').forEach(t => {
            t.classList.remove('active');
            t.hidden = true;
        });
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.setAttribute('aria-selected', 'false');
            btn.classList.remove('bg-red-700', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        });

        const activeContent = document.getElementById(`admin-tab-${tab}`);
        if (activeContent) {
            activeContent.classList.add('active');
            activeContent.hidden = false;
        }
        const activeButton = document.querySelector(`.admin-tab-btn[onclick="mostrarAdminTab('${tab}')"]`);
        if (activeButton) {
            activeButton.setAttribute('aria-selected', 'true');
            activeButton.classList.remove('bg-gray-200', 'text-gray-700');
            activeButton.classList.add('bg-red-700', 'text-white');
        }

        // Cargar datos específicos al cambiar de pestaña
        if (tab === 'estadisticas') {
            loadAdminStats();
        } else if (tab === 'gestion-usuarios') {
            loadUserManagement();
        } else if (tab === 'mensajes') {
            loadContactMessages();
        }
    };

    if (document.getElementById('admin-tab-estadisticas')) {
        window.mostrarAdminTab('estadisticas'); // Carga la pestaña de estadísticas por defecto al cargar
    } else {
        console.warn('[Admin Page] Elemento #admin-tab-estadisticas no encontrado. No se inicializa la vista de admin.');
    }
}


// --- workspace_center.html (Gestión de Centro de Salud) ---
async function loadWorkspaceCenterData() {
    console.log('[Workspace Center] Iniciando carga de datos del centro de salud...');
    const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
    const userType = sessionStorage.getItem('user_type') || localStorage.getItem('user_type');

    if (!userId || userType !== 'centro_salud') {
        alert('Acceso denegado. Por favor, inicie sesión como centro de salud.');
        window.location.href = '../auth/login.html';
        console.warn('[Workspace Center] Acceso denegado: User ID o User Type incorrecto.', {userId, userType});
        return;
    }

    const centroSaludId = parseInt(userId);

    await loadCitasPendientesCentro(centroSaludId);
    await loadRecentDonationsCentro(centroSaludId);
    await loadInventarioCentro(centroSaludId);
    console.log('[Workspace Center] Carga inicial de datos completada.');
}

async function loadCitasPendientesCentro(centroSaludId) {
    console.log(`[Workspace Center] Cargando citas pendientes para centro ID: ${centroSaludId}`);
    const citasPendientesList = document.getElementById('citas-pendientes-list');
    if (!citasPendientesList) { console.log('[Workspace Center] Elemento #citas-pendientes-list no encontrado.'); return; }
    citasPendientesList.innerHTML = '<p class="text-gray-500">Cargando citas pendientes...</p>';

    try {
        const data = await callApi('get_citas_by_centro', 'GET', null, `centro_id=${centroSaludId}&estado=pendiente`);
        if (data.success && data.data.length > 0) {
            citasPendientesList.innerHTML = '';
            data.data.forEach(cita => {
                const li = document.createElement('li');
                li.className = 'border-b last:border-b-0 py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center';
                li.innerHTML = `
                    <span>
                        <strong>Fecha:</strong> ${new Date(cita.fecha_hora).toLocaleString()} -
                        <strong>Donante:</strong> ${cita.donante_nombre} (${cita.donante_tipo_sangre}) -
                        <strong>Notas:</strong> ${cita.notas || 'N/A'}
                    </span>
                    <div class="space-x-2 mt-2 sm:mt-0">
                        <button class="btn-custom-primary btn-confirmar-cita-centro" data-cita-id="${cita.id}">Confirmar Asistencia</button>
                        <button class="btn-custom-secondary btn-cancelar-cita-centro" data-cita-id="${cita.id}">Cancelar Cita</button>
                    </div>
                `;
                citasPendientesList.appendChild(li);
            });
            citasPendientesList.querySelectorAll('.btn-confirmar-cita-centro').forEach(button => {
                button.addEventListener('click', async () => {
                    const citaId = button.dataset.citaId;
                    try {
                        const response = await callApi('confirm_cita', 'POST', { cita_id: parseInt(citaId) });
                        alert(response.message);
                        loadCitasPendientesCentro(centroSaludId);
                        console.log(`[Workspace Center] Cita ${citaId} confirmada.`);
                    } catch (e) { console.error('Error al confirmar asistencia:', e); alert('Error al confirmar asistencia.'); }
                });
            });
            citasPendientesList.querySelectorAll('.btn-cancelar-cita-centro').forEach(button => {
                button.addEventListener('click', async () => {
                    const citaId = button.dataset.citaId;
                    try {
                        const response = await callApi('cancel_cita', 'POST', { cita_id: parseInt(citaId) });
                        alert(response.message);
                        loadCitasPendientesCentro(centroSaludId);
                        console.log(`[Workspace Center] Cita ${citaId} cancelada.`);
                    } catch (e) { console.error('Error al cancelar cita:', e); alert('Error al cancelar cita.'); }
                });
            });
            console.log('[Workspace Center] Citas pendientes cargadas exitosamente.');
        } else {
            citasPendientesList.innerHTML = '<p class="text-gray-500">No hay citas pendientes para este centro.</p>';
            console.log('[Workspace Center] No se encontraron citas pendientes.');
        }
    } catch (error) {
        citasPendientesList.innerHTML = '<p class="text-red-500">Error al cargar citas pendientes.</p>';
        console.error('[Workspace Center] Error al cargar citas pendientes:', error);
    }
}

async function loadRecentDonationsCentro(centroSaludId) {
    console.log(`[Workspace Center] Cargando donaciones recientes para centro ID: ${centroSaludId}`);
    const donacionesRecientesList = document.getElementById('donaciones-recientes-list');
    if (!donacionesRecientesList) { console.log('[Workspace Center] Elemento #donaciones-recientes-list no encontrado.'); return; }
    donacionesRecientesList.innerHTML = '<p class="text-gray-500">Cargando donaciones recientes...</p>';

    try {
        const data = await callApi('get_donaciones_by_centro', 'GET', null, `centro_id=${centroSaludId}`);
        if (data.success && data.data.length > 0) {
            donacionesRecientesList.innerHTML = '';
            data.data.forEach(donacion => {
                const li = document.createElement('li');
                li.className = 'border-b last:border-b-0 py-2';
                li.innerHTML = `
                    <span>
                        <strong>Fecha:</strong> ${new Date(donacion.fecha).toLocaleDateString()} -
                        <strong>Donante:</strong> ${donacion.donante_nombre} (${donacion.donante_tipo_sangre}) -
                        <strong>Volumen:</strong> ${donacion.volumen_ml}ml -
                        <strong>Resultado:</strong> ${donacion.resultado}
                    </span>
                `;
                donacionesRecientesList.appendChild(li);
            });
            console.log('[Workspace Center] Donaciones recientes cargadas exitosamente.');
        } else {
            donacionesRecientesList.innerHTML = '<p class="text-gray-500">No hay donaciones recientes para este centro.</p>';
            console.log('[Workspace Center] No se encontraron donaciones recientes.');
        }
    } catch (error) {
        donacionesRecientesList.innerHTML = '<p class="text-red-500">Error al cargar donaciones recientes.</p>';
        console.error('[Workspace Center] Error al cargar donaciones recientes:', error);
    }
}

async function loadInventarioCentro(centroSaludId) {
    console.log(`[Workspace Center] Cargando inventario para centro ID: ${centroSaludId}`);
    const inventarioTableBody = document.getElementById('inventario-table-body');
    if (!inventarioTableBody) { console.log('[Workspace Center] Elemento #inventario-table-body no encontrado.'); return; }
    inventarioTableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-gray-500">Cargando inventario...</td></tr>';

    try {
        const data = await callApi('get_inventario', 'GET', null, `centro_id=${centroSaludId}`);
        if (data.success && data.data.length > 0) {
            inventarioTableBody.innerHTML = '';
            data.data.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.tipo_sangre}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <input type="number" class="w-24 px-2 py-1 border rounded-md" value="${item.cantidad_unidades}" data-tipo-sangre="${item.tipo_sangre}">
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(item.ultima_actualizacion).toLocaleDateString()}</td>
                `;
                inventarioTableBody.appendChild(tr);
            });

            inventarioTableBody.querySelectorAll('input[type="number"]').forEach(input => {
                input.addEventListener('change', async (e) => {
                    const tipoSangre = e.target.dataset.tipoSangre;
                    const newCantidad = parseInt(e.target.value);
                    if (newCantidad < 0) {
                        alert('La cantidad no puede ser negativa.');
                        e.target.value = e.target.defaultValue;
                        return;
                    }
                    if (confirm(`¿Actualizar ${tipoSangre} a ${newCantidad} unidades?`)) {
                        try {
                            const response = await callApi('update_inventario', 'POST', {
                                centro_salud_id: parseInt(centroSaludId),
                                tipo_sangre: tipoSangre,
                                cantidad_unidades: newCantidad
                            });
                            alert(response.message);
                            loadInventarioCentro(centroSaludId);
                            console.log(`[Workspace Center] Inventario ${tipoSangre} actualizado a ${newCantidad}.`);
                        } catch (err) {
                            console.error('Error al actualizar inventario:', err);
                            alert('Error al actualizar inventario.');
                        }
                    } else {
                        e.target.value = e.target.defaultValue;
                    }
                });
                input.defaultValue = input.value;
            });
            console.log('[Workspace Center] Inventario cargado exitosamente.');
        } else {
            inventarioTableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-gray-500">No se encontró inventario para este centro.</td></tr>';
            console.log('[Workspace Center] No se encontró inventario.');
        }
    } catch (error) {
        inventarioTableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-red-500">Error al cargar inventario.</td></tr>';
        console.error('[Workspace Center] Error al cargar inventario:', error);
    }
}

// --- Listeners Generales (para todas las páginas que carguen main.js) ---
document.addEventListener('DOMContentLoaded', () => {
    // NUEVO: Log para ver la ruta exacta al inicio
    const currentPathname = window.location.pathname;
    console.log(`[DOMContentLoaded] Ruta actual detectada: ${currentPathname}`);

    // Simplified checks for page paths
    if (currentPathname.includes('index.html')) {
        cargarDonantesIndex();
        cargarCentrosSaludIndex();
    } else if (currentPathname.includes('login.html')) {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLoginFormSubmit);
            console.log('[DOMContentLoaded] Listener para login-form adjuntado.');
        } else {
            console.warn('[DOMContentLoaded] Formulario #login-form no encontrado.');
        }
    } else if (currentPathname.includes('register.html')) {
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', handleRegisterFormSubmit);
            console.log('[DOMContentLoaded] Listener para register-form adjuntado.');
        } else {
            console.warn('[DOMContentLoaded] Formulario #register-form no encontrado.');
        }
    } else if (currentPathname.includes('contact.html')) {
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', handleContactFormSubmit);
            console.log('[DOMContentLoaded] Listener para contact-form adjuntado.');
        } else {
            console.warn('[DOMContentLoaded] Formulario #contact-form no encontrado.');
        }
    } else if (currentPathname.includes('faq.html')) {
        loadFaqs();
    } else if (currentPathname.includes('profile.html')) {
        // Esto debería activarse para sections/donor/profile.html
        setupProfilePageListeners();
        console.log('[DOMContentLoaded] setupProfilePageListeners llamado para profile.html.');
    } else if (currentPathname.includes('admin.html')) {
        setupAdminPageListeners();
        console.log('[DOMContentLoaded] setupAdminPageListeners llamado para admin.html.');
    } else if (currentPathname.includes('workspace_center.html')) {
        loadWorkspaceCenterData();

        const addDonationForm = document.getElementById('add-donation-form');
        if (addDonationForm) {
            addDonationForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                console.log('[Workspace Center] Intentando añadir donación...');
                const form = event.target;
                const messageDisplay = document.getElementById('addDonationMessage');
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                data.centro_salud_id = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');

                showMessage(messageDisplay, 'Agregando resultado de donación...', null);
                try {
                    const response = await callApi('add_donacion_result', 'POST', data);
                    showMessage(messageDisplay, response.message, response.success);
                    if (response.success) {
                        form.reset();
                        loadRecentDonationsCentro(data.centro_salud_id);
                        console.log('[Workspace Center] Donación añadida exitosamente.');
                    }
                } catch (error) {
                    showMessage(messageDisplay, 'Error al agregar donación. Inténtalo de nuevo.', false);
                    console.error('[Workspace Center] Error al añadir donación:', error);
                }
            });
            console.log('[DOMContentLoaded] Listener para add-donation-form adjuntado.');
        } else {
            console.warn('[DOMContentLoaded] Formulario #add-donation-form no encontrado.');
        }

        const sendNotificationForm = document.getElementById('send-notification-form');
        if (sendNotificationForm) {
            sendNotificationForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                console.log('[Workspace Center] Intentando enviar notificación...');
                const form = event.target;
                const messageDisplay = document.getElementById('sendNotificationMessage');
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());

                showMessage(messageDisplay, 'Enviando notificación...', null);
                try {
                    const response = await callApi('send_notification', 'POST', data);
                    showMessage(messageDisplay, response.message, response.success);
                    if (response.success) {
                        form.reset();
                        console.log('[Workspace Center] Notificación enviada exitosamente.');
                    }
                } catch (error) {
                    showMessage(messageDisplay, 'Error al enviar notificación. Inténtalo de nuevo.', false);
                    console.error('[Workspace Center] Error al enviar notificación:', error);
                }
            });
            console.log('[DOMContentLoaded] Listener para send-notification-form adjuntado.');
        } else {
            console.warn('[DOMContentLoaded] Formulario #send-notification-form no encontrado.');
        }
    } else {
        console.log('[DOMContentLoaded] No hay lógica específica para esta página.');
    }
});

