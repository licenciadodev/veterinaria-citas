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
        alert('No tienes permiso para acceder a esta página');
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

// ============= FUNCIÓN PRINCIPAL: CARGAR CITAS =============
async function cargarCitas(idPropietario) {
    const appointmentsContainer = document.getElementById('appointments-container');
    const upcomingContainer = document.getElementById('upcoming-appointments');
    const notificationsContainer = document.getElementById('notifications-container');
    
    if (!appointmentsContainer) return;
    
    try {
        const hoy = new Date().toISOString().split('T')[0];
        
        const response = await fetch(`/api/citas?id_propietario=${idPropietario}&estado=programada`);
        const data = await response.json();
        
        console.log('Citas cargadas:', data);
        
        if (data.success && data.citas && data.citas.length > 0) {
            // Guardar todas las citas en una variable global
            window.citasPropietario = data.citas;
            
            // Separar citas de hoy y futuras
            const citasHoy = data.citas.filter(c => c.fecha === hoy);
            const citasFuturas = data.citas.filter(c => c.fecha > hoy);
            
            // Mostrar citas de hoy (CON RADIO BUTTONS)
            if (citasHoy.length > 0) {
                appointmentsContainer.innerHTML = citasHoy.map(cita => `
                    <div class="appointment-item" data-cita-id="${cita.id}">
                        <div class="appointment-selector">
                            <input type="radio" name="citaSeleccionada" value="${cita.id}" id="cita-${cita.id}" class="cita-radio">
                            <label for="cita-${cita.id}" class="cita-label"></label>
                        </div>
                        <div class="appointment-content">
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
                    </div>
                `).join('');
            } else {
                appointmentsContainer.innerHTML = '<div class="empty-state">No tienes citas para hoy</div>';
            }
            
            // Mostrar próximas citas (CON RADIO BUTTONS)
            if (upcomingContainer) {
                if (citasFuturas.length > 0) {
                    upcomingContainer.innerHTML = citasFuturas.map(cita => `
                        <div class="upcoming-item" data-cita-id="${cita.id}">
                            <div class="appointment-selector">
                                <input type="radio" name="citaSeleccionada" value="${cita.id}" id="cita-${cita.id}" class="cita-radio">
                                <label for="cita-${cita.id}" class="cita-label"></label>
                            </div>
                            <div class="upcoming-content">
                                <span class="upcoming-date">${formatearFecha(cita.fecha)}</span>
                                <span class="upcoming-time">${cita.hora.substring(0,5)}</span>
                                <span class="upcoming-pet">${cita.mascota_nombre}</span>
                                <span class="upcoming-reason">${cita.motivo.substring(0,20)}...</span>
                            </div>
                        </div>
                    `).join('');
                } else {
                    upcomingContainer.innerHTML = '<div class="empty-state">No tienes citas próximas</div>';
                }
            }
            
            // Notificaciones
            if (notificationsContainer) {
                if (citasFuturas.length > 0) {
                    notificationsContainer.innerHTML = citasFuturas.slice(0, 3).map(cita => `
                        <div class="notification-item" data-cita-id="${cita.id}">
                            <span class="notification-icon">📅</span>
                            <div class="notification-content">
                                <strong>${cita.mascota_nombre}</strong> - ${formatearFecha(cita.fecha)} ${cita.hora.substring(0,5)}
                                <p>${cita.motivo.substring(0,30)}...</p>
                            </div>
                        </div>
                    `).join('');
                } else {
                    notificationsContainer.innerHTML = '<div class="empty-state">No hay notificaciones</div>';
                }
            }
            
            // Agregar event listeners a los radio buttons
            agregarEventListenersRadios();
            
            // Botones inicialmente deshabilitados
            habilitarBotonesCitas(false);
        } else {
            appointmentsContainer.innerHTML = '<div class="empty-state">No tienes citas programadas</div>';
            if (upcomingContainer) {
                upcomingContainer.innerHTML = '<div class="empty-state">No tienes citas próximas</div>';
            }
            if (notificationsContainer) {
                notificationsContainer.innerHTML = '<div class="empty-state">No hay notificaciones</div>';
            }
            window.citasPropietario = [];
            habilitarBotonesCitas(false);
        }
    } catch (error) {
        console.error('Error al cargar citas:', error);
        appointmentsContainer.innerHTML = '<div class="error-state">Error al cargar citas</div>';
    }
}

