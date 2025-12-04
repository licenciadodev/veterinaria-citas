// js/js-acceso/inicio-sesion.js
document.addEventListener('DOMContentLoaded', function() {
    // === Elementos del DOM ===
    const modal = document.getElementById('login-modal');
    const modalOverlay = modal.querySelector('.modal-overlay');
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

    let selectedRole = '';

    // === Funciones de utilidad ===
    function showModal() {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        modalUsername.focus();
    }

    function hideModal() {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        loginForm.reset();
        clearErrors();
    }

    function clearErrors() {
        usernameError.textContent = '';
        passwordError.textContent = '';
        modalUsername.classList.remove('error');
        modalPassword.classList.remove('error');
    }

    function showError(field, errorElement, message) {
        errorElement.textContent = message;
        field.classList.add('error');
    }

    // === Eventos: abrir modal desde tarjetas ===
    loginRoleButtons.forEach(button => {
        button.addEventListener('click', function() {
            selectedRole = this.dataset.role;
            // Mostrar nombre del rol en el título
            const roleNames = {
                'propietario': 'Propietario',
                'recepcionista': 'Recepcionista',
                'veterinario': 'Veterinario'
            };
            modalRoleDisplay.textContent = roleNames[selectedRole] || selectedRole;
            modalRoleInput.value = selectedRole;
            showModal();
        });
    });

    // === Eventos: cerrar modal ===
    closeModalBtn.addEventListener('click', hideModal);
    cancelLoginBtn.addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', hideModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            hideModal();
        }
    });

    // === Evento: enviar formulario ===
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearErrors();

        const username = modalUsername.value.trim();
        const password = modalPassword.value.trim();
        let isValid = true;

        // Validación básica
        if (!username) {
            showError(modalUsername, usernameError, 'El usuario es obligatorio');
            isValid = false;
        }
        if (!password) {
            showError(modalPassword, passwordError, 'La contraseña es obligatoria');
            isValid = false;
        }
        if (!selectedRole) {
            showError(modalPassword, passwordError, 'Seleccione un rol primero');
            isValid = false;
        }

        if (!isValid) return;

        // ✅ ENVIAR A NODE.JS
        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password,
                    role: selectedRole
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Guardar datos en sesión
                sessionStorage.setItem('user', JSON.stringify({
                    username: data.user.username,
                    role: data.user.role
                }));
                // Redirigir
                window.location.href = data.redirect;
            } else {
                showError(modalPassword, passwordError, data.message || 'Credenciales incorrectas');
            }
        } catch (error) {
            console.error('Error de red:', error);
            showError(modalPassword, passwordError, 'Error de conexión. Verifique que el servidor esté activo.');
        }
    });
});