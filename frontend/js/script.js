// frontend/js/script.js (completo y corregido)
document.addEventListener('DOMContentLoaded', function() {
    // Funcionalidad para el menú móvil
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mainMenu = document.getElementById('main-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const header = document.querySelector('.header');
    
    if (mobileMenuToggle && mainMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            mainMenu.classList.toggle('active');
            
            const hamburger = this.querySelector('.hamburger');
            if (hamburger) {
                if (!isExpanded) {
                    hamburger.classList.add('active');
                    header.classList.add('menu-open');
                } else {
                    hamburger.classList.remove('active');
                    header.classList.remove('menu-open');
                }
            }
        });
        
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (mainMenu.classList.contains('active')) {
                    mainMenu.classList.remove('active');
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                    const hamburger = document.querySelector('.hamburger');
                    if (hamburger) hamburger.classList.remove('active');
                    header.classList.remove('menu-open');
                }
            });
        });
        
        document.addEventListener('click', function(event) {
            if (!mainMenu.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
                if (mainMenu.classList.contains('active')) {
                    mainMenu.classList.remove('active');
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                    const hamburger = document.querySelector('.hamburger');
                    if (hamburger) hamburger.classList.remove('active');
                    header.classList.remove('menu-open');
                }
            }
        });
    }
    
    // Efecto de scroll para el header
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50 && header) {
            header.classList.add('scrolled');
        } else if (header) {
            header.classList.remove('scrolled');
        }
    });
    
    // Modal de acceso especial para recepcionistas y veterinarios (CORREGIDO)
    const accessButtons = document.querySelectorAll('.access-button');
    const modal = document.getElementById('access-modal');
    const closeModal = document.getElementById('close-modal');
    const accessForm = document.getElementById('access-form');
    const modalRoleElement = document.getElementById('modal-role');
    const accessKeyInput = document.getElementById('access-key');
    const keyErrorElement = document.getElementById('key-error');
    
    let selectedRole = '';
    
    // Abrir modal al hacer clic en los botones de acceso
    accessButtons.forEach(button => {
        button.addEventListener('click', function() {
            selectedRole = this.getAttribute('data-role');
            const roleNames = {
                'receptionist': 'Recepcionista',
                'veterinarian': 'Veterinario'
            };
            modalRoleElement.textContent = roleNames[selectedRole] || 'rol';
            modal.setAttribute('aria-hidden', 'false');
            modal.classList.add('active');
            accessKeyInput.focus();
        });
    });
    
    // Cerrar modal
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            accessKeyInput.value = '';
            keyErrorElement.textContent = '';
        });
    }
    
    // Cerrar modal al hacer clic fuera del contenido
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
                modal.setAttribute('aria-hidden', 'true');
                accessKeyInput.value = '';
                keyErrorElement.textContent = '';
            }
        });
    }
    
    // Manejar envío del formulario de acceso (CORREGIDO: rutas absolutas)
    if (accessForm) {
        accessForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const accessKey = accessKeyInput.value.trim();
            keyErrorElement.textContent = '';
            
            // Validar clave de acceso
            if (accessKey === 'registro-1234') {
                // Redirigir usando rutas del servidor (NO rutas relativas)
                if (selectedRole === 'receptionist') {
                    window.location.href = '/registro-recepcionista';
                } else if (selectedRole === 'veterinarian') {
                    window.location.href = '/registro-veterinario';
                }
            } else {
                keyErrorElement.textContent = 'Clave de acceso incorrecta. Contacte al administrador.';
                accessKeyInput.classList.add('error');
                setTimeout(() => {
                    accessKeyInput.classList.remove('error');
                }, 2000);
            }
        });
    }
});

// Animaciones al hacer scroll
document.addEventListener('DOMContentLoaded', function() {
    const observerOptions = {
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.hero-content, .about-content, .cta-section, .register-container').forEach(element => {
        observer.observe(element);
    });
});