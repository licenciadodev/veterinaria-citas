// frontend/js/js-acceso/citas-medicas.js
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== PÁGINA DE CITAS INICIANDO ===');
    
    // Verificar sesión
    const userData = localStorage.getItem('user');
    if (!userData) {
        window.location.href = '/login';
        return;
    }
    
    try {
        const user = JSON.parse(userData);
        window.currentUser = user;
        console.log('Usuario actual:', user);
        
        // Configurar menú según rol
        configurarMenu(user.rol);
        
        // Cargar datos iniciales
        await Promise.all([
            cargarVeterinarios(),
            cargarMascotas(user.id),
            cargarCitas()
        ]);
        
        // Configurar fecha mínima (hoy)
        const fechaInput = document.getElementById('fecha');
        if (fechaInput) {
            const hoy = new Date().toISOString().split('T')[0];
            fechaInput.min = hoy;
        }
        
        // Configurar horarios disponibles
        document.getElementById('fecha')?.addEventListener('change', generarHorarios);
        document.getElementById('hora')?.addEventListener('change', verificarDisponibilidad);
        document.getElementById('veterinario')?.addEventListener('change', verificarDisponibilidad);
        
        // Configurar filtros
        document.getElementById('filter-estado')?.addEventListener('change', cargarCitas);
        document.getElementById('filter-fecha')?.addEventListener('change', cargarCitas);
        
        // Configurar formulario
        document.getElementById('appointment-form')?.addEventListener('submit', agendarCita);
        document.getElementById('cancel-form')?.addEventListener('click', limpiarFormulario);
        
        // Configurar logout
        document.querySelectorAll('a[href="/login"]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm('¿Cerrar sesión?')) {
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            });
        });
        
        // Cerrar modal con ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                document.getElementById('cita-modal').style.display = 'none';
            }
        });
        
        // Verificar si hay una cita para modificar (desde el dashboard)
        const citaAModificar = sessionStorage.getItem('citaAModificar');
        if (citaAModificar) {
            sessionStorage.removeItem('citaAModificar');
            await cargarCitaParaEditar(citaAModificar);
        }
        
        // Verificar si hay ID en la URL
        const urlParams = new URLSearchParams(window.location.search);
        const citaId = urlParams.get('id');
        if (citaId) {
            await verDetalleCita(citaId);
        }
        
    } catch (error) {
        console.error('Error en inicialización:', error);
    }
});

function configurarMenu(rolUsuario) {
    const navList = document.querySelector('.nav-list');
    if (!navList) return;
    
    let menuItems = '';
    
    if (rolUsuario === 'propietario') {
        menuItems = `
            <li><a href="/" class="nav-link">Inicio</a></li>
            <li><a href="/dashboard-propietario" class="nav-link">Mi Panel</a></li>
            <li><a href="/citas" class="nav-link active">Citas</a></li>
            <li><a href="/historial" class="nav-link">Historial</a></li>
            <li><a href="/login" class="nav-link">Cerrar Sesión</a></li>
        `;
    } else if (rolUsuario === 'recepcionista') {
        menuItems = `
            <li><a href="/" class="nav-link">Inicio</a></li>
            <li><a href="/dashboard-recepcionista" class="nav-link">Mi Panel</a></li>
            <li><a href="/citas" class="nav-link active">Citas</a></li>
            <li><a href="/login" class="nav-link">Cerrar Sesión</a></li>
        `;
    } else if (rolUsuario === 'veterinario') {
        menuItems = `
            <li><a href="/" class="nav-link">Inicio</a></li>
            <li><a href="/dashboard-veterinario" class="nav-link">Mi Panel</a></li>
            <li><a href="/citas" class="nav-link active">Citas</a></li>
            <li><a href="/historial" class="nav-link">Historial</a></li>
            <li><a href="/login" class="nav-link">Cerrar Sesión</a></li>
        `;
    }
    
    navList.innerHTML = menuItems;
}

async function cargarVeterinarios() {
    try {
        const response = await fetch('/api/veterinarios');
        const data = await response.json();
        
        const select = document.getElementById('veterinario');
        if (select && data.veterinarios && data.veterinarios.length > 0) {
            select.innerHTML = '<option value="">Seleccione un veterinario</option>' +
                data.veterinarios.map(v => `<option value="${v.id}">${v.nombre}</option>`).join('');
        }
    } catch (error) {
        console.error('Error al cargar veterinarios:', error);
    }
}

async function cargarMascotas(propietarioId) {
    try {
        const response = await fetch(`/api/mascotas/propietario/${propietarioId}`);
        const data = await response.json();
        
        const select = document.getElementById('mascota');
        if (select) {
            if (data.mascotas && data.mascotas.length > 0) {
                select.innerHTML = '<option value="">Seleccione una mascota</option>' +
                    data.mascotas.map(m => `<option value="${m.id}">${m.nombre} (${m.especie})</option>`).join('');
            } else {
                select.innerHTML = '<option value="">No tienes mascotas registradas</option>';
            }
        }
    } catch (error) {
        console.error('Error al cargar mascotas:', error);
    }
}

