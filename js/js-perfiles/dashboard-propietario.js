// ../../js/dashboard-propietario.js (versión conectable con Node.js)
document.addEventListener('DOMContentLoaded', async function() {
    // 1. Verificar sesión y obtener datos del usuario
    try {
        const currentUser = await obtenerDatosUsuario();
        if (!currentUser) {
            // Redirigir a login si no hay sesión válida
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
        // Placeholder para endpoint real de Node.js
        const response = await fetch('/api/usuario/logueado', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${obtenerToken()}`
            },
            credentials: 'include' // Para incluir cookies de sesión
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
    
    // Actualizar formulario de datos personales
    llenarFormularioDatosPersonales(usuario);
    
    // Cargar mascotas (desde Node.js)
    await cargarMascotas(usuario.id);
    
    // Cargar próximas citas (desde Node.js)
    await cargarCitas(usuario.id);
    
    // Cargar notificaciones (desde Node.js)
    await cargarNotificaciones(usuario.id);
    
    // Habilitar/deshabilitar botones según el estado
    actualizarEstadoBotones();
    
    // Actualizar fecha y hora
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 60000);
}

// ===== CARGA DE DATOS ESPECÍFICOS =====

// Cargar mascotas del propietario desde Node.js
async function cargarMascotas(propietarioId) {
    const petsContainer = document.getElementById('pets-container');
    
    try {
        // Placeholder para endpoint real
        const response = await fetch(`/api/mascotas?propietarioId=${propietarioId}`, {
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar mascotas');
        
        const mascotas = await response.json();
        
        if (mascotas.length > 0) {
            renderizarMascotas(mascotas);
        } else {
            mostrarEstadoVacio(petsContainer, {
                icono: '🐾',
                titulo: 'No tienes mascotas registradas',
                descripcion: 'Agrega tu primera mascota para comenzar a gestionar sus citas y cuidados médicos.',
                botonTexto: 'Agregar mi primera mascota',
                botonId: 'add-first-pet-btn'
            });
        }
    } catch (error) {
        console.error('Error al cargar mascotas:', error);
        mostrarErrorContenedor(petsContainer, 'No se pudieron cargar tus mascotas. Intenta nuevamente más tarde.');
    }
}

// Cargar próximas citas desde Node.js
async function cargarCitas(propietarioId) {
    const appointmentsContainer = document.getElementById('appointments-container');
    
    try {
        // Placeholder para endpoint real
        const response = await fetch(`/api/citas/proximas?propietarioId=${propietarioId}`, {
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar citas');
        
        const citas = await response.json();
        
        if (citas.length > 0) {
            renderizarCitas(citas);
        } else {
            mostrarEstadoVacio(appointmentsContainer, {
                icono: '📅',
                titulo: 'No tienes citas programadas',
                descripcion: 'Una vez que agregues tus mascotas, podrás agendar citas médicas desde aquí.',
                botonTexto: 'Agendar primera cita',
                botonId: 'schedule-first-appointment-btn',
                botonDeshabilitado: true // Se habilitará cuando haya mascotas
            });
        }
    } catch (error) {
        console.error('Error al cargar citas:', error);
        mostrarErrorContenedor(appointmentsContainer, 'No se pudieron cargar tus citas. Intenta nuevamente más tarde.');
    }
}

// Cargar notificaciones desde Node.js
async function cargarNotificaciones(propietarioId) {
    const notificationsContainer = document.getElementById('notifications-container');
    
    try {
        // Placeholder para endpoint real
        const response = await fetch(`/api/notificaciones?usuarioId=${propietarioId}`, {
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar notificaciones');
        
        const notificaciones = await response.json();
        
        if (notificaciones.length > 0) {
            renderizarNotificaciones(notificaciones);
        } else {
            mostrarEstadoVacio(notificationsContainer, {
                icono: '🔔',
                titulo: 'No tienes notificaciones nuevas',
                descripcion: 'Recibirás notificaciones sobre vacunas, resultados de exámenes y mensajes de nuestros veterinarios.'
            });
        }
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        // No mostramos error al usuario para no saturar, solo en consola
        mostrarEstadoVacio(notificationsContainer, {
            icono: '🔔',
            titulo: 'No tienes notificaciones nuevas',
            descripcion: 'Recibirás notificaciones sobre vacunas, resultados de exámenes y mensajes de nuestros veterinarios.'
        });
    }
}

// ===== FUNCIONES DE RENDERIZADO =====

// Renderizar la lista de mascotas
function renderizarMascotas(mascotas) {
    const petsContainer = document.getElementById('pets-container');
    petsContainer.innerHTML = '';
    
    if (mascotas.length === 0) {
        mostrarEstadoVacio(petsContainer, {
            icono: '🐾',
            titulo: 'No tienes mascotas registradas',
            descripcion: 'Agrega tu primera mascota para comenzar a gestionar sus citas y cuidados médicos.',
            botonTexto: 'Agregar mi primera mascota',
            botonId: 'add-first-pet-btn'
        });
        return;
    }
    
    // Crear contenedor grid para las mascotas
    const grid = document.createElement('div');
    grid.className = 'pets-grid';
    
    mascotas.forEach(mascota => {
        const card = document.createElement('article');
        card.className = 'pet-card';
        card.setAttribute('data-pet-id', mascota.id);
        card.innerHTML = `
            <div class="pet-header">
                <div class="pet-icon">${obtenerIconoMascota(mascota.especie)}</div>
                <h3 class="pet-name">${mascota.nombre}</h3>
            </div>
            <div class="pet-body">
                <div class="pet-info">
                    <p>Especie: ${mascota.especie}</p>
                    <p>Raza: ${mascota.raza || 'No especificada'}</p>
                    <p>Edad: ${mascota.edad} años</p>
                </div>
                <div class="pet-actions">
                    <button class="btn btn-outline view-history-btn" data-pet-id="${mascota.id}">Ver historial</button>
                    <button class="btn btn-outline update-pet-btn" data-pet-id="${mascota.id}">Actualizar</button>
                    <button class="btn btn-outline delete-pet-btn" data-pet-id="${mascota.id}">Eliminar</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    
    petsContainer.appendChild(grid);
    
    // Añadir event listeners a los botones
    document.querySelectorAll('.view-history-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const petId = this.getAttribute('data-pet-id');
            verHistorialMascota(petId);
        });
    });
    
    document.querySelectorAll('.update-pet-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const petId = this.getAttribute('data-pet-id');
            abrirModalEditarMascota(petId);
        });
    });
    
    document.querySelectorAll('.delete-pet-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const petId = this.getAttribute('data-pet-id');
            confirmarEliminarMascota(petId);
        });
    });
}

