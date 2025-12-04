// ../../js/registro-veterinario.js
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('veterinarian-register-form');
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirm-password');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const toggleConfirmPasswordBtn = document.getElementById('toggle-confirm-password');
    
    // Toggle visibility para contraseña
    togglePasswordBtn.addEventListener('click', function() {
        const isPassword = passwordField.type === 'password';
        passwordField.type = isPassword ? 'text' : 'password';
        this.querySelector('.eye-icon').style.display = isPassword ? 'none' : 'inline';
        this.querySelector('.eye-slash-icon').style.display = isPassword ? 'inline' : 'none';
    });
    
    // Toggle visibility para confirmar contraseña
    toggleConfirmPasswordBtn.addEventListener('click', function() {
        const isPassword = confirmPasswordField.type === 'password';
        confirmPasswordField.type = isPassword ? 'text' : 'password';
        this.querySelector('.eye-icon').style.display = isPassword ? 'none' : 'inline';
        this.querySelector('.eye-slash-icon').style.display = isPassword ? 'inline' : 'none';
    });
    
    // Validación en tiempo real
    passwordField.addEventListener('input', function() {
        validatePasswordMatch();
    });
    
    confirmPasswordField.addEventListener('input', function() {
        validatePasswordMatch();
    });
    
    function validatePasswordMatch() {
        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;
        const errorElement = document.getElementById('confirm-password-error');
        
        if (confirmPassword && password !== confirmPassword) {
            errorElement.textContent = 'Las contraseñas no coinciden';
            confirmPasswordField.classList.add('error');
        } else {
            errorElement.textContent = '';
            confirmPasswordField.classList.remove('error');
        }
    }
    
    // Validación al enviar el formulario
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let isValid = true;
        const requiredFields = [
            'nombres', 'apellidos', 'email', 'telefono', 'documento',
            'tarjeta-profesional', 'especialidad',
            'usuario', 'password', 'confirm-password'
        ];
        
        // Limpiar errores previos
        document.querySelectorAll('.form-error').forEach(el => {
            el.textContent = '';
        });
        
        // Validar campos requeridos
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const errorElement = document.getElementById(`${fieldId}-error`);
            
            if (!field.value.trim()) {
                errorElement.textContent = 'Este campo es requerido';
                field.classList.add('error');
                isValid = false;
            } else {
                field.classList.remove('error');
            }
        });
        
        // Validación específica de email
        const email = document.getElementById('email').value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            const emailError = document.getElementById('email-error');
            emailError.textContent = 'Ingrese un correo electrónico válido';
            document.getElementById('email').classList.add('error');
            isValid = false;
        }
        
        // Validación de coincidencia de contraseñas
        if (passwordField.value !== confirmPasswordField.value) {
            document.getElementById('confirm-password-error').textContent = 'Las contraseñas no coinciden';
            confirmPasswordField.classList.add('error');
            isValid = false;
        }
        
        // Validación de usuario (mínimo 4 caracteres)
        const usuario = document.getElementById('usuario').value;
        if (usuario && usuario.length < 4) {
            const usuarioError = document.getElementById('usuario-error');
            usuarioError.textContent = 'El usuario debe tener al menos 4 caracteres';
            document.getElementById('usuario').classList.add('error');
            isValid = false;
        }
        
        // Validación de tarjeta profesional (mínimo 5 caracteres)
        const tarjetaProfesional = document.getElementById('tarjeta-profesional').value;
        if (tarjetaProfesional && tarjetaProfesional.length < 5) {
            const tarjetaError = document.getElementById('tarjeta-profesional-error');
            tarjetaError.textContent = 'El número de tarjeta profesional debe tener al menos 5 caracteres';
            document.getElementById('tarjeta-profesional').classList.add('error');
            isValid = false;
        }
        
        if (isValid) {
            // Enviar formulario (simulado para Node.js)
            console.log('Formulario válido. Enviando a Node.js...');
            
            // Para demostración, redireccionar después de 1 segundo
            setTimeout(() => {
                alert('¡Registro exitoso! Será redirigido a su dashboard.');
                window.location.href = '../html-perfiles/veterinario.html';
            }, 1000);
        }
    });
});