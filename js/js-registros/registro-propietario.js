document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('owner-register-form');
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

    // Validación en tiempo real: coincidencia de contraseñas
    confirmPasswordField.addEventListener('input', function() {
        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;
        const errorElement = document.getElementById('confirm-password-error');
        if (password !== confirmPassword) {
            errorElement.textContent = 'Las contraseñas no coinciden';
            confirmPasswordField.classList.add('error');
        } else {
            errorElement.textContent = '';
            confirmPasswordField.classList.remove('error');
        }
    });

    // Validación al enviar
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        let isValid = true;

        // Lista de campos requeridos — ¡incluye 'usuario' ahora!
        const requiredFields = [
            'nombres', 'apellidos', 'email', 'telefono',
            'direccion', 'ciudad', 'departamento',
            'nombre-mascota', 'especie', 'raza', 'edad',
            'usuario', 'password', 'confirm-password'
        ];

        // Limpiar errores previos
        document.querySelectorAll('.form-error').forEach(el => {
            el.textContent = '';
        });
        document.querySelectorAll('.form-input, .form-select').forEach(el => {
            el.classList.remove('error');
        });

        // Validar campos requeridos
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const errorElement = document.getElementById(`${fieldId}-error`);
            if (!field || !field.value.trim()) {
                errorElement.textContent = 'Este campo es requerido';
                field.classList.add('error');
                isValid = false;
            }
        });

        // Validación específica de email
        const email = document.getElementById('email').value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            document.getElementById('email-error').textContent = 'Ingrese un correo electrónico válido';
            document.getElementById('email').classList.add('error');
            isValid = false;
        }

        // Validación de usuario: mínimo 4 caracteres (sin espacios al inicio/final)
        const usuarioInput = document.getElementById('usuario');
        const usuario = usuarioInput.value.trim();
        if (usuario && usuario.length < 4) {
            document.getElementById('usuario-error').textContent = 'El usuario debe tener al menos 4 caracteres';
            usuarioInput.classList.add('error');
            isValid = false;
        } else if (usuario && /\s/.test(usuario)) {
            document.getElementById('usuario-error').textContent = 'El usuario no debe contener espacios';
            usuarioInput.classList.add('error');
            isValid = false;
        }

        // Validación de coincidencia de contraseñas (redundante pero segura)
        const pass = passwordField.value;
        const confirmPass = confirmPasswordField.value;
        if (pass !== confirmPass) {
            document.getElementById('confirm-password-error').textContent = 'Las contraseñas no coinciden';
            confirmPasswordField.classList.add('error');
            isValid = false;
        }

        // ✅ Contraseña: SOLO se verifica que no esté vacía (ya cubierto por 'required')
        // No se aplican reglas de complejidad (tus preferencias respetadas)

        if (isValid) {
            // ✅ Formulario válido → listo para enviar a Node.js
            console.log('✅ Formulario válido. Enviando a /api/registrar/propietario...');
            // Aquí iría el fetch() real al backend cuando lo implementes:
            /*
            fetch('/api/registrar/propietario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombres: document.getElementById('nombres').value,
                    apellidos: document.getElementById('apellidos').value,
                    email: document.getElementById('email').value,
                    telefono: document.getElementById('telefono').value,
                    direccion: document.getElementById('direccion').value,
                    ciudad: document.getElementById('ciudad').value,
                    departamento: document.getElementById('departamento').value,
                    nombre_mascota: document.getElementById('nombre-mascota').value,
                    especie: document.getElementById('especie').value,
                    raza: document.getElementById('raza').value,
                    edad: document.getElementById('edad').value,
                    usuario: document.getElementById('usuario').value,
                    password: document.getElementById('password').value
                })
            })
            */
            alert('✅ Registro exitoso. (En producción, se enviaría al backend ahora.)');
            // window.location.href = '../html-perfiles/propietario.html';
        }
    });
});