// Renderizar próximas citas
function renderizarCitas(citas) {
    const appointmentsContainer = document.getElementById('appointments-container');
    appointmentsContainer.innerHTML = '';
    
    if (citas.length === 0) {
        mostrarEstadoVacio(appointmentsContainer, {
            icono: '📅',
            titulo: 'No tienes citas programadas',
            descripcion: 'Agenda tu primera cita médica para comenzar.',
            botonTexto: 'Agendar cita',
            botonId: 'schedule-first-appointment-btn'
        });
        return;
    }
    
    const container = document.createElement('div');
    container.className = 'appointments-list';
    
    citas.forEach(cita => {
        const card = document.createElement('div');
        card.className = 'appointment-card';
        card.innerHTML = `
            <div class="appointment-details">
                <p><strong>Fecha:</strong> ${formatearFecha(cita.fecha)} a las ${cita.hora}</p>
                <p><strong>Veterinario:</strong> ${cita.veterinario.nombre}</p>
                <p><strong>Motivo:</strong> ${cita.motivo}</p>
                <p><strong>Mascota:</strong> ${cita.mascota.nombre}</p>
                <p><strong>Estado:</strong> <span class="status status-${cita.estado}">${formatearEstado(cita.estado)}</span></p>
                <div class="appointment-actions">
                    <button class="btn btn-outline modify-appointment-btn" data-cita-id="${cita.id}">Modificar</button>
                    <button class="btn btn-outline cancel-appointment-btn" data-cita-id="${cita.id}">Cancelar</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    
    appointmentsContainer.appendChild(container);
    
    // Añadir event listeners a los botones de citas
    document.querySelectorAll('.modify-appointment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const citaId = this.getAttribute('data-cita-id');
            abrirModalModificarCita(citaId);
        });
    });
    
    document.querySelectorAll('.cancel-appointment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const citaId = this.getAttribute('data-cita-id');
            confirmarCancelarCita(citaId);
        });
    });
}

// ===== FUNCIONES DE UTILIDAD =====

// Obtener token de autenticación (desde localStorage, sessionStorage o cookies)
function obtenerToken() {
    // En producción, esto debería obtener el token de forma segura
    // Ejemplo con sessionStorage:
    return sessionStorage.getItem('authToken') || null;
}

// Actualizar fecha y hora en tiempo real
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

// Formatear fecha para mostrar al usuario
function formatearFecha(fechaString) {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Formatear estado de cita
function formatearEstado(estado) {
    const estados = {
        'pendiente': 'Pendiente',
        'confirmada': 'Confirmada',
        'completada': 'Completada',
        'cancelada': 'Cancelada'
    };
    return estados[estado.toLowerCase()] || estado;
}

// Obtener ícono según especie de mascota
function obtenerIconoMascota(especie) {
    const iconos = {
        'perro': '🐶',
        'gato': '🐱',
        'ave': '🦜',
        'roedor': '🐹',
        'reptil': '🦎',
        'otro': '🐾'
    };
    return iconos[especie.toLowerCase()] || '🐾';
}

// Mostrar estado vacío en un contenedor
function mostrarEstadoVacio(contenedor, opciones) {
    contenedor.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">${opciones.icono}</div>
            <h3 class="empty-title">${opciones.titulo}</h3>
            <p class="empty-description">${opciones.descripcion}</p>
            ${opciones.botonTexto ? `
                <button class="btn btn-primary" id="${opciones.botonId}" ${opciones.botonDeshabilitado ? 'disabled' : ''}>
                    ${opciones.botonTexto}
                </button>
            ` : ''}
        </div>
    `;
    
    // Añadir event listeners si hay botones
    if (opciones.botonId) {
        const boton = document.getElementById(opciones.botonId);
        if (boton) {
            boton.addEventListener('click', function() {
                if (opciones.botonId === 'add-first-pet-btn') {
                    abrirModalNuevaMascota();
                } else if (opciones.botonId === 'schedule-first-appointment-btn') {
                    agendarNuevaCita();
                }
            });
        }
    }
}

// Mostrar error en un contenedor específico
function mostrarErrorContenedor(contenedor, mensaje) {
    contenedor.innerHTML = `
        <div class="error-state">
            <div class="error-icon">❌</div>
            <h3 class="error-title">Error al cargar datos</h3>
            <p class="error-description">${mensaje}</p>
            <button class="btn btn-secondary retry-btn">Intentar nuevamente</button>
        </div>
    `;
    
    document.querySelector('.retry-btn').addEventListener('click', () => {
        // Recargar la sección específica
        if (contenedor.id === 'pets-container') {
            const usuario = JSON.parse(sessionStorage.getItem('currentUser'));
            cargarMascotas(usuario.id);
        } else if (contenedor.id === 'appointments-container') {
            const usuario = JSON.parse(sessionStorage.getItem('currentUser'));
            cargarCitas(usuario.id);
        }
    });
}

// Mostrar mensaje de error global
function mostrarError(mensaje) {
    // En producción, esto podría mostrar un toast o modal
    console.error('Error:', mensaje);
    alert(`Error: ${mensaje}`);
}

// ===== FUNCIONES DE INTERACCIÓN =====

// Abrir modal para nueva mascota
function abrirModalNuevaMascota() {
    // En la versión final, esto abriría un modal con formulario
    alert('En la implementación real, esto abriría un modal para registrar una nueva mascota.');
    console.log('Abrir modal para nueva mascota');
}

// Agendar nueva cita
function agendarNuevaCita() {
    // Verificar si hay mascotas registradas
    const petsContainer = document.getElementById('pets-container');
    if (petsContainer.querySelector('.empty-state')) {
        alert('Debes registrar al menos una mascota antes de agendar una cita.');
        return;
    }
    
    // En la versión final, esto abriría un formulario de agendamiento
    alert('En la implementación real, esto abriría un formulario para agendar una nueva cita.');
    console.log('Abrir formulario para nueva cita');
}

// Actualizar estado de botones según datos disponibles
function actualizarEstadoBotones() {
    const petsContainer = document.getElementById('pets-container');
    const hasPets = !petsContainer.querySelector('.empty-state');
    
    document.getElementById('schedule-appointment-btn').disabled = !hasPets;
    document.getElementById('schedule-first-appointment-btn').disabled = !hasPets;
    document.getElementById('modify-appointment-btn').disabled = !hasPets;
    document.getElementById('cancel-appointment-btn').disabled = !hasPets;
    document.getElementById('view-medical-history-btn').disabled = !hasPets;
}

// Llenar formulario de datos personales con datos del usuario
function llenarFormularioDatosPersonales(usuario) {
    document.getElementById('user-names').value = usuario.nombres || '';
    document.getElementById('user-surnames').value = usuario.apellidos || '';
    document.getElementById('user-email').value = usuario.email || '';
    document.getElementById('user-phone').value = usuario.telefono || '';
    document.getElementById('user-address').value = usuario.direccion || '';
    document.getElementById('user-city').value = usuario.ciudad || '';
    document.getElementById('user-department').value = usuario.departamento || '';
}

// ===== EVENT LISTENERS =====

// Modal para actualizar datos personales
document.getElementById('update-personal-data-btn').addEventListener('click', function() {
    const modal = document.getElementById('personal-data-modal');
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('active');
});

document.getElementById('close-personal-data-modal').addEventListener('click', function() {
    const modal = document.getElementById('personal-data-modal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
});

// Cerrar modal al hacer clic fuera
document.getElementById('personal-data-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.remove('active');
        this.setAttribute('aria-hidden', 'true');
    }
});

// Manejar envío del formulario de datos personales
document.getElementById('personal-data-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        nombres: document.getElementById('user-names').value,
        apellidos: document.getElementById('user-surnames').value,
        email: document.getElementById('user-email').value,
        telefono: document.getElementById('user-phone').value,
        direccion: document.getElementById('user-address').value,
        ciudad: document.getElementById('user-city').value,
        departamento: document.getElementById('user-department').value
    };
    
    try {
        // Placeholder para endpoint real de Node.js
        const response = await fetch('/api/usuario/actualizar', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${obtenerToken()}`
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Error al actualizar datos');
        
        const resultado = await response.json();
        
        // Actualizar nombre en el saludo
        document.getElementById('user-name').textContent = resultado.nombres;
        
        // Cerrar modal
        document.getElementById('personal-data-modal').classList.remove('active');
        document.getElementById('personal-data-modal').setAttribute('aria-hidden', 'true');
        
        alert('¡Tus datos personales han sido actualizados exitosamente!');
        
    } catch (error) {
        console.error('Error al actualizar datos:', error);
        alert('Hubo un error al actualizar tus datos. Por favor, intenta nuevamente.');
    }
});

// Botón para agregar mascota desde el header
document.getElementById('add-pet-btn').addEventListener('click', abrirModalNuevaMascota);

// Botones de gestión de citas
document.getElementById('schedule-appointment-btn').addEventListener('click', agendarNuevaCita);
document.getElementById('modify-appointment-btn').addEventListener('click', function() {
    alert('En la implementación real, esto mostraría tus citas pendientes para modificar.');
});
document.getElementById('cancel-appointment-btn').addEventListener('click', function() {
    alert('En la implementación real, esto mostraría tus citas pendientes para cancelar.');
});

// Botón de historial médico
document.getElementById('view-medical-history-btn').addEventListener('click', function() {
    alert('En la implementación real, esto mostraría el historial médico completo de tus mascotas.');
});

console.log('Dashboard propietario inicializado - listo para conexión con Node.js');