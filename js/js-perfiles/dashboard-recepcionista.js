// ../../js/dashboard-recepcionista.js (versión conectable con Node.js)
document.addEventListener('DOMContentLoaded', async function() {
    // 1. Verificar sesión y obtener datos del usuario
    try {
        const currentUser = await obtenerDatosUsuario();
        if (!currentUser || currentUser.role !== 'recepcionista') {
            window.location.href = '../inicio-sesion.html';
            return;
        }
        
        // 2. Cargar todos los datos del dashboard
        await cargarDashboard(currentUser);
        
    } catch (error) {
        console.error('Error al cargar el dashboard:', error);
        mostrarError('No se pudo cargar tu información. Por favor, intenta nuevamente.');
        setTimeout(() => {
            window.location.href = '../inicio-sesion.html';
        }, 3000);
    }
});

// ===== FUNCIONES PRINCIPALES =====

// Obtener datos del usuario autenticado desde Node.js
async function obtenerDatosUsuario() {
    try {
        const response = await fetch('/api/usuario/logueado', {
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Sesión no válida');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        return null;
    }
}

// Cargar todos los componentes del dashboard
async function cargarDashboard(usuario) {
    // Actualizar saludo con nombre real
    document.getElementById('user-name').textContent = usuario.nombres;
    
    // Actualizar fecha y hora
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 60000);
    
    // Cargar calendario
    inicializarCalendario();
    
    // Cargar contadores clave
    await cargarContadores();
    
    // Cargar citas de hoy
    await cargarCitasHoy();
    
    // Configurar event listeners
    configurarEventListeners();
}

// ===== FUNCIONES DE CALENDARIO =====

function inicializarCalendario() {
    const now = new Date();
    let mesActual = now.getMonth();
    let añoActual = now.getFullYear();
    
    function renderizarCalendario(mes, año) {
        const calendarGrid = document.getElementById('calendar-grid');
        calendarGrid.innerHTML = '';
        
        // Encabezados de días
        const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        diasSemana.forEach(dia => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = dia;
            calendarGrid.appendChild(header);
        });
        
        // Obtener primer día del mes y número de días
        const primerDia = new Date(año, mes, 1).getDay();
        const ultimoDia = new Date(año, mes + 1, 0).getDate();
        
        // Rellenar días vacíos al inicio
        for (let i = 0; i < primerDia; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day';
            calendarGrid.appendChild(emptyDay);
        }
        
        // Rellenar días del mes
        const hoy = new Date();
        for (let dia = 1; dia <= ultimoDia; dia++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            if (dia === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear()) {
                dayElement.classList.add('today');
            }
            
            // Simular días con citas para demostración
            if ((dia % 3 === 0 || dia % 5 === 0) && mes === hoy.getMonth()) {
                dayElement.classList.add('has-appointments');
            }
            
            dayElement.innerHTML = `<span class="calendar-day-number">${dia}</span>`;
            dayElement.addEventListener('click', () => verCitasDia(dia, mes, año));
            calendarGrid.appendChild(dayElement);
        }
        
        // Actualizar título del mes
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        document.getElementById('calendar-month').textContent = `${meses[mes]} ${año}`;
    }
    
    // Renderizar mes actual
    renderizarCalendario(mesActual, añoActual);
    
    // Event listeners para navegación de calendario
    document.querySelector('.calendar-prev').addEventListener('click', () => {
        mesActual = (mesActual - 1 + 12) % 12;
        if (mesActual === 11) añoActual--;
        renderizarCalendario(mesActual, añoActual);
    });
    
    document.querySelector('.calendar-next').addEventListener('click', () => {
        mesActual = (mesActual + 1) % 12;
        if (mesActual === 0) añoActual++;
        renderizarCalendario(mesActual, añoActual);
    });
}

// ===== CARGA DE DATOS =====

