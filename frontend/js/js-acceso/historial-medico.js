// frontend/js/js-acceso/historial-medico.js
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== HISTORIAL MÉDICO INICIANDO ===');
    
    // Verificar sesión
    const userData = localStorage.getItem('user');
    if (!userData) {
        window.location.href = '/login';
        return;
    }
    
    const user = JSON.parse(userData);
    window.currentUser = user;
    
    // Obtener ID de mascota de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const petId = urlParams.get('petId');
    
    if (!petId) {
        alert('No se especificó una mascota');
        window.location.href = '/dashboard-propietario';
        return;
    }
    
    window.currentPetId = petId;
    
    // Configurar menú según rol
    configurarMenu(user.rol);
    
    // Cargar datos de la mascota
    await cargarDatosMascota(petId);
    
    // Cargar historial
    await cargarHistorial(petId);
    
    // Cargar vacunas
    await cargarVacunas(petId);
    
    // Configurar tabs
    configurarTabs();
    
    // Configurar botones según rol
    if (user.rol === 'veterinario') {
        document.getElementById('new-consultation-btn').style.display = 'block';
        document.getElementById('new-consultation-btn').onclick = () => abrirModalConsulta();
    }
    
    // Configurar modales
    configurarModales();
});

function configurarMenu(rolUsuario) {
    const navList = document.getElementById('main-menu');
    if (!navList) return;
    
    let menuItems = '';
    
    if (rolUsuario === 'propietario') {
        menuItems = `
            <li><a href="/" class="nav-link">Inicio</a></li>
            <li><a href="/dashboard-propietario" class="nav-link">Mi Panel</a></li>
            <li><a href="/citas" class="nav-link">Citas</a></li>
            <li><a href="/historial" class="nav-link active">Historial</a></li>
            <li><a href="/login" class="nav-link">Cerrar Sesión</a></li>
        `;
    } else if (rolUsuario === 'veterinario') {
        menuItems = `
            <li><a href="/" class="nav-link">Inicio</a></li>
            <li><a href="/dashboard-veterinario" class="nav-link">Mi Panel</a></li>
            <li><a href="/citas" class="nav-link">Citas</a></li>
            <li><a href="/historial" class="nav-link active">Historial</a></li>
            <li><a href="/login" class="nav-link">Cerrar Sesión</a></li>
        `;
    }
    
    navList.innerHTML = menuItems;
}

async function cargarDatosMascota(petId) {
    try {
        const response = await fetch(`/api/mascotas/propietario/${petId}`);
        const data = await response.json();
        
        if (data.success && data.mascotas.length > 0) {
            const mascota = data.mascotas[0];
            
            document.getElementById('pet-name').textContent = mascota.nombre;
            document.getElementById('pet-species').textContent = `${mascota.especie} - ${mascota.raza || 'Sin raza'}`;
            document.getElementById('pet-age').textContent = mascota.edad || '?';
            
            // Obtener datos del propietario
            const userResponse = await fetch(`/api/usuario/${window.currentUser.id}`);
            const userData = await userResponse.json();
            
            document.getElementById('owner-name').textContent = userData.nombre;
            document.getElementById('owner-phone').textContent = userData.telefono || 'No especificado';
            
            document.getElementById('patient-section').style.display = 'block';
        }
    } catch (error) {
        console.error('Error al cargar datos de mascota:', error);
    }
}

