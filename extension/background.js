// Lista predeterminada de patrones de anuncios
const adPatterns = [
  /ads?\./i,
  /adserver/i,
  /advert/i,
  /banner/i,
  /doubleclick/i,
  /googlesyndication/i,
  /googleadservices/i,
  /advertising/i,
  /analytics/i,
  /tracker/i,
  /tracking/i,
  /pixel/i,
  /\/ad\//i,
  /\/ads\//i
];

// Inicializar configuración por defecto
browser.storage.local.get(['blockedBrands', 'adBlockEnabled', 'brandBlockEnabled']).then(result => {
  if (!result.blockedBrands) {
    browser.storage.local.set({
      blockedBrands: [],
      adBlockEnabled: true,
      brandBlockEnabled: true
    });
  }
});

// Función para verificar si una URL coincide con patrones de anuncios
function isAdUrl(url) {
  return adPatterns.some(pattern => pattern.test(url));
}

// Función para verificar si una URL coincide con marcas bloqueadas
async function isBlockedBrand(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    const result = await browser.storage.local.get(['blockedBrands', 'brandBlockEnabled']);
    
    if (!result.brandBlockEnabled) return false;
    
    const blockedBrands = result.blockedBrands || [];
    
    return blockedBrands.some(brand => {
      const brandLower = brand.toLowerCase().trim();
      const domainLower = domain.toLowerCase();
      
      // Verificar coincidencia exacta o subdominio
      return domainLower === brandLower || 
             domainLower.endsWith('.' + brandLower) ||
             domainLower.includes(brandLower);
    });
  } catch (e) {
    return false;
  }
}

// Listener para interceptar solicitudes web
browser.webRequest.onBeforeRequest.addListener(
  async (details) => {
    const result = await browser.storage.local.get(['adBlockEnabled', 'brandBlockEnabled']);
    
    // Bloquear anuncios si está habilitado
    if (result.adBlockEnabled && isAdUrl(details.url)) {
      console.log('Bloqueado anuncio:', details.url);
      return { cancel: true };
    }
    
    // Bloquear marcas si está habilitado
    if (result.brandBlockEnabled && await isBlockedBrand(details.url)) {
      console.log('Bloqueada marca:', details.url);
      
      // Si es la página principal, redirigir a página de bloqueo
      if (details.type === 'main_frame') {
        const blockedUrl = details.url;
        return {
          redirectUrl: browser.runtime.getURL('blocked.html') + '?url=' + encodeURIComponent(blockedUrl)
        };
      }
      
      return { cancel: true };
    }
    
    return {};
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

// Listener para actualizar el ícono según el estado
browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.adBlockEnabled || changes.brandBlockEnabled)) {
    updateIcon();
  }
});

// Actualizar ícono según estado de bloqueo
async function updateIcon() {
  const result = await browser.storage.local.get(['adBlockEnabled', 'brandBlockEnabled']);
  const isActive = result.adBlockEnabled || result.brandBlockEnabled;
  
  browser.browserAction.setBadgeText({
    text: isActive ? 'ON' : 'OFF'
  });
  
  browser.browserAction.setBadgeBackgroundColor({
    color: isActive ? '#4CAF50' : '#9E9E9E'
  });
}

// Inicializar ícono
updateIcon();

// Contador de elementos bloqueados
let blockedCount = 0;

browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    blockedCount++;
    browser.browserAction.setBadgeText({
      text: blockedCount.toString()
    });
  },
  { urls: ["<all_urls>"] }
);