function generarHorarios() {
    const select = document.getElementById('hora');
    if (!select) return;
    
    const horas = [];
    for (let h = 8; h <= 18; h++) {
        for (let m = 0; m < 60; m += 30) {
            if (h === 18 && m > 0) continue;
            const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            horas.push(hora);
        }
    }
    
    select.innerHTML = '<option value="">Seleccione hora</option>' +
        horas.map(h => `<option value="${h}">${h}</option>`).join('');
}

async function verificarDisponibilidad() {
    const fecha = document.getElementById('fecha')?.value;
    const hora = document.getElementById('hora')?.value;
    const veterinario = document.getElementById('veterinario')?.value;
    
    if (!fecha || !hora || !veterinario) return;
    
    try {
        const response = await fetch('/api/citas/verificar-disponibilidad', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fecha, hora, id_veterinario: veterinario })
        });
        
        const data = await response.json();
        
        if (!data.disponible) {
            alert('⚠️ El horario seleccionado no está disponible. Por favor elige otro.');
            document.getElementById('hora').value = '';
        }
    } catch (error) {
        console.error('Error al verificar disponibilidad:', error);
    }
}

// Función para cargar una cita y preparar el formulario para edición
async function cargarCitaParaEditar(citaId) {
    try {
        const response = await fetch(`/api/citas/${citaId}`);
        const data = await response.json();
        
        if (data.success) {
            const cita = data.cita;
            
            // Llenar el formulario con los datos de la cita
            document.getElementById('mascota').value = cita.id_mascota;
            document.getElementById('veterinario').value = cita.id_veterinario;
            document.getElementById('fecha').value = cita.fecha;
            document.getElementById('hora').value = cita.hora.substring(0,5);
            document.getElementById('motivo').value = cita.motivo;
            
            // Cambiar el texto del botón
            const submitBtn = document.querySelector('#appointment-form button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Actualizar Cita';
            }
            
            // Guardar el ID de la cita en el formulario
            const form = document.getElementById('appointment-form');
            if (!form.querySelector('input[name="cita_id"]')) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'cita_id';
                input.value = citaId;
                form.appendChild(input);
            }
            
            // Mostrar mensaje
            const mensajeDiv = document.createElement('div');
            mensajeDiv.className = 'alert alert-info';
            mensajeDiv.innerHTML = '✏️ Modo edición: Puedes cambiar los datos de la cita y guardar los cambios.';
            mensajeDiv.style.cssText = 'background: #e3f2fd; color: #1976d2; padding: 10px; border-radius: 8px; margin-bottom: 20px;';
            
            const formSection = document.querySelector('.new-appointment-section');
            if (formSection && !document.getElementById('edit-mode-alert')) {
                mensajeDiv.id = 'edit-mode-alert';
                formSection.insertBefore(mensajeDiv, formSection.firstChild);
            }
        }
    } catch (error) {
        console.error('Error al cargar cita para editar:', error);
    }
}

async function agendarCita(e) {
    e.preventDefault();
    
    const user = window.currentUser;
    const form = e.target;
    const citaId = form.querySelector('input[name="cita_id"]')?.value;
    
    const citaData = {
        fecha: document.getElementById('fecha').value,
        hora: document.getElementById('hora').value,
        motivo: document.getElementById('motivo').value,
        id_mascota: document.getElementById('mascota').value,
        id_veterinario: document.getElementById('veterinario').value,
        id_propietario: user.id
    };
    
    // Validar campos
    for (let [key, value] of Object.entries(citaData)) {
        if (!value) {
            alert('Por favor completa todos los campos');
            return;
        }
    }
    
    try {
        let url = '/api/citas';
        let method = 'POST';
        
        if (citaId) {
            // Si hay citaId, estamos actualizando
            url = `/api/citas/${citaId}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(citaData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(citaId ? '✅ Cita actualizada exitosamente' : '✅ Cita agendada exitosamente');
            limpiarFormulario();
            
            // Eliminar el campo oculto si existe
            if (citaId) {
                form.querySelector('input[name="cita_id"]')?.remove();
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.textContent = 'Agendar Cita';
                
                // Eliminar mensaje de edición
                const alertMsg = document.getElementById('edit-mode-alert');
                if (alertMsg) alertMsg.remove();
            }
            
            cargarCitas();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error al agendar cita:', error);
        alert('Error al conectar con el servidor');
    }
}

async function cargarCitas() {
    const container = document.getElementById('appointments-container');
    const user = window.currentUser;
    
    if (!container) return;
    
    try {
        // Construir URL según el rol del usuario
        let url = '/api/citas?';
        
        if (user.rol === 'propietario') {
            url += `id_propietario=${user.id}`;
        } else if (user.rol === 'veterinario') {
            url += `id_veterinario=${user.id}`;
        }
        // Si es recepcionista, ve todas las citas
        
        // Filtros adicionales
        const estado = document.getElementById('filter-estado')?.value;
        const fecha = document.getElementById('filter-fecha')?.value;
        
        if (estado) url += `&estado=${estado}`;
        if (fecha) url += `&fecha=${fecha}`;
        
        console.log('Cargando citas desde:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.citas && data.citas.length > 0) {
            container.innerHTML = data.citas.map(cita => `
                <div class="appointment-card ${cita.estado}" onclick="window.verDetalleCita(${cita.id})">
                    <div class="appointment-header">
                        <span class="appointment-date">${formatearFecha(cita.fecha)} ${cita.hora.substring(0,5)}</span>
                        <span class="appointment-status ${cita.estado}">${cita.estado}</span>
                    </div>
                    <div class="appointment-body">
                        <div class="appointment-pet">🐾 ${cita.mascota_nombre}</div>
                        <div class="appointment-vet">👨‍⚕️ ${cita.veterinario_nombre}</div>
                        <div class="appointment-reason">📋 ${cita.motivo.substring(0,50)}${cita.motivo.length > 50 ? '...' : ''}</div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="empty-state">No hay citas para mostrar</div>';
        }
    } catch (error) {
        console.error('Error al cargar citas:', error);
        container.innerHTML = '<div class="error-state">Error al cargar las citas</div>';
    }
}

