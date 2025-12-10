// frontend/js/js-perfiles/dashboard-recepcionista.js - VERSIÓN COMPLETA
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DASHBOARD RECEPCIONISTA INICIANDO ===');
    console.log('URL:', window.location.href);
    console.log('Pathname:', window.location.pathname);
    
    // 1. VERIFICAR SESIÓN
    const userData = localStorage.getItem('user');
    
    if (!userData) {
        console.log('❌ No hay sesión activa, redirigiendo a login');
        window.location.href = '/login';
        return;
    }
    
    // 2. PARSEAR DATOS DEL USUARIO
    let user;
    try {
        user = JSON.parse(userData);
        console.log('✅ Usuario encontrado:', user);
    } catch (error) {
        console.error('❌ Error al parsear datos del usuario:', error);
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
    }
    
    // 3. VERIFICAR ROL
    if (user.rol !== 'recepcionista') {
        console.log(`❌ Acceso denegado. Rol: ${user.rol}, se requiere: recepcionista`);
        alert('No tienes permiso para acceder a esta página');
        window.location.href = '/';
        return;
    }
    
    // 4. CARGAR DASHBOARD
    console.log('📊 Cargando dashboard para recepcionista:', user.nombre);
    cargarDashboard(user);
    
    // 5. CONFIGURAR EVENT LISTENERS
    configurarEventListeners(user);
});

// ===== FUNCIÓN PRINCIPAL =====
function cargarDashboard(usuario) {
    console.log('🎨 Renderizando dashboard recepcionista...');
    
    // 1. Actualizar información del usuario
    actualizarInfoUsuario(usuario);
    
    // 2. Configurar fecha y hora
    configurarFechaHora();
    
    // 3. Cargar calendario
    inicializarCalendario();
    
    // 4. Cargar citas de hoy
    cargarCitasHoy();
    
    // 5. Configurar búsqueda de usuarios
    configurarBusquedaUsuarios();
    
    console.log('✅ Dashboard recepcionista cargado exitosamente');
}

// ===== FUNCIONES DE RENDERIZADO =====

function actualizarInfoUsuario(usuario) {
    // Actualizar saludo
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = usuario.nombre || 'Recepcionista';
    }
    
    // Actualizar estadísticas (simuladas por ahora)
    actualizarEstadisticas();
}

function configurarFechaHora() {
    const datetimeElement = document.getElementById('current-datetime');
    if (!datetimeElement) return;
    
    function actualizar() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        
        datetimeElement.textContent = now.toLocaleDateString('es-ES', options);
    }
    
    // Actualizar inmediatamente y cada minuto
    actualizar();
    setInterval(actualizar, 60000);
}

function actualizarEstadisticas() {
    // Simular estadísticas
    const todayAppointments = document.getElementById('today-appointments');
    const pendingAppointments = document.getElementById('pending-appointments');
    
    if (todayAppointments) todayAppointments.textContent = '3';
    if (pendingAppointments) pendingAppointments.textContent = '5';
}

function inicializarCalendario() {
    console.log('📅 Inicializando calendario...');
    
    const calendarTitle = document.getElementById('calendar-month');
    const calendarGrid = document.getElementById('calendar-grid');
    
    if (!calendarTitle || !calendarGrid) {
        console.log('⚠️  Elementos del calendario no encontrados');
        return;
    }
    
    // Fecha actual
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Actualizar título
    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    calendarTitle.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    // Generar calendario básico
    calendarGrid.innerHTML = `
        <div class="calendar-day-header">Lun</div>
        <div class="calendar-day-header">Mar</div>
        <div class="calendar-day-header">Mié</div>
        <div class="calendar-day-header">Jue</div>
        <div class="calendar-day-header">Vie</div>
        <div class="calendar-day-header">Sáb</div>
        <div class="calendar-day-header">Dom</div>
        
        ${Array.from({length: 31}, (_, i) => {
            const day = i + 1;
            const hasAppointment = day % 5 === 0; // Simular citas
            return `
                <div class="calendar-day ${hasAppointment ? 'has-appointment' : ''}">
                    ${day}
                    ${hasAppointment ? '<span class="appointment-dot"></span>' : ''}
                </div>
            `;
        }).join('')}
    `;
    
    console.log('✅ Calendario inicializado');
}

