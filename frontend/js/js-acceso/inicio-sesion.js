// frontend/js/js-acceso/inicio-sesion.js - VERSIÓN MEJORADA SIN ALERTS
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== INICIO-SESION.JS CARGADO ===');
    
    // === Elementos del DOM ===
    const modal = document.getElementById('login-modal');
    const modalOverlay = modal ? modal.querySelector('.modal-overlay') : null;
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelLoginBtn = document.getElementById('cancel-login-btn');
    const loginForm = document.getElementById('login-form');
    const loginRoleButtons = document.querySelectorAll('.login-role-btn');
    const modalRoleDisplay = document.getElementById('modal-role-display');
    const modalRoleInput = document.getElementById('modal-role-input');
    const modalUsername = document.getElementById('modal-username');
    const modalPassword = document.getElementById('modal-password');
    const usernameError = document.getElementById('modal-username-error');
    const passwordError = document.getElementById('modal-password-error');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const loginMessage = document.getElementById('login-message'); // Elemento para mensajes

    let selectedRole = '';

    // Crear elemento para mensajes si no existe
    if (!loginMessage && loginForm) {
        const messageDiv = document.createElement('div');
        messageDiv.id = 'login-message';
        messageDiv.className = 'login-message';
        messageDiv.style.display = 'none';
        loginForm.parentNode.insertBefore(messageDiv, loginForm);
    }

    // === FUNCIÓN: Mostrar mensaje elegante ===
    function showMessage(message, type = 'info') {
        const messageElement = document.getElementById('login-message') || loginMessage;
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = `login-message ${type}`;
            messageElement.style.display = 'block';
            
            // Ocultar después de 3 segundos para mensajes de éxito
            if (type === 'success') {
                setTimeout(() => {
                    messageElement.style.display = 'none';
                }, 3000);
            }
        } else {
            // Fallback: usar console.log
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // === FUNCIÓN: Limpiar mensajes ===
    function clearMessages() {
        const messageElement = document.getElementById('login-message') || loginMessage;
        if (messageElement) {
            messageElement.style.display = 'none';
        }
        clearErrors();
    }

    // === FUNCIÓN: Mostrar error en formulario ===
    function showError(field, errorElement, message) {
        if (errorElement && field) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            field.classList.add('error');
            field.focus();
        }
        showMessage(message, 'error');
    }

    // === FUNCIÓN: Limpiar errores ===
    function clearErrors() {
        [usernameError, passwordError].forEach(el => {
            if (el) {
                el.textContent = '';
                el.style.display = 'none';
            }
        });
        
        [modalUsername, modalPassword].forEach(el => {
            if (el) {
                el.classList.remove('error');
            }
        });
        
        // También limpiar mensaje general
        showMessage('', 'info');
    }

    // === FUNCIÓN: Mostrar estado de carga ===
    function showLoading(show = true) {
        const submitButton = loginForm ? loginForm.querySelector('button[type="submit"]') : null;
        if (submitButton) {
            if (show) {
                submitButton.dataset.originalText = submitButton.textContent;
                submitButton.textContent = 'Iniciando sesión...';
                submitButton.disabled = true;
                submitButton.classList.add('loading');
            } else {
                submitButton.textContent = submitButton.dataset.originalText || 'Iniciar sesión';
                submitButton.disabled = false;
                submitButton.classList.remove('loading');
            }
        }
    }

    // === FUNCIÓN: Redirigir por rol ===
    function redirectByRole(rol) {
        console.log(`🎯 Redirigiendo a dashboard para rol: ${rol}`);
        
        const routes = {
            'propietario': '/dashboard-propietario',
            'recepcionista': '/dashboard-recepcionista', 
            'veterinario': '/dashboard-veterinario'
        };
        
        const redirectUrl = routes[rol];
        
        if (!redirectUrl) {
            console.error(`❌ Rol no válido: ${rol}`);
            showMessage('Error: Rol de usuario no válido', 'error');
            return;
        }
        
        // Mostrar mensaje de redirección
        showMessage(`¡Bienvenido! Redirigiendo a tu panel...`, 'success');
        
        // Redirigir después de 1 segundo (suficiente para ver el mensaje)
        setTimeout(() => {
            if (window.location.pathname !== redirectUrl) {
                window.location.href = redirectUrl;
            }
        }, 1000);
    }

    // === EVENTO: Abrir modal desde botones de rol ===
    if (loginRoleButtons.length > 0) {
        loginRoleButtons.forEach(button => {
            button.addEventListener('click', function() {
                selectedRole = this.dataset.role;
                
                // Mostrar nombre amigable del rol
                const roleNames = {
                    'propietario': 'Propietario',
                    'recepcionista': 'Recepcionista',
                    'veterinario': 'Veterinario'
                };
                
                if (modalRoleDisplay) {
                    modalRoleDisplay.textContent = roleNames[selectedRole] || selectedRole;
                }
                
                if (modalRoleInput) {
                    modalRoleInput.value = selectedRole;
                }
                
                showModal();
            });
        });
    }

    // === FUNCIÓN: Mostrar modal ===
    function showModal() {
        if (modal) {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            if (modalUsername) {
                setTimeout(() => modalUsername.focus(), 100);
            }
        }
    }

    // === FUNCIÓN: Ocultar modal ===
    function hideModal() {
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            if (loginForm) {
                loginForm.reset();
            }
            clearErrors();
            clearMessages();
            selectedRole = '';
            if (modalRoleInput) {
                modalRoleInput.value = '';
            }
        }
    }

    // === EVENTOS: Cerrar modal ===
    [closeModalBtn, cancelLoginBtn, modalOverlay].forEach(element => {
        if (element) {
            element.addEventListener('click', hideModal);
        }
    });

    // Cerrar modal con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            hideModal();
        }
    });

    // === EVENTO: Mostrar/ocultar contraseña ===
    if (togglePasswordBtn && modalPassword) {
        togglePasswordBtn.addEventListener('click', function() {
            const type = modalPassword.type === 'password' ? 'text' : 'password';
            modalPassword.type = type;
            this.textContent = type === 'password' ? '👁️' : '🙈';
            this.setAttribute('aria-label', type === 'password' ? 'Mostrar contraseña' : 'Ocultar contraseña');
        });
    }

    // === EVENTO: Enviar formulario (MEJORADO) ===
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearErrors();
            clearMessages();

            const username = modalUsername ? modalUsername.value.trim() : '';
            const password = modalPassword ? modalPassword.value.trim() : '';
            
            // === VALIDACIÓN ===
            if (!username) {
                showError(modalUsername, usernameError, 'Por favor, ingresa tu usuario');
                return;
            }
            
            if (!password) {
                showError(modalPassword, passwordError, 'Por favor, ingresa tu contraseña');
                return;
            }

            console.log(`📤 Enviando login: usuario="${username}"`);
            showLoading(true);
            showMessage('Conectando con el servidor...', 'info');

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                });

                const data = await response.json();
                console.log('📥 Respuesta del servidor:', data);

                if (data.success) {
                    console.log('✅ Login exitoso! Usuario:', data.user);
                    
                    // 1. Guardar en localStorage
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    // 2. Mostrar mensaje de éxito
                    showMessage(`¡Bienvenido ${data.user.nombre}!`, 'success');
                    showLoading(false);
                    
                    // 3. Cerrar modal suavemente
                    setTimeout(() => {
                        hideModal();
                    }, 500);
                    
                    // 4. Redirigir según el rol (automáticamente después de 1.5 segundos)
                    setTimeout(() => {
                        redirectByRole(data.user.rol);
                    }, 1500);
                    
                } else {
                    // Error del servidor
                    showLoading(false);
                    
                    let mensajeError = data.error;
                    if (data.error.includes('no encontrado')) {
                        mensajeError = 'Usuario no encontrado. Prueba con: juan, maria, carlos, ana, recepcion';
                    } else if (data.error.includes('incorrecta')) {
                        mensajeError = 'Contraseña incorrecta. La contraseña es: 123456';
                    }
                    
                    showError(modalPassword, passwordError, mensajeError);
                }

            } catch (error) {
                console.error('💥 Error de conexión:', error);
                showLoading(false);
                showError(modalPassword, passwordError, 
                    'Error de conexión. Verifica que el servidor esté corriendo en http://localhost:3000');
            }
        });
    }

    // === FUNCIÓN LOGOUT (global) ===
    window.logout = function() {
        console.log('👋 Cerrando sesión...');
        
        // Mostrar mensaje de despedida
        const user = getCurrentUser();
        const userName = user ? user.nombre : '';
        
        // Limpiar datos de sesión
        localStorage.removeItem('user');
        
        // Redirigir a login con mensaje
        window.location.href = '/login';
    };

    // === PRUEBA DE CONEXIÓN ===
    console.log('🔍 Probando conexión con servidor...');
    fetch('/api/test')
        .then(res => res.ok ? console.log('✅ Servidor conectado') : console.warn('⚠️  Servidor con error'))
        .catch(() => console.error('❌ No hay servidor en http://localhost:3000'));
        
    console.log('=== FIN INICIO-SESION.JS ===');
});