function limpiarFormulario() {
    document.getElementById('appointment-form')?.reset();
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    
    // Eliminar mensaje de edición si existe
    const alertMsg = document.getElementById('edit-mode-alert');
    if (alertMsg) alertMsg.remove();
    
    // Restaurar botón
    const submitBtn = document.querySelector('#appointment-form button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Agendar Cita';
    
    // Eliminar campo oculto
    const form = document.getElementById('appointment-form');
    const hiddenInput = form.querySelector('input[name="cita_id"]');
    if (hiddenInput) hiddenInput.remove();
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Función global para ver detalle de cita
window.verDetalleCita = async function(citaId) {
    try {
        const response = await fetch(`/api/citas/${citaId}`);
        const data = await response.json();
        
        if (data.cita) {
            mostrarModalCita(data.cita);
        }
    } catch (error) {
        console.error('Error al obtener detalle de cita:', error);
    }
};

function mostrarModalCita(cita) {
    const modal = document.getElementById('cita-modal');
    const detalles = document.getElementById('cita-detalles');
    const user = window.currentUser;
    
    if (!modal || !detalles) return;
    
    detalles.innerHTML = `
        <p><strong>Fecha:</strong> ${formatearFecha(cita.fecha)} ${cita.hora.substring(0,5)}</p>
        <p><strong>Mascota:</strong> ${cita.mascota_nombre}</p>
        <p><strong>Propietario:</strong> ${cita.propietario_nombre}</p>
        <p><strong>Teléfono:</strong> ${cita.propietario_telefono || 'No especificado'}</p>
        <p><strong>Veterinario:</strong> ${cita.veterinario_nombre}</p>
        <p><strong>Motivo:</strong> ${cita.motivo}</p>
        <p><strong>Estado:</strong> <span class="status-badge ${cita.estado}">${cita.estado}</span></p>
    `;
    
    // Configurar acciones según rol y estado
    const actions = document.getElementById('modal-actions');
    const editBtn = document.getElementById('edit-cita');
    const cancelBtn = document.getElementById('cancel-cita');
    
    if (actions && editBtn && cancelBtn) {
        // Mostrar acciones solo si corresponde
        if (user.rol === 'recepcionista' || 
            (user.rol === 'propietario' && cita.estado === 'programada') ||
            (user.rol === 'veterinario' && cita.estado !== 'cancelada' && cita.estado !== 'completada')) {
            
            actions.style.display = 'flex';
            
            // Configurar botón de editar
            editBtn.onclick = () => {
                sessionStorage.setItem('citaAModificar', cita.id);
                window.location.href = '/citas';
            };
            
            // Configurar botón de cancelar
            cancelBtn.onclick = () => window.cancelarCita(cita.id);
            
        } else {
            actions.style.display = 'none';
        }
    }
    
    modal.style.display = 'block';
    
    // Cerrar modal al hacer clic en la X
    document.getElementById('close-modal').onclick = () => {
        modal.style.display = 'none';
    };
    
    // Cerrar modal al hacer clic fuera
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Función global para cancelar cita
window.cancelarCita = async function(citaId) {
    if (!confirm('¿Estás seguro de cancelar esta cita?')) return;
    
    try {
        const response = await fetch(`/api/citas/${citaId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Cita cancelada exitosamente');
            document.getElementById('cita-modal').style.display = 'none';
            cargarCitas(); // Recargar la lista
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error al cancelar cita:', error);
        alert('Error al conectar con el servidor');
    }
};