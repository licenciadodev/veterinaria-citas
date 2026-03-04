// frontend/js/js-perfiles/dashboard-propietario.js
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== DASHBOARD PROPIETARIO INICIANDO ===');
    
    // Verificar sesión
    const userData = localStorage.getItem('user');
    if (!userData) {
        window.location.href = '/login';
        return;
    }
    
    const user = JSON.parse(userData);
    console.log('Usuario actual:', user);
    
    if (user.rol !== 'propietario') {
        alert('No tienes permiso para acceder');
        window.location.href = '/';
        return;
    }
    
    window.currentUser = user;
    
    // ===== ACTUALIZAR INFORMACIÓN DEL USUARIO =====
    actualizarInfoUsuario(user);
    
    // Cargar datos
    await Promise.all([
        cargarMascotas(user.id),
        cargarCitas(user.id)
    ]);
    
    configurarFechaHora();
    configurarEventListeners();
});

// ===== FUNCIÓN NUEVA: Actualizar el nombre en el saludo =====
function actualizarInfoUsuario(usuario) {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        // Mostrar el nombre completo del usuario
        userNameElement.textContent = usuario.nombre || 'Usuario';
        console.log('✅ Nombre actualizado a:', usuario.nombre);
    } else {
        console.warn('⚠️ Elemento user-name no encontrado en el DOM');
    }
}

async function cargarMascotas(idPropietario) {
    const petsContainer = document.getElementById('pets-container');
    if (!petsContainer) return;
    
    try {
        const response = await fetch(`/api/mascotas/propietario/${idPropietario}`);
        const data = await response.json();
        
        if (data.success && data.mascotas.length > 0) {
            mostrarMascotas(data.mascotas);
        } else {
            mostrarEstadoVacioMascotas();
        }
    } catch (error) {
        console.error('Error al cargar mascotas:', error);
        mostrarEstadoVacioMascotas();
    }
}

async function cargarCitas(idPropietario) {
    const appointmentsContainer = document.getElementById('appointments-container');
    const upcomingContainer = document.getElementById('upcoming-appointments');
    
    if (!appointmentsContainer) return;
    
    try {
        const hoy = new Date().toISOString().split('T')[0];
        
        const response = await fetch(`/api/citas?id_propietario=${idPropietario}&estado=programada&fecha_desde=${hoy}`);
        const data = await response.json();
        
        console.log('Citas cargadas:', data);
        
        if (data.success && data.citas.length > 0) {
            const citasHoy = data.citas.filter(c => c.fecha === hoy);
            const citasFuturas = data.citas.filter(c => c.fecha > hoy);
            
            if (citasHoy.length > 0) {
                appointmentsContainer.innerHTML = citasHoy.map(cita => crearTarjetaCita(cita)).join('');
            } else {
                appointmentsContainer.innerHTML = '<div class="empty-state">No tienes citas para hoy</div>';
            }
            
            if (upcomingContainer) {
                if (citasFuturas.length > 0) {
                    upcomingContainer.innerHTML = citasFuturas.map(cita => crearTarjetaCitaResumida(cita)).join('');
                } else {
                    upcomingContainer.innerHTML = '<div class="empty-state">No tienes citas próximas</div>';
                }
            }
        } else {
            appointmentsContainer.innerHTML = '<div class="empty-state">No tienes citas programadas</div>';
            if (upcomingContainer) {
                upcomingContainer.innerHTML = '<div class="empty-state">No tienes citas próximas</div>';
            }
        }
    } catch (error) {
        console.error('Error al cargar citas:', error);
        appointmentsContainer.innerHTML = '<div class="error-state">Error al cargar citas</div>';
    }
}

function crearTarjetaCita(cita) {
    return `
        <div class="appointment-item" onclick="window.location.href='/citas?id=${cita.id}'">
            <div class="appointment-header">
                <span class="appointment-time">${cita.hora.substring(0,5)}</span>
                <span class="appointment-status ${cita.estado}">${cita.estado}</span>
            </div>
            <div class="appointment-body">
                <div class="appointment-pet">🐾 ${cita.mascota_nombre}</div>
                <div class="appointment-vet">👨‍⚕️ ${cita.veterinario_nombre}</div>
                <div class="appointment-reason">📋 ${cita.motivo.substring(0,30)}...</div>
            </div>
        </div>
    `;
}

function crearTarjetaCitaResumida(cita) {
    return `
        <div class="upcoming-item" onclick="window.location.href='/citas?id=${cita.id}'">
            <span class="upcoming-date">${formatearFecha(cita.fecha)}</span>
            <span class="upcoming-time">${cita.hora.substring(0,5)}</span>
            <span class="upcoming-pet">${cita.mascota_nombre}</span>
        </div>
    `;
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
                <button class="btn btn-outline" onclick="window.location.href='/historial?petId=${mascota.id}'">
                    Ver historial
                </button>
            </div>
        `;
    });
    html += '</div>';
    
    petsContainer.innerHTML = html;
    
    const scheduleBtn = document.getElementById('schedule-appointment-btn');
    if (scheduleBtn) scheduleBtn.classList.remove('disabled');
}

function mostrarEstadoVacioMascotas() {
    const petsContainer = document.getElementById('pets-container');
    petsContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">🐾</div>
            <h3>No tienes mascotas registradas</h3>
            <p>Agrega tu primera mascota para comenzar</p>
        </div>
    `;
}

function obtenerIconoMascota(especie) {
    const iconos = {
        'perro': '🐶', 'gato': '🐱', 'ave': '🦜',
        'roedor': '🐹', 'reptil': '🦎', 'conejo': '🐰',
        'pez': '🐠', 'otro': '🐾'
    };
    return iconos[especie?.toLowerCase()] || '🐾';
}

function configurarFechaHora() {
    const datetimeElement = document.getElementById('current-datetime');
    if (!datetimeElement) return;
    
    function actualizar() {
        const now = new Date();
        datetimeElement.textContent = now.toLocaleDateString('es-ES', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }
    actualizar();
    setInterval(actualizar, 60000);
}

function configurarEventListeners() {
    document.querySelectorAll('a[href="/login"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Cerrar sesión?')) {
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        });
    });
    
    const scheduleBtn = document.getElementById('schedule-appointment-btn');
    if (scheduleBtn) {
        scheduleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/citas';
        });
    }
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}