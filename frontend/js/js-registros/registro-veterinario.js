// frontend/js/js-registros/registro-veterinario.js
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('veterinarian-register-form');
    
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
            documento: document.getElementById('documento').value,
            tarjeta_profesional: document.getElementById('tarjeta-profesional').value,
            especialidad: document.getElementById('especialidad').value,
            usuario: document.getElementById('usuario').value,
            password: document.getElementById('password').value,
            confirm_password: document.getElementById('confirm-password').value
        };
        
        try {
            const response = await fetch('/api/registrar/veterinario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('✅ Veterinario registrado exitosamente. Serás redirigido al login.');
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