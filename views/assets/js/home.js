/**
 * Script principal para la página de inicio de Houspecial.
 *
 * Funcionalidades:
 * - Gestión de favoritos: Permite añadir o quitar anuncios de favoritos desde la vista principal.
 * - Carga dinámica de características: Muestra campos adicionales según los tipos de propiedad seleccionados en el formulario de búsqueda.
 * - Animación de loader: Muestra una animación de carga al entrar por primera vez en la página.
 * - Redirección del logo: Permite recargar la página y reiniciar el loader al hacer clic en el logo.
 *
 * Dependencias:
 * - Los botones de favoritos deben tener la clase .favorite-btn y el atributo data-advert-id.
 * - El loader debe tener los IDs loader-overlay y loader-bar.
 * - El logo debe tener la clase .logo.
 * - El contenedor dinámico debe tener el ID dynamic-characteristics.
 */

// Gestión de favoritos en la página principal
document.querySelectorAll('.favorite-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
        e.preventDefault();
        const advertId = this.getAttribute('data-advert-id');
        const button = this;
        fetch('/toggle-favorite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'advert_id=' + encodeURIComponent(advertId)
        })
        .then(response => response.json())
        .then((data) => {
            if (data.redirect) {
                window.location.href = data.redirect;
            } else if (data.success) {
                const icon = button.querySelector('i');
                if (icon) {
                    icon.style.color = data.is_favorite ? 'white' : '#888';
                }
                button.classList.remove('btn-danger', 'btn-outline-secondary');
                button.classList.add(data.is_favorite ? 'btn-danger' : 'btn-outline-secondary');
                button.title = data.is_favorite ? 'Quitar de favoritos' : 'Añadir a favoritos';
            }
        });
    });
});

// Carga dinámica de características según tipos de propiedad seleccionados
document.addEventListener('DOMContentLoaded', function () {
    const propertyTypeInputs = document.querySelectorAll('input[name="property_types[]"]');
    const dynamicContainer = document.getElementById('dynamic-characteristics');

    function loadCharacteristics() {
        const checkedTypes = Array.from(propertyTypeInputs)
            .filter(input => input.checked)
            .map(input => input.value);

        if (checkedTypes.length === 0) {
            dynamicContainer.innerHTML = '';
            return;
        }

        const params = new URLSearchParams();
        checkedTypes.forEach(type => params.append('type[]', type));

        fetch(`/views/partials/property-characteristics.php?${params.toString()}`)
            .then(res => res.text())
            .then(html => {
                dynamicContainer.innerHTML = html;
            });
    }

    propertyTypeInputs.forEach(input => {
        input.addEventListener('change', loadCharacteristics);
    });

    loadCharacteristics();
});

// Loader animado al cargar la página por primera vez
const overlay = document.getElementById('loader-overlay');
const bar = document.getElementById('loader-bar');

function animateBar(duration = 1800, onComplete) {
    bar.style.width = '0';
    let progress = 0;
    let start = null;

    function step(timestamp) {
        if (!start) start = timestamp;
        let elapsed = timestamp - start;

        let target = Math.min(100, progress + Math.random() * 10 + 5);
        progress = Math.min(target, (elapsed / duration) * 100);

        bar.style.width = progress + '%';

        if (progress < 100) {
            requestAnimationFrame(step);
        } else {
            bar.style.width = '100%';
            if (typeof onComplete === 'function') onComplete();
        }
    }
    requestAnimationFrame(step);
}

function startLoader() {
    overlay.style.display = 'flex';
    overlay.classList.remove('fade-out');
    overlay.classList.add('visible');
    bar.style.width = '0';
    void overlay.offsetWidth;
    animateBar(1800, () => {
        overlay.classList.add('fade-out');
        overlay.classList.remove('visible');
        document.body.classList.remove('loading');
        setTimeout(() => {
            overlay.style.display = 'none';
            bar.style.width = '0';
            overlay.classList.remove('fade-out');
        }, 2000);
    });
}

document.body.classList.add('loading');

document.addEventListener('DOMContentLoaded', function() {
    if (!localStorage.getItem('houspecialLoaded')) {
        startLoader();
        localStorage.setItem('houspecialLoaded', '1');
    } else {
        overlay.style.display = 'none';
        bar.style.width = '0';
        overlay.classList.remove('visible', 'fade-out');
        document.body.classList.remove('loading');
    }
});

/*

// Redirección y reinicio del loader al hacer clic en el logo
var logo = document.querySelector('.logo');
if (logo) {
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('houspecialLoaded'); 
        window.location.href = '/';
    });
}
*/


