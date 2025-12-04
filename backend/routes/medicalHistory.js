// backend/routes/medicalHistory.js
const express = require('express');
const router = express.Router();

// Ruta de prueba
router.get('/', (req, res) => {
    res.json({ message: '✅ Ruta de historial clínico funcionando' });
});

// Buscar historial por mascota (simulado)
router.get('/mascota/:petId', (req, res) => {
    const { petId } = req.params;
    res.json([
        {
            id: 1,
            fecha: '2025-05-15',
            motivo: 'Control anual',
            diagnostico: 'Saludable',
            tratamiento: 'Refuerzo de vacuna antirrábica',
            veterinario: { id: 3, nombre: 'Dra. Ana Rojas' }
        },
        {
            id: 2,
            fecha: '2025-03-20',
            motivo: 'Vacunación',
            diagnostico: 'Apto para vacunación',
            tratamiento: 'Vacuna polivalente',
            veterinario: { id: 3, nombre: 'Dra. Ana Rojas' }
        }
    ]);
});

module.exports = router;