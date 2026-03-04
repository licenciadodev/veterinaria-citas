// frontend/js/js-acceso/citas-medicas.js
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar sesión
    const userData = localStorage.getItem('user');
    if (!userData) {
        window.location.href = '/login';
        return;
    }
    
    const user = JSON.parse(userData);
    window.currentUser = user;
    
    // Configurar selector de rol
    configurarRoleTabs(user.rol);
    
    // Cargar datos iniciales
    await cargarVeterinarios();
    await cargarMascotas(user.id);
    await cargarCitas();
    
    // Configurar fecha mínima (hoy)
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        const hoy = new Date().toISOString().split('T')[0];
        fechaInput.min = hoy;
    }
    
    // Configurar horarios disponibles
    document.getElementById('fecha').addEventListener('change', generarHorarios);
    document.getElementById('veterinario').addEventListener('change', verificarDisponibilidad);
    
    // Configurar filtros
    document.getElementById('filter-estado').addEventListener('change', cargarCitas);
    document.getElementById('filter-fecha').addEventListener('change', cargarCitas);
    
    // Configurar formulario
    document.getElementById('appointment-form').addEventListener('submit', agendarCita);
    document.getElementById('cancel-form').addEventListener('click', limpiarFormulario);
    
    // Configurar logout
    document.getElementById('logout-link')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('¿Cerrar sesión?')) {
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    });
});

function configurarRoleTabs(rolUsuario) {
    const tabs = document.querySelectorAll('.tab-btn');
    const roleTabs = document.getElementById('role-tabs');
    
    // Mostrar solo tabs relevantes
    tabs.forEach(tab => {
        if (tab.dataset.role === rolUsuario || rolUsuario === 'recepcionista') {
            tab.style.display = 'block';
        } else {
            tab.style.display = 'none';
        }
    });
    
    // Activar tab según rol
    tabs.forEach(tab => {
        if (tab.dataset.role === rolUsuario) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Event listeners para tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            cargarCitas(); // Recargar según el rol seleccionado
        });
    });
}

async function cargarVeterinarios() {
    try {
        const response = await fetch('/api/veterinarios');
        const data = await response.json();
        
        const select = document.getElementById('veterinario');
        if (data.veterinarios && data.veterinarios.length > 0) {
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
        if (data.mascotas && data.mascotas.length > 0) {
            select.innerHTML = '<option value="">Seleccione una mascota</option>' +
                data.mascotas.map(m => `<option value="${m.id}">${m.nombre} (${m.especie})</option>`).join('');
        } else {
            select.innerHTML = '<option value="">No tienes mascotas registradas</option>';
        }
    } catch (error) {
        console.error('Error al cargar mascotas:', error);
    }
}

function generarHorarios() {
    const select = document.getElementById('hora');
    const horas = [];
    
    // Generar horas de 8:00 a 18:00 cada 30 minutos
    for (let h = 8; h <= 18; h++) {
        for (let m = 0; m < 60; m += 30) {
            if (h === 18 && m > 0) continue; // No pasar de las 18:00
            const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            horas.push(hora);
        }
    }
    
    select.innerHTML = '<option value="">Seleccione hora</option>' +
        horas.map(h => `<option value="${h}">${h}</option>`).join('');
}

async function verificarDisponibilidad() {
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;
    const veterinario = document.getElementById('veterinario').value;
    
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

async function agendarCita(e) {
    e.preventDefault();
    
    const user = window.currentUser;
    
    const citaData = {
        fecha: document.getElementById('fecha').value,
        hora: document.getElementById('hora').value,
        motivo: document.getElementById('motivo').value,
        id_mascota: document.getElementById('mascota').value,
        id_veterinario: document.getElementById('veterinario').value,
        id_propietario: user.id
    };
    
    // Validaciones básicas
    for (let [key, value] of Object.entries(citaData)) {
        if (!value) {
            alert(`Por favor completa el campo ${key}`);
            return;
        }
    }
    
    try {
        const response = await fetch('/api/citas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(citaData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Cita agendada exitosamente');
            limpiarFormulario();
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
    const rolActivo = document.querySelector('.tab-btn.active')?.dataset.role || user.rol;
    
    try {
        let url = '/api/citas?';
        
        // Filtrar según rol activo
        if (rolActivo === 'propietario') {
            url += `id_propietario=${user.id}`;
        } else if (rolActivo === 'veterinario') {
            url += `id_veterinario=${user.id}`;
        }
        
        // Filtros adicionales
        const estado = document.getElementById('filter-estado').value;
        const fecha = document.getElementById('filter-fecha').value;
        
        if (estado) url += `&estado=${estado}`;
        if (fecha) url += `&fecha=${fecha}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.citas && data.citas.length > 0) {
            container.innerHTML = data.citas.map(cita => `
                <div class="appointment-card ${cita.estado}" onclick="verDetalleCita(${cita.id})">
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
    document.getElementById('appointment-form').reset();
    document.getElementById('mascota-error').textContent = '';
    document.getElementById('veterinario-error').textContent = '';
    document.getElementById('fecha-error').textContent = '';
    document.getElementById('hora-error').textContent = '';
    document.getElementById('motivo-error').textContent = '';
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
    
    detalles.innerHTML = `
        <p><strong>Fecha:</strong> ${formatearFecha(cita.fecha)} ${cita.hora.substring(0,5)}</p>
        <p><strong>Mascota:</strong> ${cita.mascota_nombre}</p>
        <p><strong>Propietario:</strong> ${cita.propietario_nombre}</p>
        <p><strong>Teléfono:</strong> ${cita.propietario_telefono || 'No especificado'}</p>
        <p><strong>Veterinario:</strong> ${cita.veterinario_nombre}</p>
        <p><strong>Motivo:</strong> ${cita.motivo}</p>
        <p><strong>Estado:</strong> <span class="status-badge ${cita.estado}">${cita.estado}</span></p>
    `;
    
    // Mostrar botones según rol y estado
    const actions = document.getElementById('modal-actions');
    if (user.rol === 'recepcionista' || 
        (user.rol === 'veterinario' && cita.estado !== 'cancelada' && cita.estado !== 'completada')) {
        actions.style.display = 'block';
        
        document.getElementById('edit-cita').onclick = () => editarCita(cita);
        document.getElementById('cancel-cita').onclick = () => cancelarCita(cita.id);
    } else {
        actions.style.display = 'none';
    }
    
    modal.style.display = 'block';
    
    // Cerrar modal
    document.getElementById('close-modal').onclick = () => {
        modal.style.display = 'none';
    };
}

async function cancelarCita(citaId) {
    if (!confirm('¿Estás seguro de cancelar esta cita?')) return;
    
    try {
        const response = await fetch(`/api/citas/${citaId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Cita cancelada');
            document.getElementById('cita-modal').style.display = 'none';
            cargarCitas();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error al cancelar cita:', error);
    }
}

function editarCita(cita) {
    alert('Funcionalidad de edición - En desarrollo');
    // Aquí implementaremos la edición después
}