// frontend/js/js-perfiles/dashboard-propietario.js - VERSIÓN COMPLETA CORREGIDA
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DASHBOARD PROPIETARIO INICIANDO ===');
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
    if (user.rol !== 'propietario') {
        console.log(`❌ Acceso denegado. Rol: ${user.rol}, se requiere: propietario`);
        alert('No tienes permiso para acceder a esta página');
        window.location.href = '/';
        return;
    }
    
    // 4. CARGAR DASHBOARD
    console.log('📊 Cargando dashboard para:', user.nombre);
    cargarDashboard(user);
    
    // 5. CONFIGURAR EVENT LISTENERS
    configurarEventListeners(user);
});

// ===== FUNCIÓN PRINCIPAL =====
function cargarDashboard(usuario) {
    console.log('🎨 Renderizando dashboard...');
    
    // 1. Actualizar información del usuario
    actualizarInfoUsuario(usuario);
    
    // 2. Cargar mascotas (simulación por ahora)
    cargarMascotasSimuladas();
    
    // 3. Cargar citas (simulación por ahora)
    cargarCitasSimuladas();
    
    // 4. Configurar fecha y hora
    configurarFechaHora();
    
    // 5. Actualizar estado de botones
    actualizarEstadoBotones();
    
    console.log('✅ Dashboard cargado exitosamente');
}

// ===== FUNCIONES DE RENDERIZADO =====

function actualizarInfoUsuario(usuario) {
    // Actualizar saludo
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = usuario.nombre || 'Usuario';
    }
    
    // Llenar formulario de datos personales si existe
    llenarFormularioDatosPersonales(usuario);
}

function llenarFormularioDatosPersonales(usuario) {
    // Solo si el modal/formulario existe
    if (!document.getElementById('user-names')) return;
    
    // Separar nombres y apellidos si están en un solo campo
    const nombreCompleto = usuario.nombre || '';
    const espacioIndex = nombreCompleto.indexOf(' ');
    
    const nombres = espacioIndex > 0 ? nombreCompleto.substring(0, espacioIndex) : nombreCompleto;
    const apellidos = espacioIndex > 0 ? nombreCompleto.substring(espacioIndex + 1) : '';
    
    document.getElementById('user-names').value = nombres;
    document.getElementById('user-surnames').value = apellidos;
    document.getElementById('user-email').value = usuario.email || '';
    document.getElementById('user-phone').value = usuario.telefono || '';
    document.getElementById('user-address').value = usuario.direccion || '';
    document.getElementById('user-city').value = usuario.ciudad || '';
    document.getElementById('user-department').value = usuario.departamento || '';
}

