// frontend/js/js-registros/registro-recepcionista.js
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('receptionist-register-form');
    
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Limpiar errores
        document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
        
        // Recoger datos
        const formData = {
            nombres: document.getElementById('nombres').value,
            apellidos: document.getElementById('apellidos').value,
            email: document.getElementById('email').value,
            telefono: document.getElementById('telefono').value,
            fecha_ingreso: document.getElementById('fecha-ingreso').value,
            turno: document.getElementById('turno').value,
            usuario: document.getElementById('usuario').value,
            password: document.getElementById('password').value,
            confirm_password: document.getElementById('confirm-password').value
        };
        
        try {
            const response = await fetch('/api/registrar/recepcionista', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('✅ Recepcionista registrado exitosamente. Serás redirigido al login.');
                window.location.href = '/login';
            } else {
                if (result.errors) {
                    result.errors.forEach(error => {
                        const errorElement = document.getElementById(`${error.campo}-error`);
                        if (errorElement) {
                            errorElement.textContent = error.mensaje;
                            document.getElementById(error.campo)?.classList.add('error');
                        }
                    });
                } else {
                    alert('Error: ' + (result.error || 'Error al registrar'));
                }
            }
        } catch (error) {
            alert('Error de conexión con el servidor');
        }
    });
});