// ../../js/citas-medicas.js
document.addEventListener('DOMContentLoaded', function() {
    // Cambiar vista según rol seleccionado
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Actualizar botones activos
            document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const role = this.getAttribute('data-role');
            
            // Mostrar/Ocultar secciones según rol
            if (role === 'veterinarian') {
                document.getElementById('schedule-section').style.display = 'none';
                document.getElementById('veterinarian-section').style.display = 'block';
                cargarCitasVeterinario();
            } else {
                document.getElementById('schedule-section').style.display = 'block';
                document.getElementById('veterinarian-section').style.display = 'none';
            }
        });
    });
    
    // Manejar envío del formulario de agendamiento
    document.getElementById('appointment-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validarFormulario()) {
            // En implementación real, aquí se enviaría a Node.js
            console.log('Formulario válido, enviando a Node.js...');
            
            // Mostrar mensaje de éxito
            mostrarMensaje('¡Cita programada exitosamente! Recibirás un correo de confirmación.', 'success');
            
            // Limpiar formulario
            this.reset();
        }
    });
    
    // Validación del formulario
    function validarFormulario() {
        let isValid = true;
        
        // Validar mascota
        const petSelect = document.getElementById('pet-select');
        const petError = document.getElementById('pet-error');
        if (!petSelect.value) {
            petError.textContent = 'Seleccione una mascota';
            isValid = false;
        } else {
            petError.textContent = '';
        }
        
        // Validar veterinario
        const vetSelect = document.getElementById('vet-select');
        const vetError = document.getElementById('vet-error');
        if (!vetSelect.value) {
            vetError.textContent = 'Seleccione un veterinario';
            isValid = false;
        } else {
            vetError.textContent = '';
        }
        
        // Validar fecha
        const dateInput = document.getElementById('appointment-date');
        const dateError = document.getElementById('date-error');
        if (!dateInput.value) {
            dateError.textContent = 'Seleccione una fecha';
            isValid = false;
        } else if (new Date(dateInput.value) < new Date()) {
            dateError.textContent = 'La fecha no puede ser anterior a hoy';
            isValid = false;
        } else {
            dateError.textContent = '';
        }
        
        // Validar hora
        const timeSelect = document.getElementById('appointment-time');
        const timeError = document.getElementById('time-error');
        if (!timeSelect.value) {
            timeError.textContent = 'Seleccione una hora';
            isValid = false;
        } else {
            timeError.textContent = '';
        }
        
        // Validar motivo
        const reasonInput = document.getElementById('appointment-reason');
        const reasonError = document.getElementById('reason-error');
        if (!reasonInput.value.trim()) {
            reasonError.textContent = 'Ingrese el motivo de la cita';
            isValid = false;
        } else if (reasonInput.value.length < 5) {
            reasonError.textContent = 'El motivo debe tener al menos 5 caracteres';
            isValid = false;
        } else {
            reasonError.textContent = '';
        }
        
        return isValid;
    }
    
    // Cargar citas para veterinario (simulado)
    function cargarCitasVeterinario() {
        const appointmentsList = document.getElementById('appointments-list');
        
        // Simular que no hay citas para hoy
        appointmentsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <h3 class="empty-title">No tienes citas programadas para hoy</h3>
                <p class="empty-description">Las citas aparecerán aquí cuando sean programadas por los propietarios o recepcionistas.</p>
            </div>
        `;
        
        /*
        // En implementación real con datos:
        const citas = [
            {
                id: 1,
                hora: '10:00',
                mascota: 'Max',
                propietario: 'Carlos Martínez',
                motivo: 'Control anual',
                estado: 'Confirmada'
            },
            {
                id: 2,
                hora: '14:30',
                mascota: 'Luna',
                propietario: 'Ana Gómez',
                motivo: 'Vacunación',
                estado: 'Confirmada'
            }
        ];
        
        if (citas.length === 0) {
            appointmentsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📅</div>
                    <h3 class="empty-title">No tienes citas programadas para hoy</h3>
                    <p class="empty-description">Las citas aparecerán aquí cuando sean programadas por los propietarios o recepcionistas.</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        citas.forEach(cita => {
            html += `
                <div class="appointment-item" data-cita-id="${cita.id}">
                    <div class="appointment-header">
                        <span class="appointment-time">${cita.hora}</span>
                        <span class="status-badge ${cita.estado.toLowerCase()}">${cita.estado}</span>
                    </div>
                    <div class="appointment-body">
                        <div class="appointment-pet">${cita.mascota}</div>
                        <div class="appointment-owner">Propietario: ${cita.propietario}</div>
                        <div class="appointment-reason">Motivo: ${cita.motivo}</div>
                    </div>
                    <div class="appointment-actions">
                        <button class="btn cancel-btn cancel-appointment-btn" data-cita-id="${cita.id}">Cancelar cita</button>
                    </div>
                </div>
            `;
        });
        
        appointmentsList.innerHTML = html;
        
        // Añadir event listeners a los botones de cancelar
        document.querySelectorAll('.cancel-appointment-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const citaId = this.getAttribute('data-cita-id');
                if (confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
                    cancelarCita(citaId);
                }
            });
        });
        */
    }
    
    // Cancelar cita (simulado)
    function cancelarCita(citaId) {
        console.log('Cancelando cita con ID:', citaId);
        
        // En implementación real:
        // fetch(`/api/citas/${citaId}/cancelar`, {
        //   method: 'PUT',
        //   headers: { 'Authorization': `Bearer ${obtenerToken()}` }
        // })
        
        // Mostrar mensaje
        mostrarMensaje('Cita cancelada exitosamente', 'success');
        
        // Recargar lista de citas
        cargarCitasVeterinario();
    }
    
    // Mostrar mensaje de éxito/error
    function mostrarMensaje(mensaje, tipo) {
        // Eliminar mensaje anterior si existe
        const existingMessage = document.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Crear nuevo mensaje
        const messageDiv = document.createElement('div');
        messageDiv.className = `form-message ${tipo}`;
        messageDiv.textContent = mensaje;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s, fadeOut 0.5s 2.5s;
        `;
        
        if (tipo === 'success') {
            messageDiv.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
        } else {
            messageDiv.style.background = 'linear-gradient(135deg, #f44336, #da190b)';
        }
        
        document.body.appendChild(messageDiv);
        
        // Eliminar mensaje después de 3 segundos
        setTimeout(() => {
            messageDiv.style.animation = 'fadeOut 0.5s';
            setTimeout(() => {
                messageDiv.remove();
            }, 500);
        }, 3000);
    }
    
    // Animaciones CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});

// En implementación real con Node.js, se añadirían funciones como:
// function obtenerToken() { return sessionStorage.getItem('authToken'); }
// function cargarCitasReales() { /* llamada a API */ }