function cargarMascotasSimuladas() {
    const petsContainer = document.getElementById('pets-container');
    if (!petsContainer) return;
    
    // Por ahora mostrar estado vacío
    // En producción, aquí harías fetch a /api/mascotas
    petsContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">🐾</div>
            <h3 class="empty-title">No tienes mascotas registradas</h3>
            <p class="empty-description">Agrega tu primera mascota para comenzar a gestionar sus citas y cuidados médicos.</p>
            <button class="btn btn-primary" id="add-first-pet-btn">Agregar mi primera mascota</button>
        </div>
    `;
    
    // Configurar botón
    const addFirstPetBtn = document.getElementById('add-first-pet-btn');
    if (addFirstPetBtn) {
        addFirstPetBtn.addEventListener('click', function() {
            console.log('📝 Botón "Agregar mascota" clickeado');
            abrirModalNuevaMascota();
        });
    }
}

function cargarCitasSimuladas() {
    const appointmentsContainer = document.getElementById('appointments-container');
    if (!appointmentsContainer) return;
    
    // Por ahora mostrar estado vacío
    appointmentsContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📅</div>
            <h3 class="empty-title">No tienes citas programadas</h3>
            <p class="empty-description">Una vez que agregues tus mascotas, podrás agendar citas médicas desde aquí.</p>
            <button class="btn btn-primary" id="schedule-first-appointment-btn" disabled>Agendar primera cita</button>
        </div>
    `;
    
    // Configurar notificaciones (también vacías por ahora)
    const notificationsContainer = document.getElementById('notifications-container');
    if (notificationsContainer) {
        notificationsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔔</div>
                <h3 class="empty-title">No tienes notificaciones nuevas</h3>
                <p class="empty-description">Recibirás notificaciones sobre vacunas, resultados de exámenes y mensajes de nuestros veterinarios.</p>
            </div>
        `;
    }
}

function configurarFechaHora() {
    const datetimeElement = document.getElementById('current-datetime');
    if (!datetimeElement) return;
    
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
    }
    
    // Actualizar inmediatamente y cada minuto
    actualizar();
    setInterval(actualizar, 60000);
}

function actualizarEstadoBotones() {
    // Verificar si hay mascotas (por ahora siempre false)
    const hasPets = false;
    
    // Actualizar estado de botones según haya mascotas o no
    const buttonsToDisable = [
        'modify-appointment-btn',
        'cancel-appointment-btn',
        'schedule-first-appointment-btn'
    ];
    
    buttonsToDisable.forEach(btnId => {
        const button = document.getElementById(btnId);
        if (button) {
            button.disabled = !hasPets;
        }
    });
}

// ===== FUNCIONES DE INTERACCIÓN =====

function abrirModalNuevaMascota() {
    console.log('📝 Abriendo modal para nueva mascota');
    alert('Funcionalidad de agregar mascota - En desarrollo\n\nEn la versión completa, esto abriría un formulario para registrar una nueva mascota.');
}

function abrirModalActualizarDatos() {
    const modal = document.getElementById('personal-data-modal');
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        console.log('📋 Modal de datos personales abierto');
    }
}

// ===== CONFIGURACIÓN DE EVENT LISTENERS =====

function configurarEventListeners(usuario) {
    console.log('🔧 Configurando event listeners...');
    
    // 1. Botón "Agregar mascota" en el header
    const addPetBtn = document.getElementById('add-pet-btn');
    if (addPetBtn) {
        addPetBtn.addEventListener('click', abrirModalNuevaMascota);
    }
    
    // 2. Botón "Actualizar mis datos"
    const updateDataBtn = document.getElementById('update-personal-data-btn');
    if (updateDataBtn) {
        updateDataBtn.addEventListener('click', abrirModalActualizarDatos);
    }
    
    // 3. Botón "Agendar nueva cita" (ya es un enlace <a> en el HTML)
    // No necesita event listener adicional
    
    // 4. Botón "Ver historial médico" (ya es un enlace <a> en el HTML)
    // No necesita event listener adicional
    
    // 5. Cerrar modal de datos personales
    const closeModalBtn = document.getElementById('close-personal-data-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            const modal = document.getElementById('personal-data-modal');
            if (modal) {
                modal.classList.remove('active');
                modal.setAttribute('aria-hidden', 'true');
                console.log('📋 Modal de datos personales cerrado');
            }
        });
    }
    
    // 6. Cerrar modal al hacer clic fuera
    const personalDataModal = document.getElementById('personal-data-modal');
    if (personalDataModal) {
        personalDataModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                this.setAttribute('aria-hidden', 'true');
                console.log('📋 Modal cerrado (click fuera)');
            }
        });
    }
    
    // 7. Manejar envío del formulario de datos personales
    const personalDataForm = document.getElementById('personal-data-form');
    if (personalDataForm) {
        personalDataForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📤 Formulario de datos personales enviado');
            
            // Simular envío
            setTimeout(() => {
                // Actualizar nombre en el saludo
                const nombres = document.getElementById('user-names').value;
                const apellidos = document.getElementById('user-surnames').value;
                const nombreCompleto = `${nombres} ${apellidos}`.trim();
                
                document.getElementById('user-name').textContent = nombreCompleto;
                
                // Cerrar modal
                if (personalDataModal) {
                    personalDataModal.classList.remove('active');
                    personalDataModal.setAttribute('aria-hidden', 'true');
                }
                
                alert('✅ ¡Tus datos personales han sido actualizados exitosamente!');
                console.log('✅ Datos personales actualizados:', nombreCompleto);
            }, 1000);
        });
    }
    
    // 8. Configurar botones de logout
    configurarLogoutButtons();
    
    console.log('✅ Event listeners configurados');
}

function configurarLogoutButtons() {
    // Encontrar todos los enlaces que apuntan a /login (logout)
    const logoutLinks = document.querySelectorAll('a[href="/login"]');
    
    logoutLinks.forEach(link => {
        // Guardar el evento original si existe
        const originalClick = link.onclick;
        
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            console.log('👋 Cerrar sesión solicitado');
            
            // Confirmar antes de cerrar sesión
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                // Limpiar datos de sesión
                localStorage.removeItem('user');
                
                // Mostrar mensaje
                alert('Sesión cerrada exitosamente');
                
                // Redirigir a login
                window.location.href = '/login';
            }
        });
    });
    
    console.log(`🔐 ${logoutLinks.length} botones de logout configurados`);
}

// ===== FUNCIONES DE DEBUG/UTILIDAD =====

function verificarEstadoSesion() {
    const userData = localStorage.getItem('user');
    console.log('🔍 Estado de sesión:', userData ? 'ACTIVA' : 'INACTIVA');
    
    if (userData) {
        try {
            const user = JSON.parse(userData);
            console.log('📋 Datos del usuario:', user);
            return user;
        } catch (e) {
            console.error('❌ Datos corruptos en localStorage');
            return null;
        }
    }
    return null;
}

// ===== INICIALIZACIÓN ADICIONAL =====
console.log('✅ dashboard-propietario.js cargado completamente');

// Hacer algunas funciones disponibles globalmente si es necesario
window.verificarEstadoSesion = verificarEstadoSesion;
window.recargarDashboard = function() {
    const user = verificarEstadoSesion();
    if (user) {
        cargarDashboard(user);
    }
};