// ============= FUNCIÓN: AGREGAR EVENT LISTENERS A RADIO BUTTONS =============
function agregarEventListenersRadios() {
    const radios = document.querySelectorAll('input[name="citaSeleccionada"]');
    radios.forEach(radio => {
        radio.removeEventListener('change', actualizarSeleccion);
        radio.addEventListener('change', actualizarSeleccion);
    });
}

// ============= VARIABLE Y FUNCIÓN DE SELECCIÓN =============
let citaSeleccionadaId = null;

function actualizarSeleccion() {
    const radios = document.querySelectorAll('input[name="citaSeleccionada"]');
    let seleccionado = false;
    
    radios.forEach(radio => {
        if (radio.checked) {
            citaSeleccionadaId = parseInt(radio.value);
            seleccionado = true;
            
            // Quitar clase selected de todos
            document.querySelectorAll('.appointment-item, .upcoming-item').forEach(el => {
                el.classList.remove('selected');
            });
            
            // Agregar clase selected al contenedor padre
            const parent = radio.closest('.appointment-item, .upcoming-item');
            if (parent) {
                parent.classList.add('selected');
            }
        }
    });
    
    if (seleccionado) {
        console.log('Cita seleccionada:', citaSeleccionadaId);
        habilitarBotonesCitas(true);
    } else {
        citaSeleccionadaId = null;
        habilitarBotonesCitas(false);
    }
}

function habilitarBotonesCitas(habilitar) {
    const modifyBtn = document.getElementById('modify-appointment-btn');
    const cancelBtn = document.getElementById('cancel-appointment-btn');
    
    if (modifyBtn) {
        modifyBtn.disabled = !habilitar;
        if (habilitar) {
            modifyBtn.classList.remove('disabled');
        } else {
            modifyBtn.classList.add('disabled');
        }
    }
    
    if (cancelBtn) {
        cancelBtn.disabled = !habilitar;
        if (habilitar) {
            cancelBtn.classList.remove('disabled');
        } else {
            cancelBtn.classList.add('disabled');
        }
    }
}

// ============= FUNCIÓN: CANCELAR CITA =============
window.cancelarCita = async function() {
    if (!citaSeleccionadaId) {
        alert('⚠️ Por favor, selecciona una cita haciendo clic en el círculo a la izquierda de la cita que deseas cancelar.');
        return;
    }
    
    // Buscar los detalles de la cita seleccionada
    const cita = window.citasPropietario?.find(c => c.id === citaSeleccionadaId);
    let mensaje = '¿Estás seguro de que quieres cancelar esta cita?';
    
    if (cita) {
        mensaje = `¿Cancelar cita de ${cita.mascota_nombre} el ${formatearFecha(cita.fecha)} a las ${cita.hora.substring(0,5)}?`;
    }
    
    if (!confirm(mensaje)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/citas/${citaSeleccionadaId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Cita cancelada exitosamente');
            await cargarCitas(window.currentUser.id);
            citaSeleccionadaId = null;
            habilitarBotonesCitas(false);
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error al cancelar cita:', error);
        alert('Error al conectar con el servidor');
    }
};

// ============= FUNCIÓN: MODIFICAR CITA =============
window.modificarCita = function() {
    if (!citaSeleccionadaId) {
        alert('⚠️ Por favor, selecciona una cita haciendo clic en el círculo a la izquierda de la cita que deseas modificar.');
        return;
    }
    
    console.log('Guardando cita a modificar:', citaSeleccionadaId);
    sessionStorage.setItem('citaAModificar', citaSeleccionadaId);
    window.location.href = '/citas';
};

// ============= FUNCIONES DE UTILIDAD =============
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
    
    // Botón Agregar mascota
    const addPetBtn = document.getElementById('add-pet-btn');
    if (addPetBtn) {
        addPetBtn.addEventListener('click', function() {
            alert('Funcionalidad de agregar mascota - En desarrollo');
        });
    }
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}