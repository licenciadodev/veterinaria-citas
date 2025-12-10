// js/js-perfiles/dashboard-veterinario.js - VERSIÓN COMPLETA CON RUTAS AMIGABLES
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== DASHBOARD VETERINARIO INICIANDO ===');
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
    if (user.rol !== 'veterinario') {
        console.log(`❌ Acceso denegado. Rol: ${user.rol}, se requiere: veterinario`);
        alert('No tienes permiso para acceder a esta página');
        window.location.href = '/';
        return;
    }
    
    // 4. CARGAR DASHBOARD
    console.log('📊 Cargando dashboard para veterinario:', user.nombre);
    await cargarDashboard(user);
    
    // 5. CONFIGURAR EVENT LISTENERS
    configurarEventListeners(user);
});

// ===== FUNCIONES PRINCIPALES =====

async function cargarDashboard(usuario) {
    console.log('🎨 Renderizando dashboard veterinario...');
    
    try {
        // 1. Actualizar información del usuario
        actualizarInfoUsuario(usuario);
        
        // 2. Configurar fecha y hora
        configurarFechaHora();
        
        // 3. Cargar contadores (simulados por ahora)
        await cargarContadores();
        
        // 4. Cargar agenda diaria
        await cargarAgendaDiaria();
        
        // 5. Configurar búsqueda de pacientes
        configurarBusquedaPacientes();
        
        console.log('✅ Dashboard veterinario cargado exitosamente');
    } catch (error) {
        console.error('❌ Error al cargar dashboard:', error);
        mostrarError('Error al cargar el dashboard. Por favor, recarga la página.');
    }
}

// ===== FUNCIONES DE RENDERIZADO =====

function actualizarInfoUsuario(usuario) {
    // Actualizar saludo
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = usuario.nombre || 'Dr. Veterinario';
    }
}

function configurarFechaHora() {
    const datetimeElement = document.getElementById('current-datetime');
    const calendarDateElement = document.getElementById('calendar-date');
    
    if (!datetimeElement || !calendarDateElement) return;
    
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
        
        // Actualizar fecha y hora general
        datetimeElement.textContent = now.toLocaleDateString('es-ES', options);
        
        // Actualizar fecha del calendario
        const calendarOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        calendarDateElement.textContent = now.toLocaleDateString('es-ES', calendarOptions);
    }
    
    // Actualizar inmediatamente y cada minuto
    actualizar();
    setInterval(actualizar, 60000);
}

async function cargarContadores() {
    try {
        // Simular llamadas a API
        const citasHoy = [
            { id: 1, hora: '09:00', duracion: 30 },
            { id: 2, hora: '10:30', duracion: 45 },
            { id: 3, hora: '14:00', duracion: 60 }
        ];
        
        const citasPendientes = [
            { id: 4, fecha: '2024-01-17', hora: '11:00' },
            { id: 5, fecha: '2024-01-18', hora: '15:30' },
            { id: 6, fecha: '2024-01-19', hora: '10:00' },
            { id: 7, fecha: '2024-01-20', hora: '09:30' }
        ];
        
        document.getElementById('today-appointments').textContent = citasHoy.length;
        document.getElementById('pending-appointments').textContent = citasPendientes.length;
        
    } catch (error) {
        console.error('❌ Error al cargar contadores:', error);
        // Mantener valores por defecto
        document.getElementById('today-appointments').textContent = '0';
        document.getElementById('pending-appointments').textContent = '0';
    }
}

