// frontend/js/js-perfiles/dashboard-propietario.js
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== DASHBOARD PROPIETARIO INICIANDO ===');
    
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
        console.log('📌 ID del propietario:', user.id);
    } catch (error) {
        console.error('❌ Error al parsear datos del usuario:', error);
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
    }
    
    // 3. VERIFICAR ROL
    if (user.rol !== 'propietario') {
        console.log(`❌ Acceso denegado. Rol: ${user.rol}, se requiere: propietario`);
        alert('No tienes permiso para acceder a esta página');
        window.location.href = '/';
        return;
    }
    
    // 4. GUARDAR EL ID DEL USUARIO GLOBALMENTE PARA USO EN OTRAS FUNCIONES
    window.currentUserId = user.id;
    
    // 5. CARGAR DASHBOARD
    console.log('📊 Cargando dashboard para:', user.nombre);
    await cargarDashboard(user);
});

async function cargarDashboard(usuario) {
    // Actualizar información del usuario
    actualizarInfoUsuario(usuario);
    
    // Configurar fecha y hora
    configurarFechaHora();
    
    // Cargar mascotas del propietario
    await cargarMascotas();
    
    // Cargar citas (pendiente de implementar)
    cargarCitasSimuladas();
    
    // Configurar event listeners
    configurarEventListeners(usuario);
}

function actualizarInfoUsuario(usuario) {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = usuario.nombre || 'Usuario';
    }
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
    
    actualizar();
    setInterval(actualizar, 60000);
}

async function cargarMascotas() {
    const petsContainer = document.getElementById('pets-container');
    if (!petsContainer) {
        console.error('❌ No se encontró el elemento pets-container');
        return;
    }
    
    const userId = window.currentUserId;
    if (!userId) {
        console.error('❌ No hay ID de usuario disponible');
        mostrarEstadoVacioMascotas();
        return;
    }
    
    console.log(`🔍 Solicitando mascotas para propietario ID: ${userId}`);
    
    try {
        const response = await fetch(`/api/mascotas/propietario/${userId}`);
        console.log('📥 Respuesta recibida:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Datos recibidos:', data);
        
        // Verificar que data.mascotas existe y es un array
        if (data.success && Array.isArray(data.mascotas) && data.mascotas.length > 0) {
            console.log(`✅ ${data.mascotas.length} mascotas encontradas`);
            mostrarMascotas(data.mascotas);
        } else {
            console.log('⚠️ No se encontraron mascotas para este propietario');
            mostrarEstadoVacioMascotas();
        }
    } catch (error) {
        console.error('❌ Error al cargar mascotas:', error);
        mostrarEstadoVacioMascotas();
        
        // Mostrar mensaje de error en el contenedor
        petsContainer.innerHTML = `
            <div class="empty-state error-state">
                <div class="empty-icon">⚠️</div>
                <h3 class="empty-title">Error al cargar mascotas</h3>
                <p class="empty-description">No se pudieron cargar tus mascotas. Intenta recargar la página.</p>
                <button class="btn btn-primary" onclick="location.reload()">Recargar página</button>
            </div>
        `;
    }
}

function mostrarMascotas(mascotas) {
    const petsContainer = document.getElementById('pets-container');
    
    let html = '<div class="pets-grid">';
    mascotas.forEach(mascota => {
        html += `
            <div class="pet-card">
                <div class="pet-icon">${obtenerIconoMascota(mascota.especie)}</div>
                <h3 class="pet-name">${mascota.nombre}</h3>
                <p class="pet-details">${mascota.especie} - ${mascota.raza || 'Sin raza'}</p>
                <p class="pet-age">${mascota.edad ? mascota.edad + ' años' : 'Edad no especificada'}</p>
                <button class="btn btn-outline ver-historial-btn" data-mascota-id="${mascota.id}">Ver historial</button>
            </div>
        `;
    });
    html += '</div>';
    
    petsContainer.innerHTML = html;
    
    // Habilitar botones de citas
    const scheduleBtn = document.getElementById('schedule-first-appointment-btn');
    if (scheduleBtn) scheduleBtn.disabled = false;
    
    const modifyBtn = document.getElementById('modify-appointment-btn');
    if (modifyBtn) modifyBtn.disabled = false;
    
    const cancelBtn = document.getElementById('cancel-appointment-btn');
    if (cancelBtn) cancelBtn.disabled = false;
    
    // Configurar botones de historial
    document.querySelectorAll('.ver-historial-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const mascotaId = this.getAttribute('data-mascota-id');
            console.log(`📋 Ver historial de mascota ID: ${mascotaId}`);
            window.location.href = `/historial?petId=${mascotaId}`;
        });
    });
}

