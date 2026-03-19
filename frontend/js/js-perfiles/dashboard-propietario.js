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
    
    // Actualizar información del usuario
    actualizarInfoUsuario(user);
    
    // Cargar datos
    await Promise.all([
        cargarMascotas(user.id),
        cargarCitas(user.id)
    ]);
    
    configurarFechaHora();
    configurarEventListeners(user.id);
});

function actualizarInfoUsuario(usuario) {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = usuario.nombre || 'Usuario';
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
        
        const response = await fetch(`/api/citas?id_propietario=${idPropietario}&estado=programada`);
        const data = await response.json();
        
        console.log('Citas cargadas:', data);
        
        if (data.success && data.citas && data.citas.length > 0) {
            // Separar citas de hoy y futuras
            const citasHoy = data.citas.filter(c => c.fecha === hoy);
            const citasFuturas = data.citas.filter(c => c.fecha > hoy);
            
            // Guardar todas las citas en una variable global para usarlas después
            window.citasPropietario = data.citas;
            
            // Mostrar citas de hoy
            if (citasHoy.length > 0) {
                appointmentsContainer.innerHTML = citasHoy.map(cita => crearTarjetaCita(cita)).join('');
            } else {
                appointmentsContainer.innerHTML = '<div class="empty-state">No tienes citas para hoy</div>';
            }
            
            // Mostrar próximas citas
            if (upcomingContainer) {
                if (citasFuturas.length > 0) {
                    upcomingContainer.innerHTML = citasFuturas.map(cita => crearTarjetaCitaResumida(cita)).join('');
                } else {
                    upcomingContainer.innerHTML = '<div class="empty-state">No tienes citas próximas</div>';
                }
            }
            
            // Habilitar botones de modificar/cancelar si hay citas
            habilitarBotonesCitas(true);
        } else {
            appointmentsContainer.innerHTML = '<div class="empty-state">No tienes citas programadas</div>';
            if (upcomingContainer) {
                upcomingContainer.innerHTML = '<div class="empty-state">No tienes citas próximas</div>';
            }
            window.citasPropietario = [];
            habilitarBotonesCitas(false);
        }
    } catch (error) {
        console.error('Error al cargar citas:', error);
        appointmentsContainer.innerHTML = '<div class="error-state">Error al cargar citas</div>';
    }
}

function crearTarjetaCita(cita) {
    return `
        <div class="appointment-item" onclick="seleccionarCita(${cita.id})">
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
        <div class="upcoming-item" onclick="seleccionarCita(${cita.id})">
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

function habilitarBotonesCitas(habilitar) {
    const modifyBtn = document.getElementById('modify-appointment-btn');
    const cancelBtn = document.getElementById('cancel-appointment-btn');
    
    if (modifyBtn) {
        if (habilitar) {
            modifyBtn.disabled = false;
            modifyBtn.classList.remove('disabled');
        } else {
            modifyBtn.disabled = true;
            modifyBtn.classList.add('disabled');
        }
    }
    
    if (cancelBtn) {
        if (habilitar) {
            cancelBtn.disabled = false;
            cancelBtn.classList.remove('disabled');
        } else {
            cancelBtn.disabled = true;
            cancelBtn.classList.add('disabled');
        }
    }
}

// Variable para almacenar la cita seleccionada
let citaSeleccionadaId = null;

// Función para seleccionar una cita
window.seleccionarCita = function(citaId) {
    console.log('Cita seleccionada:', citaId);
    
    // Quitar selección anterior
    document.querySelectorAll('.appointment-item, .upcoming-item').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Marcar la cita seleccionada
    const elementos = document.querySelectorAll(`[onclick="seleccionarCita(${citaId})"]`);
    elementos.forEach(el => {
        el.classList.add('selected');
    });
    
    citaSeleccionadaId = citaId;
    
    // Habilitar botones (ya están habilitados, pero aseguramos)
    habilitarBotonesCitas(true);
};

// Función para cancelar cita
window.cancelarCita = async function() {
    if (!citaSeleccionadaId) {
        alert('Por favor, selecciona una cita primero');
        return;
    }
    
    if (!confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/citas/${citaSeleccionadaId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Cita cancelada exitosamente');
            // Recargar citas
            await cargarCitas(window.currentUser.id);
            citaSeleccionadaId = null;
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error al cancelar cita:', error);
        alert('Error al conectar con el servidor');
    }
};

// Función para modificar cita (redirige a la página de citas con el ID)
window.modificarCita = function() {
    if (!citaSeleccionadaId) {
        alert('Por favor, selecciona una cita primero');
        return;
    }
    
    // Guardar en sessionStorage que vamos a modificar una cita
    sessionStorage.setItem('citaAModificar', citaSeleccionadaId);
    
    // Redirigir a la página de citas
    window.location.href = '/citas?modo=editar';
};

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

function configurarEventListeners(userId) {
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
    const scheduleBtn = document.getElementById('schedule-appointment-btn');
    if (scheduleBtn) {
        scheduleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/citas';
        });
    }
    
    // Botón Modificar cita
    const modifyBtn = document.getElementById('modify-appointment-btn');
    if (modifyBtn) {
        modifyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.modificarCita();
        });
    }
    
    // Botón Cancelar cita
    const cancelBtn = document.getElementById('cancel-appointment-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.cancelarCita();
        });
    }
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}