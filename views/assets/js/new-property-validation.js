/**
 * Script de validación multipaso para el formulario de nueva propiedad.
 *
 * Funcionalidades:
 * - Valida en tiempo real los campos obligatorios de cada paso del formulario.
 * - Muestra mensajes de error personalizados y estilos de validación Bootstrap.
 * - Deshabilita el botón "Siguiente" si algún campo es inválido.
 * - En el primer paso, valida la existencia real de la dirección usando la API de OpenStreetMap.
 * - Revalida los campos dinámicos al cambiar el tipo de propiedad.
 *
 * Campos validados:
 * - Todos los campos con atributo required (input, select, textarea).
 * - Radios y checkboxes se validan por grupo.
 * - Dirección real validada mediante petición externa en el paso 1.
 *
 * Dependencias:
 * - El formulario debe estar dividido en pasos con clase .step y id="step-X".
 * - Los botones "Siguiente" deben tener la clase btn-secondary y un onclick="nextStep(X)".
 * - Los campos deben tener los IDs y names esperados.
 * - Se usan clases de Bootstrap para feedback visual.
 */

function setFieldInvalid(field, message) {
  field.classList.add('is-invalid');
  field.classList.remove('is-valid');
  let feedback = field.parentNode.querySelector('.invalid-feedback');
  if (!feedback) {
    feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    field.parentNode.appendChild(feedback);
  }
  feedback.textContent = message;
  feedback.style.display = 'block';
}

function setFieldValid(field) {
  field.classList.remove('is-invalid');
  field.classList.add('is-valid');
  let feedback = field.parentNode.querySelector('.invalid-feedback');
  if (feedback) {
    feedback.textContent = '';
    feedback.style.display = 'none';
  }
}

/**
 * Valida todos los campos obligatorios del paso indicado.
 * Si es el paso 1, valida también la existencia real de la dirección.
 * Deshabilita el botón "Siguiente" si hay errores.
 */
function checkStepFields(stepNumber) {
  const step = document.getElementById("step-" + stepNumber);
  if (!step) return;
  let allValid = true;

  const requiredFields = step.querySelectorAll(
    "input[required], select[required], textarea[required]"
  );

  const radioGroupsChecked = new Set();

  requiredFields.forEach((field) => {
    if (field.type === "radio") {
      if (radioGroupsChecked.has(field.name)) return;
      radioGroupsChecked.add(field.name);
      const group = step.querySelectorAll(`input[name="${field.name}"]`);
      const checked = step.querySelectorAll(`input[name="${field.name}"]:checked`);
      group.forEach(radio => {
        if (checked.length === 0) {
          setFieldInvalid(radio, "Este campo no puede estar vacío");
          allValid = false;
        } else {
          setFieldValid(radio);
        }
      });
    } else if (field.type === "checkbox") {
      if (!field.checked) {
        setFieldInvalid(field, "Este campo no puede estar vacío");
        allValid = false;
      } else {
        setFieldValid(field);
      }
    } else {
      if (!field.value || field.value.trim() === "") {
        setFieldInvalid(field, "Este campo no puede estar vacío");
        allValid = false;
      } else {
        setFieldValid(field);
      }
    }
  });

  const nextBtn = step.querySelector(
    'button.btn-secondary[onclick^="nextStep"]'
  );
  if (nextBtn) nextBtn.disabled = !allValid;

  // Validación de dirección real en el paso 1
  if (stepNumber === 1 && allValid && nextBtn) {
    nextBtn.disabled = true;
    validateAddressReal(1).then(result => {
        if (result.apiFound) {
            // Solo marca en rojo los campos que no coinciden con la dirección encontrada
            if (!result.streetMatch) {
                setFieldInvalid(document.getElementById('street'), "Introduce una calle real y existente.");
            } else {
                setFieldValid(document.getElementById('street'));
            }
            if (!result.cityMatch) {
                setFieldInvalid(document.getElementById('city'), "Introduce una ciudad real y existente.");
            } else {
                setFieldValid(document.getElementById('city'));
            }
            if (!result.provinceMatch) {
                setFieldInvalid(document.getElementById('province'), "Introduce una provincia real y existente.");
            } else {
                setFieldValid(document.getElementById('province'));
            }
            if (!result.countryMatch) {
                setFieldInvalid(document.getElementById('country'), "Introduce un país real y existente.");
            } else {
                setFieldValid(document.getElementById('country'));
            }
            nextBtn.disabled = !(result.streetMatch && result.cityMatch && result.provinceMatch && result.countryMatch);
        } else {
            // Si la API no encuentra nada, muestra error en todos
            setFieldInvalid(document.getElementById('street'), "Introduce una dirección real y existente.");
            setFieldInvalid(document.getElementById('city'), "");
            setFieldInvalid(document.getElementById('province'), "");
            setFieldInvalid(document.getElementById('country'), "");
            nextBtn.disabled = true;
        }
    });
  }
}