// === FUNCIONES GLOBALES PARA OTRAS PÁGINAS ===

// Verificar si hay usuario logueado
function isUserLoggedIn() {
    try {
        const userData = localStorage.getItem('user');
        if (!userData) return false;
        
        const user = JSON.parse(userData);
        return user && user.id && user.rol;
    } catch {
        return false;
    }
}

// Obtener usuario actual
function getCurrentUser() {
    try {
        const userData = localStorage.getItem('user');
        if (!userData) return null;
        
        return JSON.parse(userData);
    } catch {
        return null;
    }
}

// Verificar rol específico
function hasRole(role) {
    const user = getCurrentUser();
    return user && user.rol === role;
}

// Proteger ruta por rol
function protectRoute(requiredRole = null) {
    const user = getCurrentUser();
    
    if (!user) {
        console.warn('❌ No hay usuario, acceso denegado');
        return false;
    }
    
    if (requiredRole && user.rol !== requiredRole) {
        console.warn(`❌ Rol incorrecto: ${user.rol}, se requiere: ${requiredRole}`);
        return false;
    }
    
    console.log(`✅ Acceso permitido para rol: ${user.rol}`);
    return true;
}

// Hacer funciones globales
window.isUserLoggedIn = isUserLoggedIn;
window.getCurrentUser = getCurrentUser;
window.hasRole = hasRole;
window.protectRoute = protectRoute;
window.logout = window.logout || function() {
    localStorage.removeItem('user');
    window.location.href = '/login';
};

console.log('✅ Funciones globales de inicio-sesion.js cargadas');