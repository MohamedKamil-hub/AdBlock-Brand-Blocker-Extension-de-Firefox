// Elementos del DOM
const adBlockToggle = document.getElementById('adBlockToggle');
const brandBlockToggle = document.getElementById('brandBlockToggle');
const brandInput = document.getElementById('brandInput');
const addBrandBtn = document.getElementById('addBrandBtn');
const brandList = document.getElementById('brandList');
const blockedCount = document.getElementById('blockedCount');

// Cargar configuración inicial
async function loadSettings() {
  const result = await browser.storage.local.get([
    'adBlockEnabled',
    'brandBlockEnabled',
    'blockedBrands'
  ]);
  
  adBlockToggle.checked = result.adBlockEnabled !== false;
  brandBlockToggle.checked = result.brandBlockEnabled !== false;
  
  renderBrandList(result.blockedBrands || []);
}

// Renderizar lista de marcas bloqueadas
function renderBrandList(brands) {
  if (brands.length === 0) {
    brandList.innerHTML = '<div class="empty-message">No hay marcas bloqueadas</div>';
    return;
  }
  
  brandList.innerHTML = brands.map((brand, index) => `
    <div class="brand-item">
      <span>${brand}</span>
      <button data-index="${index}">Eliminar</button>
    </div>
  `).join('');
  
  // Agregar listeners a botones de eliminar
  brandList.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.getAttribute('data-index'));
      removeBrand(index);
    });
  });
}

// Agregar marca
async function addBrand() {
  const brand = brandInput.value.trim().toLowerCase();
  
  if (!brand) {
    alert('Por favor ingresa un dominio válido');
    return;
  }
  
  // Limpiar el dominio (remover protocolo y barras)
  const cleanBrand = brand
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
  
  if (!cleanBrand) {
    alert('Por favor ingresa un dominio válido');
    return;
  }
  
  const result = await browser.storage.local.get('blockedBrands');
  const blockedBrands = result.blockedBrands || [];
  
  if (blockedBrands.includes(cleanBrand)) {
    alert('Esta marca ya está en la lista');
    return;
  }
  
  blockedBrands.push(cleanBrand);
  await browser.storage.local.set({ blockedBrands });
  
  brandInput.value = '';
  renderBrandList(blockedBrands);
}

// Eliminar marca
async function removeBrand(index) {
  const result = await browser.storage.local.get('blockedBrands');
  const blockedBrands = result.blockedBrands || [];
  
  blockedBrands.splice(index, 1);
  await browser.storage.local.set({ blockedBrands });
  
  renderBrandList(blockedBrands);
}

// Event listeners
adBlockToggle.addEventListener('change', async () => {
  await browser.storage.local.set({
    adBlockEnabled: adBlockToggle.checked
  });
});

brandBlockToggle.addEventListener('change', async () => {
  await browser.storage.local.set({
    brandBlockEnabled: brandBlockToggle.checked
  });
});

addBrandBtn.addEventListener('click', addBrand);

brandInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addBrand();
  }
});

// Cargar configuración al abrir el popup
loadSettings();

// Actualizar contador de bloqueados
browser.browserAction.getBadgeText({}).then(text => {
  if (text && text !== 'ON' && text !== 'OFF') {
    blockedCount.textContent = text;
  }
});