async function cargarHistorial(petId) {
    const container = document.getElementById('historial-list');
    
    try {
        const response = await fetch(`/api/historial/mascota/${petId}`);
        const data = await response.json();
        
        if (data.success && data.historial.length > 0) {
            container.innerHTML = data.historial.map(entry => `
                <div class="historial-item" onclick="verDetalleConsulta(${entry.id})">
                    <div class="historial-header">
                        <span class="historial-fecha">${formatearFecha(entry.fecha)}</span>
                        <span class="historial-vet">Dr. ${entry.veterinario_nombre}</span>
                    </div>
                    <div class="historial-body">
                        <p><strong>Motivo:</strong> ${entry.motivo_consulta}</p>
                        <p><strong>Diagnóstico:</strong> ${entry.diagnostico.substring(0,100)}...</p>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="empty-state">No hay consultas registradas</div>';
        }
    } catch (error) {
        console.error('Error al cargar historial:', error);
        container.innerHTML = '<div class="error-state">Error al cargar historial</div>';
    }
}

async function cargarVacunas(petId) {
    const container = document.getElementById('vacunas-list');
    
    try {
        const response = await fetch(`/api/vacunas/mascota/${petId}`);
        const data = await response.json();
        
        if (data.success && data.vacunas.length > 0) {
            container.innerHTML = `
                <table class="vacunas-table">
                    <thead>
                        <tr>
                            <th>Vacuna</th>
                            <th>Fecha</th>
                            <th>Próxima dosis</th>
                            <th>Lote</th>
                            <th>Veterinario</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.vacunas.map(v => `
                            <tr>
                                <td>${v.nombre}</td>
                                <td>${formatearFecha(v.fecha_aplicacion)}</td>
                                <td>${v.fecha_proxima ? formatearFecha(v.fecha_proxima) : '-'}</td>
                                <td>${v.lote || '-'}</td>
                                <td>${v.veterinario_nombre}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            container.innerHTML = '<div class="empty-state">No hay vacunas registradas</div>';
        }
    } catch (error) {
        console.error('Error al cargar vacunas:', error);
        container.innerHTML = '<div class="error-state">Error al cargar vacunas</div>';
    }
}

function configurarTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            document.getElementById(`${tab}-tab`).classList.add('active');
        });
    });
}

function configurarModales() {
    // Modal de consulta
    const consultaModal = document.getElementById('consulta-modal');
    const closeConsulta = document.getElementById('close-consulta-modal');
    const cancelConsulta = document.getElementById('cancel-consulta');
    
    closeConsulta.onclick = () => consultaModal.style.display = 'none';
    cancelConsulta.onclick = () => consultaModal.style.display = 'none';
    
    // Modal de vacuna
    const vacunaModal = document.getElementById('vacuna-modal');
    const closeVacuna = document.getElementById('close-vacuna-modal');
    
    closeVacuna.onclick = () => vacunaModal.style.display = 'none';
    
    document.getElementById('new-vaccine-btn').onclick = () => {
        document.getElementById('vacuna-mascota-id').value = window.currentPetId;
        vacunaModal.style.display = 'block';
    };
    
    // Cerrar modales al hacer clic fuera
    window.onclick = function(event) {
        if (event.target === consultaModal) consultaModal.style.display = 'none';
        if (event.target === vacunaModal) vacunaModal.style.display = 'none';
    };
    
    // Agregar medicamento
    document.getElementById('add-medicamento').onclick = agregarMedicamento;
    
    // Formulario de consulta
    document.getElementById('consulta-form').onsubmit = guardarConsulta;
    
    // Formulario de vacuna
    document.getElementById('vacuna-form').onsubmit = guardarVacuna;
}

function agregarMedicamento() {
    const container = document.getElementById('medicamentos-container');
    const medIndex = container.children.length;
    
    const medDiv = document.createElement('div');
    medDiv.className = 'medicamento-item';
    medDiv.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <input type="text" placeholder="Medicamento" class="form-input med-nombre" required>
            </div>
            <div class="form-group">
                <input type="text" placeholder="Dosis" class="form-input med-dosis" required>
            </div>
            <div class="form-group">
                <input type="text" placeholder="Frecuencia" class="form-input med-frecuencia" required>
            </div>
            <div class="form-group">
                <input type="text" placeholder="Duración" class="form-input med-duracion">
            </div>
            <button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    container.appendChild(medDiv);
}

async function guardarConsulta(e) {
    e.preventDefault();
    
    const user = window.currentUser;
    const petId = window.currentPetId;
    
    // Recoger medicamentos
    const medicamentos = [];
    document.querySelectorAll('.medicamento-item').forEach(item => {
        medicamentos.push({
            nombre: item.querySelector('.med-nombre').value,
            dosis: item.querySelector('.med-dosis').value,
            frecuencia: item.querySelector('.med-frecuencia').value,
            duracion: item.querySelector('.med-duracion').value || null
        });
    });
    
    const consultaData = {
        fecha: document.getElementById('consulta-fecha').value,
        motivo_consulta: document.getElementById('consulta-motivo').value,
        sintomas: document.getElementById('consulta-sintomas').value || null,
        diagnostico: document.getElementById('consulta-diagnostico').value,
        tratamiento: document.getElementById('consulta-tratamiento').value,
        recomendaciones: document.getElementById('consulta-recomendaciones').value || null,
        peso: document.getElementById('consulta-peso').value || null,
        temperatura: document.getElementById('consulta-temperatura').value || null,
        id_mascota: petId,
        id_veterinario: user.id,
        proxima_cita: document.getElementById('consulta-proxima-cita').value || null,
        medicamentos: medicamentos
    };
    
    try {
        const response = await fetch('/api/historial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(consultaData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Consulta guardada exitosamente');
            document.getElementById('consulta-modal').style.display = 'none';
            cargarHistorial(petId);
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error al guardar consulta:', error);
        alert('Error al conectar con el servidor');
    }
}

async function guardarVacuna(e) {
    e.preventDefault();
    
    const user = window.currentUser;
    
    const vacunaData = {
        nombre: document.getElementById('vacuna-nombre').value,
        fecha_aplicacion: document.getElementById('vacuna-fecha').value,
        fecha_proxima: document.getElementById('vacuna-proxima').value || null,
        lote: document.getElementById('vacuna-lote').value || null,
        id_mascota: window.currentPetId,
        id_veterinario: user.id
    };
    
    try {
        const response = await fetch('/api/vacunas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vacunaData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Vacuna registrada');
            document.getElementById('vacuna-modal').style.display = 'none';
            cargarVacunas(window.currentPetId);
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error al registrar vacuna:', error);
        alert('Error al conectar con el servidor');
    }
}

function abrirModalConsulta() {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('consulta-fecha').value = hoy;
    document.getElementById('consulta-mascota-id').value = window.currentPetId;
    document.getElementById('medicamentos-container').innerHTML = '';
    document.getElementById('consulta-modal').style.display = 'block';
}

window.verDetalleConsulta = async function(id) {
    try {
        const response = await fetch(`/api/historial/${id}`);
        const data = await response.json();
        
        if (data.success) {
            const consulta = data.consulta;
            const medicamentos = data.medicamentos || [];
            
            const contenido = document.getElementById('detalle-contenido');
            contenido.innerHTML = `
                <p><strong>Fecha:</strong> ${formatearFecha(consulta.fecha)}</p>
                <p><strong>Veterinario:</strong> ${consulta.veterinario_nombre}</p>
                <p><strong>Motivo:</strong> ${consulta.motivo_consulta}</p>
                <p><strong>Síntomas:</strong> ${consulta.sintomas || 'No registrados'}</p>
                <p><strong>Diagnóstico:</strong> ${consulta.diagnostico}</p>
                <p><strong>Tratamiento:</strong> ${consulta.tratamiento}</p>
                <p><strong>Recomendaciones:</strong> ${consulta.recomendaciones || 'Ninguna'}</p>
                ${consulta.peso ? `<p><strong>Peso:</strong> ${consulta.peso} kg</p>` : ''}
                ${consulta.temperatura ? `<p><strong>Temperatura:</strong> ${consulta.temperatura} °C</p>` : ''}
                
                ${medicamentos.length > 0 ? `
                    <h4>Medicamentos recetados:</h4>
                    <ul>
                        ${medicamentos.map(m => `
                            <li>${m.nombre} - ${m.dosis} - ${m.frecuencia} ${m.duracion ? `(por ${m.duracion})` : ''}</li>
                        `).join('')}
                    </ul>
                ` : ''}
                
                ${consulta.proxima_cita ? `
                    <p><strong>Próxima cita:</strong> ${formatearFecha(consulta.proxima_cita)}</p>
                ` : ''}
            `;
            
            document.getElementById('detalle-consulta-modal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error al cargar detalle:', error);
    }
};

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Cerrar modal de detalle
document.getElementById('close-detalle-modal').onclick = () => {
    document.getElementById('detalle-consulta-modal').style.display = 'none';
};