async function cargarContadores() {
    try {
        // Placeholder para endpoints reales
        const responseHoy = await fetch('/api/citas/hoy', {
            headers: { 'Authorization': `Bearer ${obtenerToken()}` }
        });
        
        const responsePendientes = await fetch('/api/citas/pendientes', {
            headers: { 'Authorization': `Bearer ${obtenerToken()}` }
        });
        
        if (!responseHoy.ok || !responsePendientes.ok) throw new Error('Error al cargar contadores');
        
        const citasHoy = await responseHoy.json();
        const citasPendientes = await responsePendientes.json();
        
        document.getElementById('today-appointments').textContent = citasHoy.length;
        document.getElementById('pending-appointments').textContent = citasPendientes.length;
        
    } catch (error) {
        console.error('Error al cargar contadores:', error);
        // Mantener valores por defecto (0) en caso de error
    }
}

async function cargarCitasHoy() {
    const appointmentsList = document.getElementById('today-appointments-list');
    
    try {
        // Placeholder para endpoint real
        const response = await fetch('/api/citas/hoy/detallado', {
            headers: { 'Authorization': `Bearer ${obtenerToken()}` }
        });
        
        if (!response.ok) throw new Error('Error al cargar citas de hoy');
        
        const citas = await response.json();
        
        if (citas.length > 0) {
            renderizarCitasHoy(citas);
        } else {
            appointmentsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📅</div>
                    <h3 class="empty-title">No hay citas programadas para hoy</h3>
                    <p class="empty-description">Puedes agendar nuevas citas o revisar citas futuras en el calendario.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al cargar citas de hoy:', error);
        appointmentsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3 class="empty-title">Error al cargar citas</h3>
                <p class="empty-description">No se pudieron cargar las citas de hoy. Intenta nuevamente más tarde.</p>
                <button class="btn btn-secondary retry-citas-btn">Reintentar</button>
            </div>
        `;
        
        document.querySelector('.retry-citas-btn').addEventListener('click', () => {
            cargarCitasHoy();
        });
    }
}

function renderizarCitasHoy(citas) {
    const appointmentsList = document.getElementById('today-appointments-list');
    appointmentsList.innerHTML = '';
    
    citas.forEach(cita => {
        const appointmentItem = document.createElement('div');
        appointmentItem.className = 'appointment-item';
        appointmentItem.innerHTML = `
            <div class="appointment-header">
                <span class="appointment-time">${cita.hora}</span>
                <span class="appointment-owner">${cita.propietario.nombres} ${cita.propietario.apellidos}</span>
            </div>
            <div class="appointment-details">
                <div class="appointment-pet">🐾 ${cita.mascota.nombre} (${cita.mascota.especie})</div>
                <div class="appointment-vet">👩‍⚕️ ${cita.veterinario.nombres}</div>
                <div class="appointment-reason">${cita.motivo}</div>
            </div>
            <div class="appointment-actions">
                <button class="btn btn-outline modify-btn" data-cita-id="${cita.id}">Modificar</button>
                <button class="btn btn-outline cancel-btn" data-cita-id="${cita.id}">Cancelar</button>
                <button class="btn btn-primary confirm-btn" data-cita-id="${cita.id}">Confirmar</button>
            </div>
        `;
        appointmentsList.appendChild(appointmentItem);
    });
    
    // Event listeners para los botones
    document.querySelectorAll('.modify-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const citaId = this.getAttribute('data-cita-id');
            abrirModalModificarCita(citaId);
        });
    });
    
    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const citaId = this.getAttribute('data-cita-id');
            confirmarCancelarCita(citaId);
        });
    });
    
    document.querySelectorAll('.confirm-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const citaId = this.getAttribute('data-cita-id');
            confirmarAsistencia(citaId);
        });
    });
}

// ===== GESTIÓN DE USUARIOS =====

async function buscarPropietarios(termino) {
    if (!termino || termino.length < 2) {
        document.getElementById('owner-search-results').style.display = 'none';
        return;
    }
    
    try {
        // Placeholder para endpoint real
        const response = await fetch(`/api/usuarios/buscar?termino=${encodeURIComponent(termino)}`, {
            headers: { 'Authorization': `Bearer ${obtenerToken()}` }
        });
        
        if (!response.ok) throw new Error('Error al buscar propietarios');
        
        const propietarios = await response.json();
        mostrarResultadosBusqueda(propietarios);
        
    } catch (error) {
        console.error('Error al buscar propietarios:', error);
        mostrarResultadosBusqueda([]);
    }
}

function mostrarResultadosBusqueda(propietarios) {
    const resultsContainer = document.getElementById('owner-search-results');
    resultsContainer.innerHTML = '';
    
    if (propietarios.length === 0) {
        resultsContainer.style.display = 'none';
        return;
    }
    
    propietarios.forEach(propietario => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.innerHTML = `
            <strong>${propietario.nombres} ${propietario.apellidos}</strong><br>
            <small>${propietario.telefono} • ${propietario.email}</small>
        `;
        resultItem.dataset.id = propietario.id;
        resultItem.dataset.nombre = `${propietario.nombres} ${propietario.apellidos}`;
        
        resultItem.addEventListener('click', function() {
            seleccionarPropietario(propietario);
        });
        
        resultsContainer.appendChild(resultItem);
    });
    
    resultsContainer.style.display = 'block';
}

function seleccionarPropietario(propietario) {
    document.getElementById('owner-search').value = `${propietario.nombres} ${propietario.apellidos}`;
    document.getElementById('selected-owner-id').value = propietario.id;
    document.getElementById('owner-search-results').style.display = 'none';
    
    // Cargar mascotas del propietario
    cargarMascotasPropietario(propietario.id);
}

async function cargarMascotasPropietario(propietarioId) {
    const petSelect = document.getElementById('pet-select');
    petSelect.innerHTML = '<option value="">Seleccione una mascota</option>';
    petSelect.disabled = true;
    
    if (!propietarioId) return;
    
    try {
        // Placeholder para endpoint real
        const response = await fetch(`/api/mascotas/propietario/${propietarioId}`, {
            headers: { 'Authorization': `Bearer ${obtenerToken()}` }
        });
        
        if (!response.ok) throw new Error('Error al cargar mascotas');
        
        const mascotas = await response.json();
        
        if (mascotas.length > 0) {
            mascotas.forEach(mascota => {
                const option = document.createElement('option');
                option.value = mascota.id;
                option.textContent = `${mascota.nombre} (${mascota.especie})`;
                petSelect.appendChild(option);
            });
            petSelect.disabled = false;
        } else {
            petSelect.disabled = true;
            // Mostrar opción para agregar nueva mascota
            const option = document.createElement('option');
            option.value = 'nueva';
            option.textContent = 'Registrar nueva mascota';
            petSelect.appendChild(option);
            petSelect.disabled = false;
        }
        
    } catch (error) {
        console.error('Error al cargar mascotas:', error);
        petSelect.disabled = true;
    }
}

// ===== FUNCIONES DE UTILIDAD =====

function actualizarFechaHora() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    document.getElementById('current-datetime').textContent = now.toLocaleDateString('es-ES', options);
}

function obtenerToken() {
    return sessionStorage.getItem('authToken') || null;
}

function mostrarError(mensaje) {
    console.error('Error:', mensaje);
    alert(`Error: ${mensaje}`);
}

function verCitasDia(dia, mes, año) {
    alert(`En la implementación real, esto mostraría las citas para el ${dia}/${mes + 1}/${año}`);
}

function abrirModalModificarCita(citaId) {
    alert(`En la implementación real, esto abriría un modal para modificar la cita con ID: ${citaId}`);
}

function confirmarCancelarCita(citaId) {
    if (confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
        alert(`En la implementación real, esto cancelaría la cita con ID: ${citaId}`);
    }
}

function confirmarAsistencia(citaId) {
    alert(`En la implementación real, esto confirmaría la asistencia para la cita con ID: ${citaId}`);
}

// ===== EVENT LISTENERS =====

function configurarEventListeners() {
    // Búsqueda de propietarios
    const ownerSearch = document.getElementById('owner-search');
    let searchTimeout;
    
    ownerSearch.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            buscarPropietarios(this.value.trim());
        }, 300);
    });
    
    // Click fuera de los resultados de búsqueda
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-box')) {
            document.getElementById('owner-search-results').style.display = 'none';
        }
    });
    
    // Búsqueda general de usuarios
    const userSearch = document.getElementById('user-search');
    let userSearchTimeout;
    
    userSearch.addEventListener('input', function() {
        clearTimeout(userSearchTimeout);
        userSearchTimeout = setTimeout(() => {
            buscarUsuarios(this.value.trim());
        }, 300);
    });
    
    // Botones de acciones
    document.getElementById('schedule-appointment-btn').addEventListener('click', function() {
        const modal = document.getElementById('schedule-appointment-modal');
        modal.setAttribute('aria-hidden', 'false');
        modal.classList.add('active');
    });
    
    document.getElementById('register-user-btn').addEventListener('click', function() {
        const modal = document.getElementById('register-user-modal');
        modal.setAttribute('aria-hidden', 'false');
        modal.classList.add('active');
    });
    
    // Cerrar modales
    document.getElementById('close-schedule-modal').addEventListener('click', function() {
        document.getElementById('schedule-appointment-modal').classList.remove('active');
        document.getElementById('schedule-appointment-modal').setAttribute('aria-hidden', 'true');
    });
    
    document.getElementById('close-register-modal').addEventListener('click', function() {
        document.getElementById('register-user-modal').classList.remove('active');
        document.getElementById('register-user-modal').setAttribute('aria-hidden', 'true');
    });
    
    // Cerrar modales al hacer clic fuera
    document.getElementById('schedule-appointment-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
            this.setAttribute('aria-hidden', 'true');
        }
    });
    
    document.getElementById('register-user-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
            this.setAttribute('aria-hidden', 'true');
        }
    });
}

// ===== FUNCIONES DE BÚSQUEDA =====

async function buscarUsuarios(termino) {
    const resultsContainer = document.getElementById('users-results');
    
    if (!termino || termino.length < 2) {
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <h3 class="empty-title">No se encontraron usuarios</h3>
                <p class="empty-description">Utiliza el buscador para encontrar propietarios o regístralos nuevos.</p>
            </div>
        `;
        return;
    }
    
    try {
        // Placeholder para endpoint real
        const response = await fetch(`/api/usuarios/busqueda-general?termino=${encodeURIComponent(termino)}`, {
            headers: { 'Authorization': `Bearer ${obtenerToken()}` }
        });
        
        if (!response.ok) throw new Error('Error al buscar usuarios');
        
        const usuarios = await response.json();
        
        if (usuarios.length > 0) {
            renderizarResultadosUsuarios(usuarios);
        } else {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3 class="empty-title">No se encontraron resultados</h3>
                    <p class="empty-description">No hay usuarios que coincidan con "${termino}". Intenta con otro término de búsqueda.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al buscar usuarios:', error);
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3 class="empty-title">Error al buscar</h3>
                <p class="empty-description">No se pudieron cargar los resultados. Intenta nuevamente más tarde.</p>
            </div>
        `;
    }
}

function renderizarResultadosUsuarios(usuarios) {
    const resultsContainer = document.getElementById('users-results');
    resultsContainer.innerHTML = '';
    
    usuarios.forEach(usuario => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.innerHTML = `
            <div class="user-name">${usuario.nombres} ${usuario.apellidos}</div>
            <div class="user-contact">📱 ${usuario.telefono} • ✉️ ${usuario.email}</div>
            <div class="user-pets">
                Mascotas: 
                ${usuario.mascotas && usuario.mascotas.length > 0 
                    ? usuario.mascotas.map(m => `<span class="pet-badge">${m.nombre}</span>`).join('') 
                    : '<span class="pet-badge">Sin mascotas</span>'
                }
            </div>
            <div class="user-actions">
                <button class="btn btn-outline view-profile-btn" data-user-id="${usuario.id}">Ver perfil completo</button>
                <button class="btn btn-primary edit-user-btn" data-user-id="${usuario.id}">Editar</button>
            </div>
        `;
        resultsContainer.appendChild(userCard);
    });
    
    // Event listeners para los botones
    document.querySelectorAll('.view-profile-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            verPerfilCompleto(userId);
        });
    });
    
    document.querySelectorAll('.edit-user-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            abrirModalEditarUsuario(userId);
        });
    });
}

function verPerfilCompleto(userId) {
    alert(`En la implementación real, esto mostraría el perfil completo del usuario con ID: ${userId}`);
}

function abrirModalEditarUsuario(userId) {
    alert(`En la implementación real, esto abriría un modal para editar el usuario con ID: ${userId}`);
}

console.log('Dashboard recepcionista inicializado - listo para conexión con Node.js');