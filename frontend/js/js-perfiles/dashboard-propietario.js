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
    if (user.rol !== 'propietario') {
        alert('No tienes permiso para acceder');
        window.location.href = '/';
        return;
    }
    
    window.currentUser = user;
    
    // Cargar datos
    await Promise.all([
        cargarMascotas(user.id),
        cargarCitas(user.id)
    ]);
    
    configurarFechaHora();
    configurarEventListeners();
});

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

// NUEVA FUNCIÓN: Cargar citas del propietario
async function cargarCitas(idPropietario) {
    const appointmentsContainer = document.getElementById('appointments-container');
    const upcomingContainer = document.getElementById('upcoming-appointments');
    const notificationsContainer = document.getElementById('notifications-container');
    
    try {
        // Obtener citas del propietario
        const response = await fetch(`/api/citas?id_propietario=${idPropietario}&estado=programada`);
        const data = await response.json();
        
        if (data.success && data.citas.length > 0) {
            // Separar citas de hoy y próximas
            const hoy = new Date().toISOString().split('T')[0];
            const citasHoy = data.citas.filter(c => c.fecha === hoy);
            const citasFuturas = data.citas.filter(c => c.fecha > hoy);
            
            // Mostrar en el contenedor principal
            if (appointmentsContainer) {
                appointmentsContainer.innerHTML = citasHoy.length > 0 
                    ? citasHoy.map(cita => crearTarjetaCita(cita)).join('')
                    : '<div class="empty-state">No tienes citas para hoy</div>';
            }
            
            // Mostrar próximas citas en una sección (si existe)
            if (upcomingContainer) {
                upcomingContainer.innerHTML = citasFuturas.length > 0
                    ? citasFuturas.map(cita => crearTarjetaCitaResumida(cita)).join('')
                    : '<div class="empty-state">No tienes citas próximas</div>';
            }
            
            // Notificaciones (citas próximas)
            if (notificationsContainer && citasFuturas.length > 0) {
                notificationsContainer.innerHTML = citasFuturas.map(cita => `
                    <div class="notification-item">
                        <span class="notification-icon">📅</span>
                        <div class="notification-content">
                            <strong>${cita.mascota_nombre}</strong> - ${formatearFecha(cita.fecha)} ${cita.hora.substring(0,5)}
                            <p>${cita.motivo.substring(0,30)}...</p>
                        </div>
                    </div>
                `).join('');
            }
        } else {
            if (appointmentsContainer) {
                appointmentsContainer.innerHTML = '<div class="empty-state">No tienes citas programadas</div>';
            }
            if (notificationsContainer) {
                notificationsContainer.innerHTML = '<div class="empty-state">No tienes notificaciones</div>';
            }
        }
    } catch (error) {
        console.error('Error al cargar citas:', error);
        if (appointmentsContainer) {
            appointmentsContainer.innerHTML = '<div class="error-state">Error al cargar citas</div>';
        }
    }
}

function crearTarjetaCita(cita) {
    return `
        <div class="appointment-item" onclick="verDetalleCita(${cita.id})">
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
        <div class="upcoming-item" onclick="verDetalleCita(${cita.id})">
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
    
    // Habilitar botones
    document.getElementById('schedule-first-appointment-btn')?.classList.remove('disabled');
    document.getElementById('schedule-appointment-btn')?.classList.remove('disabled');
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
    // Logout
    document.querySelectorAll('a[href="/login"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Cerrar sesión?')) {
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        });
    });
    
    // Botón Agendar cita
    document.getElementById('schedule-appointment-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/citas';
    });
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}

// Función global para ver detalle de cita
window.verDetalleCita = function(citaId) {
    window.location.href = `/citas?id=${citaId}`;
};