// js/js-perfiles/dashboard-veterinario.js 
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
    window.currentUser = user;
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
        
        // 3. Cargar contadores
        await cargarContadores(usuario.id);
        
        // 4. Cargar todas las citas del veterinario
        await cargarTodasLasCitas(usuario.id);
        
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
        
        datetimeElement.textContent = now.toLocaleDateString('es-ES', options);
        
        const calendarOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        calendarDateElement.textContent = now.toLocaleDateString('es-ES', calendarOptions);
    }
    
    actualizar();
    setInterval(actualizar, 60000);
}

async function cargarContadores(veterinarioId) {
    try {
        // Obtener citas de hoy
        const responseHoy = await fetch(`/api/veterinario/${veterinarioId}/citas/hoy`);
        const dataHoy = await responseHoy.json();
        
        // Obtener todas las citas (para contar pendientes)
        const responseTodas = await fetch(`/api/citas?id_veterinario=${veterinarioId}&estado=programada`);
        const dataTodas = await responseTodas.json();
        
        if (dataHoy.success) {
            document.getElementById('today-appointments').textContent = dataHoy.citas.length;
        }
        
        if (dataTodas.success) {
            document.getElementById('pending-appointments').textContent = dataTodas.citas.length;
        }
    } catch (error) {
        console.error('❌ Error al cargar contadores:', error);
        document.getElementById('today-appointments').textContent = '0';
        document.getElementById('pending-appointments').textContent = '0';
    }
}

