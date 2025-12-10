-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS veterinaria_db;
USE veterinaria_db;

-- Tabla USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(15),
    rol ENUM('propietario', 'veterinario', 'recepcionista') DEFAULT 'propietario'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla MASCOTAS
CREATE TABLE IF NOT EXISTS mascotas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    especie VARCHAR(50) NOT NULL,
    raza VARCHAR(50),
    edad INT,
    peso DECIMAL(5,2),
    id_propietario INT NOT NULL,
    FOREIGN KEY (id_propietario) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla CITAS
CREATE TABLE IF NOT EXISTS citas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    motivo TEXT NOT NULL,
    nombre_mascota VARCHAR(100) NOT NULL,
    id_veterinario INT NOT NULL,
    estado ENUM('activa', 'cancelada') DEFAULT 'activa',
    FOREIGN KEY (id_veterinario) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insertar datos de prueba (CONTRASEÑAS EN TEXTO PLANO: 123456)
INSERT INTO usuarios (nombre, usuario, email, password, telefono, rol) VALUES
('Juan Pérez', 'juan', 'juan@email.com', '123456', '555-1234', 'propietario'),
('María García', 'maria', 'maria@email.com', '123456', '555-5678', 'propietario'),
('Dr. Carlos López', 'carlos', 'carlos@vet.com', '123456', '555-9012', 'veterinario'),
('Dra. Ana Martínez', 'ana', 'ana@vet.com', '123456', '555-3456', 'veterinario'),
('Recepcionista Uno', 'recepcion', 'recepcion@vet.com', '123456', '555-7890', 'recepcionista');

-- Mascotas
INSERT INTO mascotas (nombre, especie, raza, edad, peso, id_propietario) VALUES
('Firulais', 'Perro', 'Labrador', 3, 25.50, 1),
('Mishi', 'Gato', 'Siamés', 2, 4.20, 1),
('Rex', 'Perro', 'Pastor Alemán', 5, 30.00, 2);

-- Citas con fechas específicas
INSERT INTO citas (fecha, hora, motivo, nombre_mascota, id_veterinario) VALUES
('2025-12-05', '10:00:00', 'Vacunación anual', 'Firulais', 3),
('2025-12-06', '14:30:00', 'Control general', 'Mishi', 4),
('2025-12-07', '11:00:00', 'Chequeo dental', 'Rex', 3);