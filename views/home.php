<?php
require_once 'controllers\SearchFilter.php';

$advertsPerPage = 6;
$totalAdverts = count($adverts);
$totalPages = max(1, ceil($totalAdverts / $advertsPerPage));
$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$page = max(1, min($page, $totalPages));
$start = ($page - 1) * $advertsPerPage;
$advertsToShow = array_slice($adverts, $start, $advertsPerPage);
?>

<?php require_once __DIR__ . '/partials/head.php'; ?>
<?php require_once __DIR__ . '/partials/header.php'; ?>

<!-- Botón de traducción personalizado -->
<div id="google_translate_custom_btn"></div>
<div id="google_translate_element" style="display:none;"></div>

<!-- Loader Overlay -->
<div id="loader-overlay" class="visible" style="position:fixed;z-index:9999;top:0;left:0;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;">
    <div style="width:320px;max-width:90vw;">
        <div class="text-center mb-4 fs-4 text-light">Cargando Houspecial...</div>
        <div id="loader-bar-bg" style="width:100%;height:16px;background:#222;border-radius:8px;overflow:hidden;">
            <div id="loader-bar" style="width:0;height:100%;background:#fff;transition:width 1.5s;"></div>
        </div>
    </div>
</div>

<main>
    <div class="container body-ody-ody">
        <div class="row">
            <!-- Filtros -->
            <aside class="col-12 col-md-3 mb-4">
                <div class="card shadow-sm">
                    <div class="card-header bg-secondary text-white">
                        <strong>Filtrar propiedades</strong>
                    </div>
                    <div class="card-body">
                        <form>
                            <div class="mb-3">
                                <label for="action" class="form-label">Acción</label>
                                <select class="form-select" id="action" name="action">
                                    <option value="">Todos</option>
                                    <option value="Venta" <?= (isset($_GET['action']) && $_GET['action'] === 'Venta') ? 'selected' : '' ?>>Venta</option>
                                    <option value="Alquiler" <?= (isset($_GET['action']) && $_GET['action'] === 'Alquiler') ? 'selected' : '' ?>>Alquiler</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="property_types" class="form-label">Tipo</label>
                                <div class="ms-3">
                                    <?php
                                    $propertyTypes = ['Habitación', 'Estudio', 'Piso', 'Casa'];
                                    $selectedTypes = isset($_GET['property_types']) ? (array)$_GET['property_types'] : [];
                                    foreach ($propertyTypes as $type): ?>
                                        <div class="form-check">
                                            <input class="form-check-input"
                                                type="radio"
                                                name="property_types[]"
                                                value="<?= htmlspecialchars($type) ?>"
                                                id="property_type_<?= htmlspecialchars($type) ?>"
                                                <?= in_array($type, $selectedTypes) ? 'checked' : '' ?>>
                                            <label class="form-check-label" for="property_types<?= htmlspecialchars($type) ?>">
                                                <?= htmlspecialchars($type) ?>
                                            </label>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="price" class="form-label">Precio máximo</label>
                                <input type="number" class="form-control" id="price" name="price" placeholder="Ej: 1000" value="<?= isset($_GET['price']) ? htmlspecialchars($_GET['price']) : '' ?>">
                            </div>
                            <div class="mb-3">
                                <label for="city" class="form-label">Ciudad</label>
                                <input type="text" class="form-control" id="city" name="city" placeholder="Ej: Madrid" value="<?= isset($_GET['city']) ? htmlspecialchars($_GET['city']) : '' ?>">
                            </div>
                            <div class="mb-3">
                                <label for="province" class="form-label">Provincia</label>
                                <input type="text" class="form-control" id="province" name="province" placeholder="Ej: Barcelona" value="<?= isset($_GET['province']) ? htmlspecialchars($_GET['province']) : '' ?>">
                            </div>
                            <div class="mb-3">
                                <label for="immediate_availability" class="form-label">Disponibilidad inmediata</label>
                                <select class="form-select" id="immediate_availability" name="immediate_availability">
                                    <option value="">Cualquiera</option>
                                    <option value="1" <?= (isset($_GET['immediate_availability']) && $_GET['immediate_availability'] === '1') ? 'selected' : '' ?>>Sí</option>
                                    <option value="0" <?= (isset($_GET['immediate_availability']) && $_GET['immediate_availability'] === '0') ? 'selected' : '' ?>>No</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="status" class="form-label">Estado</label>
                                <div class="ms-3">
                                    <?php
                                    $statusTypes = ['Obra nueva', 'Reformado', 'A reformar', 'En buen estado'];
                                    $selectedTypes = isset($_GET['status']) ? (array)$_GET['status'] : [];
                                    foreach ($statusTypes as $type): ?>
                                        <div class="form-check">
                                            <input class="form-check-input"
                                                type="checkbox"
                                                name="status[]"
                                                value="<?= htmlspecialchars($type) ?>"
                                                id="status<?= htmlspecialchars($type) ?>"
                                                <?= in_array($type, $selectedTypes) ? 'checked' : '' ?>>
                                            <label class="form-check-label" for="status<?= htmlspecialchars($type) ?>">
                                                <?= htmlspecialchars($type) ?>
                                            </label>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                            <div id="dynamic-characteristics"></div>
                            <button type="submit" class="btn btn-secondary w-100 btn-font mt-3">Ver propiedades</button>
                        </form>
                    </div>
                </div>
            </aside>
            <!-- Listado de anuncios -->
            <div class="col-12 col-md-9 mb-4">
                <h2 class="mb-4">Propiedades disponibles</h2>
                <div class="row g-4">
                    <?php if (empty($adverts)): ?>
                        <div class="col-12">
                            <div class="alert alert-secondary text-center">
                                No se encontraron propiedades disponibles.
                            </div>
                        </div>
                    <?php else: ?>
                        <?php foreach ($advertsToShow as $advert): ?>
                            <div class="col-12 col-lg-6">
                                <div class="card h-100 postit-card">
                                    <div class="row g-0 h-100">
                                        <div class="col-6 d-flex align-items-stretch" style="overflow: hidden;">
                                            <img src="<?= htmlspecialchars($advert['advert']->main_image) ?>"
                                                class="img-fluid rounded-start w-100 h-100"
                                                alt="Imagen propiedad"
                                                style="object-fit: cover; min-height: 200px;">
                                        </div>
                                        <div class="col-6">
                                            <div class="card-body d-flex flex-column h-100">
                                                <h5 class="card-title">
                                                    <?= htmlspecialchars($advert['title']) ?>
                                                </h5>
                                                <p class="card-text mb-1">
                                                    <?= htmlspecialchars($advert['property']->built_size) ?> m²
                                                </p>
                                                <p class="card-text mb-1">
                                                    <?php if ($advert['advert']->action == 'Alquiler'): ?>
                                                        <span class="badge text-bg-success fs-6"><?= htmlspecialchars($advert['advert']->price) ?> €/mes</span>
                                                    <?php else: ?>
                                                        <span class="badge text-bg-success fs-6"><?= htmlspecialchars($advert['advert']->price) ?> €</span>
                                                    <?php endif; ?>
                                                </p>
                                                <p class="card-text mb-1">
                                                    <span class="badge text-bg-secondary fs-6">
                                                        <?= htmlspecialchars($advert['property']->status) ?>
                                                    </span>
                                                </p>
                                                <!-- Añade la ciudad y provincia aquí -->
                                                <p class="card-text mb-1">
                                                    <i class="bi bi-geo-alt"></i>
                                                    <?= htmlspecialchars($advert['address']->city ?? '') ?>, <?= htmlspecialchars($advert['address']->province ?? '') ?>
                                                </p>
                                                <p class="card-text flex-grow-1 d-flex align-items-end">
                                                    <?= htmlspecialchars(mb_strimwidth($advert['advert']->description, 0, 120, '...')) ?>
                                                </p>
                                                <div class="mt-2 d-flex justify-content-evenly align-items-center">
                                                    <?php
                                                    $isFavorite = isset($_SESSION['user']) && in_array($advert['advert']->id, $_SESSION['userFavoriteIds'] ?? []);
                                                    ?>
                                                    <button
                                                        class="btn btn-sm btn-font favorite-btn <?= $isFavorite ? 'btn-danger' : 'btn-outline-secondary' ?>"
                                                        title="<?= $isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos' ?>"
                                                        data-advert-id="<?= $advert['advert']->id ?>">
                                                        <i class="bi bi-heart-fill mx-2" style="color:<?= $isFavorite ? 'white' : '#888' ?>"></i>
                                                    </button>
                                                    <a href="/advert-details?id=<?= urlencode($advert['advert']->id) ?>" class="btn btn-secondary btn-sm btn-font w-50" title="Ver detalles">Detalles</a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
                <!-- Paginación -->
                <nav aria-label="Página de navegación" class="mt-5">
                    <ul class="pagination justify-content-center">
                        <li class="page-item <?= $page === 1 ? 'disabled' : '' ?>">
                            <a class="page-link" href="?<?= http_build_query(array_merge($_GET, ['page' => $page - 1])) ?>" tabindex="-1">&laquo;</a>
                        </li>
                        <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                            <li class="page-item <?= $page === $i ? 'active' : '' ?>">
                                <a class="page-link" href="?<?= http_build_query(array_merge($_GET, ['page' => $i])) ?>"><?= $i ?></a>
                            </li>
                        <?php endfor; ?>
                        <li class="page-item <?= $page === $totalPages ? 'disabled' : '' ?>">
                            <a class="page-link" href="?<?= http_build_query(array_merge($_GET, ['page' => $page + 1])) ?>">&raquo;</a>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    </div>

    <script src="/views/assets/js/home.js"></script>
    <script type="text/javascript">
        function googleTranslateElementInit() {
            new google.translate.TranslateElement({
                pageLanguage: 'es',
                includedLanguages: 'en,fr,de,it,pt,ca,gl,eu',
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE
            }, 'google_translate_element');
        }

        
        document.addEventListener('DOMContentLoaded', function() {
            var btnDiv = document.getElementById('google_translate_custom_btn');
            if (btnDiv) {
                btnDiv.innerHTML = '<button id="open-translate">🌐</button>';
                document.getElementById('open-translate').onclick = function() {
                    var elem = document.querySelector('.goog-te-gadget-icon');
                    if (elem) elem.click();
                };
            }
        });
    </script>
    <script src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>
</main>

<?php require_once __DIR__ . '/partials/footer.php'; ?>