async function cargarTodasLasCitas(veterinarioId) {
    const scheduleContainer = document.getElementById('daily-schedule');
    if (!scheduleContainer) return;
    
    try {
        console.log(`Cargando todas las citas para veterinario ID: ${veterinarioId}`);
        
        // Obtener todas las citas del veterinario (no solo las de hoy)
        const response = await fetch(`/api/citas?id_veterinario=${veterinarioId}&estado=programada`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Datos recibidos:', data);
        
        if (data.success && data.citas && data.citas.length > 0) {
            console.log(`${data.citas.length} citas encontradas en total`);
            
            // Organizar citas por fecha
            const citasPorFecha = {};
            
            data.citas.forEach(cita => {
                if (!citasPorFecha[cita.fecha]) {
                    citasPorFecha[cita.fecha] = [];
                }
                citasPorFecha[cita.fecha].push(cita);
            });
            
            // Ordenar fechas (más cercanas primero)
            const fechasOrdenadas = Object.keys(citasPorFecha).sort();
            
            // Renderizar todas las citas agrupadas por fecha
            renderizarTodasLasCitas(citasPorFecha, fechasOrdenadas);
        } else {
            console.log('No hay citas programadas');
            scheduleContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📅</div>
                    <h3 class="empty-title">No tienes citas programadas</h3>
                    <p class="empty-description">Las citas aparecerán aquí cuando sean agendadas.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ Error al cargar citas:', error);
        scheduleContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3 class="empty-title">Error al cargar citas</h3>
                <p class="empty-description">No se pudieron cargar las citas. Intenta nuevamente más tarde.</p>
            </div>
        `;
    }
}

function renderizarTodasLasCitas(citasPorFecha, fechasOrdenadas) {
    const scheduleContainer = document.getElementById('daily-schedule');
    scheduleContainer.innerHTML = '';
    
    const hoy = new Date().toISOString().split('T')[0];
    
    fechasOrdenadas.forEach(fecha => {
        const citas = citasPorFecha[fecha];
        
        // Crear separador de fecha
        const fechaDiv = document.createElement('div');
        fechaDiv.className = 'fecha-separator';
        
        let textoFecha = formatearFechaLarga(fecha);
        if (fecha === hoy) {
            textoFecha = '🔴 HOY - ' + textoFecha;
        }
        
        fechaDiv.innerHTML = `<h3>${textoFecha}</h3>`;
        scheduleContainer.appendChild(fechaDiv);
        
        // Ordenar citas por hora
        citas.sort((a, b) => a.hora.localeCompare(b.hora));
        
        // Renderizar cada cita
        citas.forEach(cita => {
            const appointmentSlot = document.createElement('div');
            appointmentSlot.className = 'appointment-slot';
            appointmentSlot.dataset.citaId = cita.id;
            appointmentSlot.dataset.petId = cita.id_mascota;
            
            // Formatear hora (eliminar segundos)
            const horaFormateada = cita.hora.substring(0,5);
            
            // Determinar ícono según especie
            const icono = obtenerIconoMascota(cita.especie || '');
            
            appointmentSlot.innerHTML = `
                <div class="appointment-time">${horaFormateada}</div>
                <div class="appointment-owner">${cita.propietario_nombre || 'Propietario no especificado'}</div>
                <div class="appointment-pet">
                    <span class="appointment-pet-icon">${icono}</span>
                    ${cita.mascota_nombre || 'Mascota sin nombre'}
                </div>
                <div class="appointment-reason">Motivo: ${cita.motivo || 'No especificado'}</div>
                <div class="appointment-actions">
                    <button class="btn btn-outline view-history-btn" data-pet-id="${cita.id_mascota}">
                        Ver historial
                    </button>
                    <button class="btn btn-primary register-consultation-btn" data-pet-id="${cita.id_mascota}">
                        Iniciar expediente
                    </button>
                </div>
            `;
            scheduleContainer.appendChild(appointmentSlot);
        });
    });
    
    // Event listeners para los botones
    document.querySelectorAll('.view-history-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const petId = this.getAttribute('data-pet-id');
            window.location.href = `/historial?petId=${petId}`;
        });
    });
    
    document.querySelectorAll('.register-consultation-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const petId = this.getAttribute('data-pet-id');
            window.location.href = `/historial?petId=${petId}`;
        });
    });
}

function configurarBusquedaPacientes() {
    const searchInput = document.getElementById('patient-search');
    const searchBtn = document.querySelector('.search-btn');
    const resultsContainer = document.getElementById('search-results');
    
    if (!searchInput || !resultsContainer) return;
    
    let timeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(timeout);
        const termino = this.value.trim();
        
        if (termino.length < 2) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <p>Escribe al menos 2 caracteres para buscar</p>
                </div>
            `;
            return;
        }
        
        timeout = setTimeout(async () => {
            try {
                const response = await fetch(`/api/mascotas/buscar?termino=${encodeURIComponent(termino)}`);
                const data = await response.json();
                
                if (data.success && data.mascotas.length > 0) {
                    resultsContainer.innerHTML = data.mascotas.map(m => `
                        <div class="patient-card" onclick="window.location.href='/historial?petId=${m.id}'">
                            <div class="patient-card-header">
                                <div class="patient-icon">${obtenerIconoMascota(m.especie)}</div>
                                <div class="patient-info">
                                    <div class="patient-name">${m.nombre}</div>
                                    <div class="patient-species">${m.especie} - ${m.raza || 'Sin raza'}</div>
                                </div>
                            </div>
                            <div class="last-consultation">
                                Propietario: ${m.propietario_nombre}
                            </div>
                        </div>
                    `).join('');
                } else {
                    resultsContainer.innerHTML = `
                        <div class="empty-state">
                            <p>No se encontraron pacientes</p>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error en búsqueda:', error);
            }
        }, 500);
    });
}

// ===== CONFIGURACIÓN DE EVENT LISTENERS =====
function configurarEventListeners(usuario) {
    console.log('🔧 Configurando event listeners para veterinario...');
    
    // Botón de cerrar sesión
    configurarLogoutButtons();
    
    // Navegación del calendario (simplificada)
    const prevBtn = document.querySelector('.calendar-prev');
    const nextBtn = document.querySelector('.calendar-next');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            console.log('◀️  Calendario: día anterior');
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            console.log('▶️  Calendario: día siguiente');
        });
    }
}

function configurarLogoutButtons() {
    const logoutLinks = document.querySelectorAll('a[href="/login"]');
    
    logoutLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        });
    });
}

// ===== FUNCIONES DE UTILIDAD =====

function formatearFecha(fechaString) {
    if (!fechaString) return 'N/A';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function formatearFechaLarga(fechaString) {
    if (!fechaString) return 'N/A';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
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
    return iconos[especie?.toLowerCase()] || '🐾';
}

function mostrarError(mensaje) {
    console.error('❌ Error:', mensaje);
    alert(`Error: ${mensaje}`);
}

console.log('✅ dashboard-veterinario.js cargado correctamente');