/**
 * Inicializa la validación en todos los pasos del formulario.
 * Añade listeners a los campos requeridos para validar en tiempo real.
 */
function initStepValidation() {
  document.querySelectorAll(".step").forEach((step, idx) => {
    const stepNumber = idx + 1;
    step
      .querySelectorAll("input[required], select[required], textarea[required]")
      .forEach((field) => {
        field.addEventListener("input", () => checkStepFields(stepNumber));
        field.addEventListener("change", () => checkStepFields(stepNumber));
      });
    checkStepFields(stepNumber);
  });
}

// Inicializa la validación al cargar la página
window.addEventListener("DOMContentLoaded", initStepValidation);

// Revalida los campos dinámicos al cambiar el tipo de propiedad
const originalLoadFieldsForType = window.loadFieldsForType;
window.loadFieldsForType = function (type) {
  originalLoadFieldsForType(type);
  initStepValidation();
  checkStepFields(3);
};

/**
 * Valida la existencia real de la dirección usando la API de OpenStreetMap.
 * Normaliza los valores para comparar correctamente (sin tildes, minúsculas).
 * Devuelve un objeto { isReal: true/false }.
 */
async function validateAddressReal(stepNumber) {
    if (stepNumber !== 1) return { apiFound: true, streetMatch: true, cityMatch: true, provinceMatch: true, countryMatch: true };

    const street = document.getElementById('street').value.trim();
    const city = document.getElementById('city').value.trim();
    const province = document.getElementById('province').value.trim();
    const country = document.getElementById('country').value.trim();

    if (!street || !city || !province || !country) {
        return { apiFound: false, streetMatch: false, cityMatch: false, provinceMatch: false, countryMatch: false };
    }

    const query = encodeURIComponent(`${street}, ${city}, ${province}, ${country}`);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&limit=1`;

    try {
        const response = await fetch(url, { headers: { 'Accept-Language': 'es' } });
        const data = await response.json();
        if (data.length === 0) {
            return { apiFound: false, streetMatch: false, cityMatch: false, provinceMatch: false, countryMatch: false };
        }

        const address = data[0].address;

        function normalize(str) {
            return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
        }

        const inputStreet = normalize(street);
        const inputCity = normalize(city);
        const inputProvince = normalize(province);
        const inputCountry = normalize(country);

        // Comprobación de calle (en road, pedestrian, etc.)
        const streetMatch =
            [address.road, address.pedestrian, address.cycleway, address.footway, address.street, address.residential]
                .filter(Boolean)
                .some(val => normalize(val).includes(inputStreet));

        const cityMatch =
            [address.city, address.town, address.village, address.hamlet]
                .filter(Boolean)
                .some(val => normalize(val).includes(inputCity));

        const provinceMatch =
            [address.state, address.region, address.county, address.province]
                .filter(Boolean)
                .some(val => normalize(val).includes(inputProvince));

        const countryMatch = address.country && normalize(address.country).includes(inputCountry);

        const isReal = streetMatch && cityMatch && provinceMatch && countryMatch;

        return { apiFound: true, streetMatch, cityMatch, provinceMatch, countryMatch };
    } catch (e) {
        return { apiFound: false, streetMatch: false, cityMatch: false, provinceMatch: false, countryMatch: false };
    }
}
