-- 1. Crear base de datos
CREATE DATABASE IF NOT EXISTS veterinaria_db;
USE veterinaria_db;

-- 2. Tabla USUARIOS (según registro.html)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,           -- campo en registro.html
    email VARCHAR(100) UNIQUE NOT NULL,     -- campo en registro.html
    password VARCHAR(255) NOT NULL,         -- campo en registro.html
    telefono VARCHAR(15),                   -- campo en registro.html
    rol ENUM('propietario', 'veterinario', 'recepcionista') DEFAULT 'propietario'
);

-- 3. Tabla MASCOTAS (según mascotas.html)
CREATE TABLE mascotas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,           -- campo en mascotas.html
    especie VARCHAR(50) NOT NULL,           -- campo en mascotas.html
    raza VARCHAR(50),                       -- campo en mascotas.html
    edad INT,                               -- campo en mascotas.html
    peso DECIMAL(5,2),                      -- campo en mascotas.html
    id_propietario INT NOT NULL,
    FOREIGN KEY (id_propietario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 4. Tabla CITAS (según citas.html)
CREATE TABLE citas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,                    -- campo en citas.html
    hora TIME NOT NULL,                     -- campo en citas.html
    motivo TEXT NOT NULL,                   -- campo en citas.html (textarea)
    nombre_mascota VARCHAR(100) NOT NULL,   -- campo en citas.html (input text)
    id_veterinario INT NOT NULL,            -- campo en citas.html (select)
    estado ENUM('activa', 'cancelada') DEFAULT 'activa',
    FOREIGN KEY (id_veterinario) REFERENCES usuarios(id)
);

-- 5. Insertar datos de prueba (CONTRASEÑA: 123456)
INSERT INTO usuarios (nombre, email, password, telefono, rol) VALUES
('Juan Pérez', 'juan@email.com', '$2b$10$7V4Fq3q5q1q1q1q1q1q1qO', '555-1234', 'propietario'),
('María García', 'maria@email.com', '$2b$10$7V4Fq3q5q1q1q1q1q1qO', '555-5678', 'propietario'),
('Dr. Carlos López', 'carlos@vet.com', '$2b$10$7V4Fq3q5q1q1q1q1q1qO', '555-9012', 'veterinario'),
('Dra. Ana Martínez', 'ana@vet.com', '$2b$10$7V4Fq3q5q1q1q1q1q1qO', '555-3456', 'veterinario'),
('Recepcionista Uno', 'recepcion@vet.com', '$2b$10$7V4Fq3q5q1q1q1q1q1qO', '555-7890', 'recepcionista');

-- Mascotas (según formulario mascotas.html)
INSERT INTO mascotas (nombre, especie, raza, edad, peso, id_propietario) VALUES
('Firulais', 'Perro', 'Labrador', 3, 25.5, 1),
('Mishi', 'Gato', 'Siamés', 2, 4.2, 1),
('Rex', 'Perro', 'Pastor Alemán', 5, 30.0, 2);

-- Citas (según formulario citas.html)
INSERT INTO citas (fecha, hora, motivo, nombre_mascota, id_veterinario) VALUES
(CURDATE(), '10:00:00', 'Vacunación anual', 'Firulais', 3),
(CURDATE() + INTERVAL 1 DAY, '14:30:00', 'Control general', 'Mishi', 4),
(CURDATE() + INTERVAL 2 DAY, '11:00:00', 'Chequeo dental', 'Rex', 3);