async function cargarAgendaDiaria() {
    const scheduleContainer = document.getElementById('daily-schedule');
    if (!scheduleContainer) return;
    
    try {
        // Simular datos de citas de hoy
        const citasHoy = [
            {
                id: 1,
                hora: '09:00',
                duracion: 30,
                propietario: { nombres: 'Juan', apellidos: 'Pérez' },
                mascota: {
                    id: 101,
                    nombre: 'Firulais',
                    especie: 'perro',
                    raza: 'Labrador',
                    edad: 3,
                    alergias: 'Ninguna',
                    condiciones: 'Saludable'
                },
                motivo: 'Control anual',
                ultimaVisita: '2023-12-15'
            },
            {
                id: 2,
                hora: '10:30',
                duracion: 45,
                propietario: { nombres: 'María', apellidos: 'García' },
                mascota: {
                    id: 102,
                    nombre: 'Mishi',
                    especie: 'gato',
                    raza: 'Siamés',
                    edad: 2,
                    alergias: 'Polen',
                    condiciones: 'Asma leve'
                },
                motivo: 'Vacunación anual',
                ultimaVisita: '2023-11-20'
            },
            {
                id: 3,
                hora: '14:00',
                duracion: 60,
                propietario: { nombres: 'Carlos', apellidos: 'López' },
                mascota: {
                    id: 103,
                    nombre: 'Rex',
                    especie: 'perro',
                    raza: 'Pastor Alemán',
                    edad: 5,
                    alergias: 'Ninguna',
                    condiciones: 'Artritis'
                },
                motivo: 'Consulta por cojera',
                ultimaVisita: '2023-10-10'
            }
        ];
        
        if (citasHoy.length > 0) {
            renderizarAgendaDiaria(citasHoy);
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
        console.error('❌ Error al cargar agenda diaria:', error);
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

function configurarBusquedaPacientes() {
    const searchInput = document.getElementById('patient-search');
    const speciesFilter = document.getElementById('species-filter');
    const conditionFilter = document.getElementById('condition-filter');
    const searchBtn = document.querySelector('.search-btn');
    const resultsContainer = document.getElementById('search-results');
    
    if (!searchInput || !resultsContainer) return;
    
    // Simular resultados de búsqueda
    const pacientesEjemplo = [
        {
            id: 101,
            nombre: 'Firulais',
            especie: 'perro',
            raza: 'Labrador',
            ultimaConsulta: '2023-12-15',
            motivoUltimaConsulta: 'Control anual',
            condiciones: 'Saludable'
        },
        {
            id: 102,
            nombre: 'Mishi',
            especie: 'gato',
            raza: 'Siamés',
            ultimaConsulta: '2023-11-20',
            motivoUltimaConsulta: 'Vacunación anual',
            condiciones: 'Asma leve'
        },
        {
            id: 103,
            nombre: 'Rex',
            especie: 'perro',
            raza: 'Pastor Alemán',
            ultimaConsulta: '2023-10-10',
            motivoUltimaConsulta: 'Consulta por cojera',
            condiciones: 'Artritis'
        }
    ];
    
    function mostrarResultados(pacientes) {
        if (pacientes.length > 0) {
            resultsContainer.innerHTML = pacientes.map(paciente => {
                return `
                    <div class="patient-card" data-pet-id="${paciente.id}">
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
                    </div>
                `;
            }).join('');
            
            // Event listener para abrir historial completo
            document.querySelectorAll('.patient-card').forEach(card => {
                card.addEventListener('click', function() {
                    const petId = this.getAttribute('data-pet-id');
                    abrirHistorialMedico(petId);
                });
            });
        } else {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3 class="empty-title">No se encontraron pacientes</h3>
                    <p class="empty-description">Utiliza los filtros para encontrar registros clínicos de pacientes.</p>
                </div>
            `;
        }
    }
    
    // Mostrar pacientes de ejemplo inicialmente
    mostrarResultados(pacientesEjemplo);
    
    // Configurar búsqueda
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const termino = searchInput.value.trim().toLowerCase();
            const especie = speciesFilter.value;
            const condicion = conditionFilter.value;
            
            const resultados = pacientesEjemplo.filter(paciente => {
                const matchTermino = termino === '' || 
                    paciente.nombre.toLowerCase().includes(termino) ||
                    paciente.raza.toLowerCase().includes(termino);
                
                const matchEspecie = especie === '' || paciente.especie === especie;
                const matchCondicion = condicion === '' || 
                    (paciente.condiciones && paciente.condiciones.toLowerCase().includes(condicion));
                
                return matchTermino && matchEspecie && matchCondicion;
            });
            
            mostrarResultados(resultados);
            console.log(`🔍 Búsqueda: "${termino}" - ${resultados.length} resultados`);
        });
    }
}

// ===== CONFIGURACIÓN DE EVENT LISTENERS =====
function configurarEventListeners(usuario) {
    console.log('🔧 Configurando event listeners para veterinario...');
    
    // 1. Botón de cerrar sesión
    configurarLogoutButtons();
    
    // 2. Cambiar vista del calendario
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const view = this.getAttribute('data-view');
            console.log(`📅 Cambiando vista a: ${view}`);
            alert(`Vista ${view} - En desarrollo`);
        });
    });
    
    // 3. Navegación del calendario
    const prevBtn = document.querySelector('.calendar-prev');
    const nextBtn = document.querySelector('.calendar-next');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            console.log('◀️  Calendario: día anterior');
            alert('Navegación del calendario - En desarrollo');
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            console.log('▶️  Calendario: día siguiente');
            alert('Navegación del calendario - En desarrollo');
        });
    }
    
    // 4. Cerrar modales
    const closeHistoryModal = document.getElementById('close-history-modal');
    const closeConsultationModal = document.getElementById('close-consultation-modal');
    
    if (closeHistoryModal) {
        closeHistoryModal.addEventListener('click', function() {
            document.getElementById('medical-history-modal').classList.remove('active');
            document.getElementById('medical-history-modal').setAttribute('aria-hidden', 'true');
        });
    }
    
    if (closeConsultationModal) {
        closeConsultationModal.addEventListener('click', function() {
            document.getElementById('consultation-modal').classList.remove('active');
            document.getElementById('consultation-modal').setAttribute('aria-hidden', 'true');
        });
    }
    
    // 5. Cerrar modales al hacer clic fuera
    const historyModal = document.getElementById('medical-history-modal');
    const consultationModal = document.getElementById('consultation-modal');
    
    if (historyModal) {
        historyModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                this.setAttribute('aria-hidden', 'true');
            }
        });
    }
    
    if (consultationModal) {
        consultationModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                this.setAttribute('aria-hidden', 'true');
            }
        });
    }
    
    // 6. Tabs del historial médico
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            
            // Actualizar botones activos
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar contenido correspondiente
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
                content.classList.remove('active');
            });
            const targetTab = document.getElementById(`${tab}-tab`);
            if (targetTab) {
                targetTab.style.display = 'block';
                targetTab.classList.add('active');
            }
        });
    });
    
    // 7. Formulario de consulta
    const consultationForm = document.getElementById('consultation-form');
    if (consultationForm) {
        consultationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📤 Formulario de consulta enviado');
            alert('Consulta registrada exitosamente (simulación)');
            consultationModal.classList.remove('active');
            consultationModal.setAttribute('aria-hidden', 'true');
        });
    }
    
    // 8. Botón para agregar medicamento
    const addMedicationBtn = document.querySelector('.add-medication');
    if (addMedicationBtn) {
        addMedicationBtn.addEventListener('click', function() {
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
    
    console.log('✅ Event listeners configurados para veterinario');
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

function abrirHistorialMedico(petId) {
    console.log(`📋 Abriendo historial médico para mascota ID: ${petId}`);
    
    const modal = document.getElementById('medical-history-modal');
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        
        // Aquí se cargarían los datos reales del historial médico
        // Por ahora, mantener los datos simulados del HTML
    }
}

function abrirModalRegistrarConsulta(citaId, petId) {
    console.log(`📝 Abriendo modal para registrar consulta. Cita ID: ${citaId}, Mascota ID: ${petId}`);
    
    const modal = document.getElementById('consultation-modal');
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        
        // Establecer fecha actual como fecha de consulta
        const consultationDate = document.getElementById('consultation-date');
        if (consultationDate) {
            const today = new Date().toISOString().split('T')[0];
            consultationDate.value = today;
        }
        
        // Establecer ID de la mascota
        const petIdInput = document.getElementById('consultation-pet-id');
        if (petIdInput) {
            petIdInput.value = petId;
        }
    }
}

// ===== FUNCIONES DE UTILIDAD =====

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
    console.error('❌ Error:', mensaje);
    alert(`Error: ${mensaje}`);
}

// ===== INICIALIZACIÓN FINAL =====
console.log('✅ dashboard-veterinario.js cargado completamente');