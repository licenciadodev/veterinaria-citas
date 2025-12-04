// ../../js/historial-medico.js (versión conectable con Node.js)
document.addEventListener('DOMContentLoaded', async function() {
    // Obtener ID de la mascota desde la URL (ej: ?petId=123)
    const urlParams = new URLSearchParams(window.location.search);
    const petId = urlParams.get('petId');
    
    if (!petId) {
        console.error('No se encontró ID de mascota en la URL');
        mostrarMensaje('No se pudo cargar el historial. Falta el ID de la mascota.', 'error');
        return;
    }
    
    try {
        // 1. Verificar sesión del veterinario
        const currentUser = await obtenerDatosUsuario();
        if (!currentUser || currentUser.role !== 'veterinario') {
            window.location.href = '../inicio-sesion.html';
            return;
        }
        
        // 2. Intentar cargar datos del paciente
        await cargarHistorialCompleto(petId);
        
    } catch (error) {
        console.error('Error al cargar el historial médico:', error);
        mostrarMensaje('No se pudo cargar el historial médico. Por favor, intenta nuevamente.', 'error');
    }
});

// ===== FUNCIONES PRINCIPALES =====

// Obtener datos del usuario autenticado (veterinario)
async function obtenerDatosUsuario() {
    try {
        const response = await fetch('/api/usuario/logueado', {
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Sesión no válida');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        return null;
    }
}

// Cargar todo el historial médico
async function cargarHistorialCompleto(petId) {
    try {
        // Cargar datos del paciente
        const patientData = await cargarDatosPaciente(petId);
        
        if (!patientData) {
            mostrarEstadoVacio();
            return;
        }
        
        // Mostrar datos del paciente
        mostrarDatosPaciente(patientData);
        
        // Cargar y mostrar consultas médicas
        const consultas = await cargarConsultas(petId);
        mostrarConsultas(consultas);
        
        // Cargar y mostrar vacunas
        const vacunas = await cargarVacunas(petId);
        mostrarVacunas(vacunas);
        
    } catch (error) {
        console.error('Error al cargar el historial completo:', error);
        mostrarEstadoVacio();
    }
}

// Cargar datos básicos del paciente
async function cargarDatosPaciente(petId) {
    try {
        const response = await fetch(`/api/mascotas/${petId}`, {
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`
            }
        });
        
        if (response.status === 404) {
            return null;
        }
        
        if (!response.ok) {
            throw new Error('Error al cargar datos del paciente');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error al cargar datos del paciente:', error);
        return null;
    }
}

// Cargar consultas médicas del paciente
async function cargarConsultas(petId) {
    try {
        const response = await fetch(`/api/consultas/mascota/${petId}`, {
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`
            }
        });
        
        if (response.status === 404) {
            return [];
        }
        
        if (!response.ok) {
            throw new Error('Error al cargar consultas');
        }
        
        const consultas = await response.json();
        // Ordenar de más reciente a más antigua
        return consultas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    } catch (error) {
        console.error('Error al cargar consultas:', error);
        return [];
    }
}

// Cargar vacunas del paciente
async function cargarVacunas(petId) {
    try {
        const response = await fetch(`/api/vacunas/mascota/${petId}`, {
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`
            }
        });
        
        if (response.status === 404) {
            return { vacunasAplicadas: [], proximaVacuna: null };
        }
        
        if (!response.ok) {
            throw new Error('Error al cargar vacunas');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error al cargar vacunas:', error);
        return { vacunasAplicadas: [], proximaVacuna: null };
    }
}

// ===== FUNCIONES DE RENDERIZADO =====

// Mostrar datos del paciente en la UI
function mostrarDatosPaciente(datos) {
    document.getElementById('pet-name').textContent = datos.nombre || '-';
    document.getElementById('owner-name').textContent = datos.propietario?.nombres 
        ? `${datos.propietario.nombres} ${datos.propietario.apellidos}`
        : '-';
    document.getElementById('pet-species-breed').textContent = 
        `${datos.especie || '-'} - ${datos.raza || '-'}`;
    document.getElementById('pet-age').textContent = datos.edad 
        ? `${datos.edad} años`
        : '-';
    
    // Actualizar ícono según especie
    const petIcon = document.querySelector('.patient-icon span');
    petIcon.textContent = obtenerIconoMascota(datos.especie);
    petIcon.style.opacity = '1';
    
    // Remover clase empty-state
    document.querySelector('.patient-card').classList.remove('empty-state');
}

// Mostrar consultas médicas en la UI
function mostrarConsultas(consultas) {
    const container = document.getElementById('consultations-list');
    
    if (consultas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3 class="empty-title">No hay consultas médicas registradas</h3>
                <p class="empty-description">No se han realizado consultas médicas para esta mascota aún. Las consultas aparecerán aquí después de ser registradas por el veterinario.</p>
            </div>
        `;
        container.classList.add('empty-container');
        return;
    }
    
    let html = '';
    consultas.forEach(consulta => {
        html += `
            <div class="consultation-item">
                <div class="consultation-header">
                    <h3 class="consultation-date">${formatearFechaLarga(consulta.fecha)}</h3>
                    <span class="consultation-vet">${consulta.veterinario?.nombre || 'Sin veterinario'}</span>
                </div>
                <div class="consultation-body">
                    <p><strong>Motivo:</strong> ${consulta.motivo || 'Sin motivo especificado'}</p>
                    <p><strong>Diagnóstico:</strong> ${consulta.diagnostico || 'Sin diagnóstico'}</p>
                    <p><strong>Tratamiento:</strong> ${consulta.tratamiento || 'Sin tratamiento'}</p>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    container.classList.remove('empty-container');
}

// Mostrar vacunas en la UI
function mostrarVacunas(vacunasData) {
    const tableBody = document.getElementById('vaccines-table-body');
    const nextVaccineElement = document.getElementById('next-vaccine-info');
    
    // Vacunas aplicadas
    if (vacunasData.vacunasAplicadas && vacunasData.vacunasAplicadas.length > 0) {
        let html = '';
        vacunasData.vacunasAplicadas.forEach(vacuna => {
            html += `
                <tr>
                    <td>${vacuna.nombre || 'Vacuna desconocida'}</td>
                    <td>${formatearFechaCorta(vacuna.fecha)}</td>
                    <td>${vacuna.veterinario?.nombre || 'Sin veterinario'}</td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
    } else {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="empty-table-cell">
                    <div class="empty-state">
                        <p>No hay vacunas registradas para esta mascota.</p>
                    </div>
                </td>
            </tr>
        `;
    }
    
    // Próxima vacuna
    if (vacunasData.proximaVacuna) {
        nextVaccineElement.textContent = 
            `${vacunasData.proximaVacuna.nombre} - ${formatearFechaLarga(vacunasData.proximaVacuna.fechaProxima)}`;
        nextVaccineElement.style.color = var(--primary-color);
        nextVaccineElement.style.fontStyle = 'normal';
    } else {
        nextVaccineElement.textContent = 'No hay vacunas pendientes actualmente';
        nextVaccineElement.style.color = var(--gray-color);
        nextVaccineElement.style.fontStyle = 'italic';
    }
}

// Mostrar estado vacío inicial
function mostrarEstadoVacio() {
    // Datos del paciente (vacío)
    document.getElementById('pet-name').textContent = '-';
    document.getElementById('owner-name').textContent = '-';
    document.getElementById('pet-species-breed').textContent = '-';
    document.getElementById('pet-age').textContent = '-';
    document.querySelector('.patient-icon span').style.opacity = '0.3';
    
    // Consultas médicas (vacío)
    const container = document.getElementById('consultations-list');
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3 class="empty-title">No hay consultas médicas registradas</h3>
            <p class="empty-description">No se han realizado consultas médicas para esta mascota aún. Las consultas aparecerán aquí después de ser registradas por el veterinario.</p>
        </div>
    `;
    container.classList.add('empty-container');
    
    // Vacunas (vacío)
    document.getElementById('vaccines-table-body').innerHTML = `
        <tr>
            <td colspan="3" class="empty-table-cell">
                <div class="empty-state">
                    <p>No hay vacunas registradas para esta mascota.</p>
                </div>
            </td>
        </tr>
    `;
    document.getElementById('next-vaccine-info').textContent = 'No hay vacunas pendientes actualmente';
    document.getElementById('next-vaccine-info').style.color = var(--gray-color);
    document.getElementById('next-vaccine-info').style.fontStyle = 'italic';
}

// ===== FUNCIONES DE UTILIDAD =====

function obtenerToken() {
    return sessionStorage.getItem('authToken') || null;
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

function formatearFechaLarga(fechaString) {
    if (!fechaString) return '-';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatearFechaCorta(fechaString) {
    if (!fechaString) return '-';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function mostrarMensaje(mensaje, tipo = 'info') {
    console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
    // En implementación real, esto podría mostrar un toast o alert mejorado
    if (tipo === 'error') {
        alert(`Error: ${mensaje}`);
    }
}

console.log('Historial médico inicializado - listo para conexión con Node.js');