function cargarCitasHoy() {
    const appointmentsList = document.getElementById('today-appointments-list');
    if (!appointmentsList) return;
    
    // Simular citas de hoy
    const citasHoy = [
        { hora: '09:00', paciente: 'Firulais', propietario: 'Juan Pérez', motivo: 'Vacunación' },
        { hora: '11:30', paciente: 'Mishi', propietario: 'María García', motivo: 'Control general' },
        { hora: '15:00', paciente: 'Rex', propietario: 'Carlos López', motivo: 'Chequeo dental' }
    ];
    
    if (citasHoy.length > 0) {
        appointmentsList.innerHTML = citasHoy.map(cita => `
            <div class="appointment-item">
                <div class="appointment-time">${cita.hora}</div>
                <div class="appointment-details">
                    <h4>${cita.paciente}</h4>
                    <p>Propietario: ${cita.propietario}</p>
                    <p>Motivo: ${cita.motivo}</p>
                </div>
            </div>
        `).join('');
    } else {
        appointmentsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <h3 class="empty-title">No hay citas programadas para hoy</h3>
                <p class="empty-description">Puedes agendar nuevas citas o revisar citas futuras en el calendario.</p>
            </div>
        `;
    }
}

function configurarBusquedaUsuarios() {
    const searchInput = document.getElementById('user-search');
    const searchBtn = document.querySelector('.search-btn');
    const usersResults = document.getElementById('users-results');
    
    if (!searchInput || !usersResults) return;
    
    // Simular resultados de búsqueda
    const usuariosEjemplo = [
        { id: 1, nombre: 'Juan Pérez', telefono: '555-1234', email: 'juan@email.com', mascotas: 2 },
        { id: 2, nombre: 'María García', telefono: '555-5678', email: 'maria@email.com', mascotas: 1 },
        { id: 3, nombre: 'Carlos López', telefono: '555-9012', email: 'carlos@email.com', mascotas: 3 }
    ];
    
    function mostrarResultados(usuarios) {
        if (usuarios.length > 0) {
            usersResults.innerHTML = usuarios.map(usuario => `
                <div class="user-result">
                    <div class="user-info">
                        <h4>${usuario.nombre}</h4>
                        <p>Teléfono: ${usuario.telefono}</p>
                        <p>Email: ${usuario.email}</p>
                        <p>Mascotas: ${usuario.mascotas}</p>
                    </div>
                    <div class="user-actions">
                        <button class="btn btn-outline view-user-btn" data-user-id="${usuario.id}">Ver</button>
                        <button class="btn btn-outline schedule-for-user-btn" data-user-id="${usuario.id}">Agendar cita</button>
                    </div>
                </div>
            `).join('');
        } else {
            usersResults.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <h3 class="empty-title">No se encontraron usuarios</h3>
                    <p class="empty-description">Utiliza el buscador para encontrar propietarios o regístralos nuevos.</p>
                </div>
            `;
        }
    }
    
    // Mostrar usuarios de ejemplo inicialmente
    mostrarResultados(usuariosEjemplo);
    
    // Configurar búsqueda
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const query = searchInput.value.trim().toLowerCase();
            if (query) {
                const resultados = usuariosEjemplo.filter(user => 
                    user.nombre.toLowerCase().includes(query) ||
                    user.telefono.includes(query)
                );
                mostrarResultados(resultados);
                console.log(`🔍 Búsqueda: "${query}" - ${resultados.length} resultados`);
            }
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }
}

// ===== CONFIGURACIÓN DE EVENT LISTENERS =====
function configurarEventListeners(usuario) {
    console.log('🔧 Configurando event listeners para recepcionista...');
    
    // 1. Botón de cerrar sesión
    configurarLogoutButtons();
    
    // 2. Botón "Agendar nueva cita"
    const scheduleBtn = document.getElementById('schedule-appointment-btn');
    if (scheduleBtn) {
        scheduleBtn.addEventListener('click', function() {
            console.log('📅 Abriendo modal para agendar cita');
            mostrarModalAgendarCita();
        });
    }
    
    // 3. Botón "Registrar nuevo usuario"
    const registerBtn = document.getElementById('register-user-btn');
    if (registerBtn) {
        registerBtn.addEventListener('click', function() {
            console.log('👤 Abriendo modal para registrar usuario');
            mostrarModalRegistrarUsuario();
        });
    }
    
    // 4. Navegación del calendario
    const prevBtn = document.querySelector('.calendar-prev');
    const nextBtn = document.querySelector('.calendar-next');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            console.log('◀️  Calendario: mes anterior');
            alert('Navegación del calendario - En desarrollo');
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            console.log('▶️  Calendario: mes siguiente');
            alert('Navegación del calendario - En desarrollo');
        });
    }
    
    console.log('✅ Event listeners configurados para recepcionista');
}

function configurarLogoutButtons() {
    const logoutLinks = document.querySelectorAll('a[href="/login"]');
    
    logoutLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            console.log('👋 Cerrar sesión solicitado');
            
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        });
    });
    
    console.log(`🔐 ${logoutLinks.length} botones de logout configurados`);
}

// ===== FUNCIONES DE MODALES =====

function mostrarModalAgendarCita() {
    const modal = document.getElementById('schedule-appointment-modal');
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        
        // Configurar formulario
        const form = document.getElementById('appointment-form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log('📤 Formulario de cita enviado');
                alert('Cita agendada exitosamente (simulación)');
                modal.classList.remove('active');
                modal.setAttribute('aria-hidden', 'true');
            });
        }
    } else {
        alert('Modal de agendar cita - En desarrollo');
    }
}

function mostrarModalRegistrarUsuario() {
    const modal = document.getElementById('register-user-modal');
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        
        // Configurar formulario
        const form = document.getElementById('user-register-form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log('📤 Formulario de registro de usuario enviado');
                alert('Usuario registrado exitosamente (simulación)');
                modal.classList.remove('active');
                modal.setAttribute('aria-hidden', 'true');
            });
        }
    } else {
        alert('Modal de registrar usuario - En desarrollo');
    }
}

// ===== INICIALIZACIÓN FINAL =====
console.log('✅ dashboard-recepcionista.js cargado completamente');