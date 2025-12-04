// ../../js/dashboard-veterinario.js (versión conectable con Node.js)
document.addEventListener('DOMContentLoaded', async function() {
    // 1. Verificar sesión y obtener datos del usuario
    try {
        const currentUser = await obtenerDatosUsuario();
        if (!currentUser || currentUser.role !== 'veterinario') {
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
    
    // Cargar contadores clave
    await cargarContadores();
    
    // Cargar agenda diaria
    await cargarAgendaDiaria();
    
    // Configurar event listeners
    configurarEventListeners();
}

// ===== CARGA DE DATOS =====

async function cargarContadores() {
    try {
        // Placeholder para endpoints reales
        const responseHoy = await fetch('/api/citas/veterinario/hoy', {
            headers: { 'Authorization': `Bearer ${obtenerToken()}` }
        });
        
        const responsePendientes = await fetch('/api/citas/veterinario/pendientes', {
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

async function cargarAgendaDiaria() {
    const scheduleContainer = document.getElementById('daily-schedule');
    
    try {
        // Placeholder para endpoint real
        const response = await fetch('/api/citas/veterinario/hoy/detallado', {
            headers: { 'Authorization': `Bearer ${obtenerToken()}` }
        });
        
        if (!response.ok) throw new Error('Error al cargar agenda diaria');
        
        const citas = await response.json();
        
        if (citas.length > 0) {
            renderizarAgendaDiaria(citas);
        } else {
            scheduleContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📅</div>
                    <h3 class="empty-title">No hay citas programadas para hoy</h3>
                    <p class="empty-description">Puedes revisar citas futuras o buscar pacientes en el historial clínico.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al cargar agenda diaria:', error);
        scheduleContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3 class="empty-title">Error al cargar agenda</h3>
                <p class="empty-description">No se pudieron cargar las citas de hoy. Intenta nuevamente más tarde.</p>
                <button class="btn btn-secondary retry-agenda-btn">Reintentar</button>
            </div>
        `;
        
        document.querySelector('.retry-agenda-btn').addEventListener('click', () => {
            cargarAgendaDiaria();
        });
    }
}

function renderizarAgendaDiaria(citas) {
    const scheduleContainer = document.getElementById('daily-schedule');
    scheduleContainer.innerHTML = '';
    
    citas.sort((a, b) => new Date(`1970-01-01T${a.hora}`) - new Date(`1970-01-01T${b.hora}`));
    
    citas.forEach(cita => {
        const appointmentSlot = document.createElement('div');
        appointmentSlot.className = `appointment-slot ${obtenerClaseTipoConsulta(cita.motivo)}`;
        appointmentSlot.dataset.citaId = cita.id;
        appointmentSlot.dataset.petId = cita.mascota.id;
        
        appointmentSlot.innerHTML = `
            <div class="appointment-time">${cita.hora} (${cita.duracion} min)</div>
            <div class="appointment-owner">${cita.propietario.nombres} ${cita.propietario.apellidos}</div>
            <div class="appointment-pet">
                <span class="appointment-pet-icon">${obtenerIconoMascota(cita.mascota.especie)}</span>
                ${cita.mascota.nombre} (${cita.mascota.especie}, ${cita.mascota.raza}, ${cita.mascota.edad} años)
            </div>
            <div class="appointment-reason">Motivo: ${cita.motivo}</div>
            <div class="medical-history">
                <strong>Historial resumido:</strong> Última visita: ${formatearFecha(cita.ultimaVisita)} | 
                Alergias: ${cita.mascota.alergias || 'Ninguna'} | 
                Condiciones: ${cita.mascota.condiciones || 'Ninguna'}
            </div>
            <div class="appointment-actions">
                <button class="btn btn-outline view-history-btn" data-pet-id="${cita.mascota.id}">
                    Abrir historial completo
                </button>
                <button class="btn btn-primary register-consultation-btn" data-cita-id="${cita.id}" data-pet-id="${cita.mascota.id}">
                    Registrar consulta
                </button>
            </div>
        `;
        scheduleContainer.appendChild(appointmentSlot);
    });
    
    // Event listeners para los botones
    document.querySelectorAll('.view-history-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const petId = this.getAttribute('data-pet-id');
            abrirHistorialMedico(petId);
        });
    });
    
    document.querySelectorAll('.register-consultation-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const citaId = this.getAttribute('data-cita-id');
            const petId = this.getAttribute('data-pet-id');
            abrirModalRegistrarConsulta(citaId, petId);
        });
    });
}

// ===== HISTORIAL CLÍNICO =====

async function buscarPacientes(filtros) {
    const resultsContainer = document.getElementById('search-results');
    
    try {
        // Placeholder para endpoint real
        const queryParams = new URLSearchParams(filtros).toString();
        const response = await fetch(`/api/historial-clinico/buscar?${queryParams}`, {
            headers: { 'Authorization': `Bearer ${obtenerToken()}` }
        });
        
        if (!response.ok) throw new Error('Error al buscar pacientes');
        
        const pacientes = await response.json();
        
        if (pacientes.length > 0) {
            renderizarResultadosBusqueda(pacientes);
        } else {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3 class="empty-title">No se encontraron resultados</h3>
                    <p class="empty-description">No hay pacientes que coincidan con los criterios de búsqueda. Intenta con otros filtros.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al buscar pacientes:', error);
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3 class="empty-title">Error al buscar</h3>
                <p class="empty-description">No se pudieron cargar los resultados. Intenta nuevamente más tarde.</p>
            </div>
        `;
    }
}

function renderizarResultadosBusqueda(pacientes) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';
    
    pacientes.forEach(paciente => {
        const patientCard = document.createElement('div');
        patientCard.className = 'patient-card';
        patientCard.dataset.petId = paciente.id;
        
        patientCard.innerHTML = `
            <div class="patient-card-header">
                <div class="patient-icon">${obtenerIconoMascota(paciente.especie)}</div>
                <div class="patient-info">
                    <div class="patient-name">${paciente.nombre}</div>
                    <div class="patient-species">${paciente.especie} - ${paciente.raza}</div>
                </div>
            </div>
            <div class="last-consultation">
                Última consulta: ${formatearFecha(paciente.ultimaConsulta)} - ${paciente.motivoUltimaConsulta}
            </div>
            <div class="medical-conditions">
                Condiciones: ${paciente.condiciones || 'Ninguna registrada'}
            </div>
        `;
        
        resultsContainer.appendChild(patientCard);
    });
    
    // Event listener para abrir historial completo
    document.querySelectorAll('.patient-card').forEach(card => {
        card.addEventListener('click', function() {
            const petId = this.getAttribute('data-pet-id');
            abrirHistorialMedico(petId);
        });
    });
}

function abrirHistorialMedico(petId) {
    // Placeholder para cargar datos reales desde el backend
    console.log('Abriendo historial médico para mascota con ID:', petId);
    
    // En la implementación real, aquí se haría una llamada a:
    // fetch(`/api/historial-clinico/${petId}`, {
    //   headers: { 'Authorization': `Bearer ${obtenerToken()}` }
    // })
    
    // Para demostración, usar datos simulados
    const modal = document.getElementById('medical-history-modal');
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('active');
    
    // Actualizar contenido del modal con datos simulados
    document.getElementById('modal-pet-icon').textContent = '🐶';
    document.getElementById('modal-pet-name').textContent = 'Max';
    document.getElementById('modal-owner-name').textContent = 'Propietario: Carlos Martínez';
    document.getElementById('modal-pet-details').textContent = 'Perro - Labrador - 3 años';
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
    
    // Actualizar título del calendario con fecha actual
    const calendarDate = now.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('calendar-date').textContent = calendarDate.charAt(0).toUpperCase() + calendarDate.slice(1);
}

function obtenerToken() {
    return sessionStorage.getItem('authToken') || null;
}

function formatearFecha(fechaString) {
    if (!fechaString) return 'N/A';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

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

function obtenerClaseTipoConsulta(motivo) {
    motivo = motivo.toLowerCase();
    if (motivo.includes('vacuna') || motivo.includes('vacunación')) return 'vaccination';
    if (motivo.includes('cirugía') || motivo.includes('operación')) return 'surgery';
    if (motivo.includes('urgencia') || motivo.includes('emergencia')) return 'emergency';
    return '';
}

function mostrarError(mensaje) {
    console.error('Error:', mensaje);
    alert(`Error: ${mensaje}`);
}

// ===== EVENT LISTENERS =====

function configurarEventListeners() {
    // Búsqueda de pacientes
    document.querySelector('.search-btn').addEventListener('click', function() {
        const filtros = {
            termino: document.getElementById('patient-search').value.trim(),
            especie: document.getElementById('species-filter').value,
            condicion: document.getElementById('condition-filter').value
        };
        buscarPacientes(filtros);
    });
    
    // Cambiar vista del calendario
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const view = this.getAttribute('data-view');
            // En implementación real, aquí se cambiaría la vista del calendario
            console.log('Cambiando vista a:', view);
        });
    });
    
    // Navegación del calendario
    document.querySelector('.calendar-prev').addEventListener('click', function() {
        console.log('Navegar al día anterior');
        // En implementación real, aquí se cargarían las citas del día anterior
    });
    
    document.querySelector('.calendar-next').addEventListener('click', function() {
        console.log('Navegar al día siguiente');
        // En implementación real, aquí se cargarían las citas del día siguiente
    });
    
    // Cerrar modales
    document.getElementById('close-history-modal').addEventListener('click', function() {
        document.getElementById('medical-history-modal').classList.remove('active');
        document.getElementById('medical-history-modal').setAttribute('aria-hidden', 'true');
    });
    
    document.getElementById('close-consultation-modal').addEventListener('click', function() {
        document.getElementById('consultation-modal').classList.remove('active');
        document.getElementById('consultation-modal').setAttribute('aria-hidden', 'true');
    });
    
    // Cerrar modales al hacer clic fuera
    document.getElementById('medical-history-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
            this.setAttribute('aria-hidden', 'true');
        }
    });
    
    document.getElementById('consultation-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
            this.setAttribute('aria-hidden', 'true');
        }
    });
    
    // Tabs del historial médico
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            
            // Actualizar botones activos
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar contenido correspondiente
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tab}-tab`).classList.add('active');
        });
    });
    
    // Formulario de consulta
    document.getElementById('consultation-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            petId: document.getElementById('consultation-pet-id').value,
            fecha: document.getElementById('consultation-date').value,
            sintomas: document.getElementById('symptoms').value,
            diagnostico: document.getElementById('diagnosis').value,
            tratamiento: document.getElementById('treatment').value,
            medicamentos: [],
            recomendaciones: document.getElementById('recommendations').value,
            proximaCita: document.getElementById('next-appointment').value
        };
        
        // Recoger medicamentos
        document.querySelectorAll('.medication-row').forEach(row => {
            const nombre = row.querySelector('.medication-name').value;
            const dosis = row.querySelector('.medication-dose').value;
            const frecuencia = row.querySelector('.medication-frequency').value;
            
            if (nombre && dosis && frecuencia) {
                formData.medicamentos.push({ nombre, dosis, frecuencia });
            }
        });
        
        console.log('Enviando datos de consulta a Node.js:', formData);
        
        // En implementación real:
        // fetch('/api/consultas/registrar', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${obtenerToken()}`
        //   },
        //   body: JSON.stringify(formData)
        // })
        
        // Cerrar modal y mostrar mensaje de éxito
        document.getElementById('consultation-modal').classList.remove('active');
        document.getElementById('consultation-modal').setAttribute('aria-hidden', 'true');
        alert('¡Consulta registrada exitosamente!');
        
        // Recargar agenda diaria
        cargarAgendaDiaria();
    });
    
    // Botón para agregar medicamento
    document.querySelector('.add-medication').addEventListener('click', function() {
        const container = document.getElementById('medications-container');
        const newRow = document.createElement('div');
        newRow.className = 'medication-row';
        newRow.innerHTML = `
            <input type="text" class="form-input medication-name" placeholder="Nombre del medicamento" required>
            <input type="text" class="form-input medication-dose" placeholder="Dosis" required>
            <input type="text" class="form-input medication-frequency" placeholder="Frecuencia" required>
            <button type="button" class="btn btn-outline remove-medication">-</button>
        `;
        container.appendChild(newRow);
        
        // Event listener para eliminar medicamento
        newRow.querySelector('.remove-medication').addEventListener('click', function() {
            newRow.remove();
        });
    });
}

function abrirModalRegistrarConsulta(citaId, petId) {
    const modal = document.getElementById('consultation-modal');
    document.getElementById('consultation-pet-id').value = petId;
    document.getElementById('consultation-date').valueAsDate = new Date();
    
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('active');
    
    console.log('Abriendo modal para registrar consulta. Cita ID:', citaId, 'Mascota ID:', petId);
}

console.log('Dashboard veterinario inicializado - listo para conexión con Node.js');