function mostrarEstadoVacioMascotas() {
    const petsContainer = document.getElementById('pets-container');
    petsContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">🐾</div>
            <h3 class="empty-title">No tienes mascotas registradas</h3>
            <p class="empty-description">Agrega tu primera mascota para comenzar a gestionar sus citas y cuidados médicos.</p>
            <button class="btn btn-primary" id="add-first-pet-btn">Agregar mi primera mascota</button>
        </div>
    `;
    
    // Deshabilitar botones de citas
    const scheduleBtn = document.getElementById('schedule-first-appointment-btn');
    if (scheduleBtn) scheduleBtn.disabled = true;
    
    const modifyBtn = document.getElementById('modify-appointment-btn');
    if (modifyBtn) modifyBtn.disabled = true;
    
    const cancelBtn = document.getElementById('cancel-appointment-btn');
    if (cancelBtn) cancelBtn.disabled = true;
    
    // Configurar botón de agregar mascota
    const addFirstPetBtn = document.getElementById('add-first-pet-btn');
    if (addFirstPetBtn) {
        addFirstPetBtn.addEventListener('click', function() {
            alert('Funcionalidad de agregar mascota - En desarrollo');
        });
    }
}

function cargarCitasSimuladas() {
    const appointmentsContainer = document.getElementById('appointments-container');
    if (!appointmentsContainer) return;
    
    appointmentsContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📅</div>
            <h3 class="empty-title">No tienes citas programadas</h3>
            <p class="empty-description">Una vez que agregues tus mascotas, podrás agendar citas médicas desde aquí.</p>
        </div>
    `;
    
    const notificationsContainer = document.getElementById('notifications-container');
    if (notificationsContainer) {
        notificationsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔔</div>
                <h3 class="empty-title">No tienes notificaciones nuevas</h3>
                <p class="empty-description">Recibirás notificaciones sobre vacunas, resultados de exámenes y mensajes de nuestros veterinarios.</p>
            </div>
        `;
    }
}

function obtenerIconoMascota(especie) {
    if (!especie) return '🐾';
    
    const iconos = {
        'perro': '🐶',
        'gato': '🐱',
        'ave': '🦜',
        'roedor': '🐹',
        'reptil': '🦎',
        'conejo': '🐰',
        'hamster': '🐹',
        'pez': '🐠',
        'otro': '🐾'
    };
    
    const especieLower = especie.toLowerCase();
    return iconos[especieLower] || '🐾';
}

function configurarEventListeners(usuario) {
    console.log('🔧 Configurando event listeners...');
    
    // Botones de logout
    document.querySelectorAll('a[href="/login"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                console.log('👋 Cerrando sesión...');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        });
    });
    
    // Botón Agendar nueva cita
    const scheduleBtn = document.getElementById('schedule-appointment-btn');
    if (scheduleBtn) {
        scheduleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📅 Redirigiendo a /citas');
            window.location.href = '/citas';
        });
    }
    
    // Botón Agregar mascota (en el header)
    const addPetBtn = document.getElementById('add-pet-btn');
    if (addPetBtn) {
        addPetBtn.addEventListener('click', function() {
            alert('Funcionalidad de agregar mascota - En desarrollo');
        });
    }
    
    console.log('✅ Event listeners configurados');
}