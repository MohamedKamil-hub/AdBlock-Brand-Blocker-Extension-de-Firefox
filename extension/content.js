// Content script para bloquear elementos de anuncios en el DOM

// Selectores CSS comunes de anuncios
const adSelectors = [
  'iframe[src*="ads"]',
  'iframe[src*="doubleclick"]',
  'div[class*="ad-"]',
  'div[class*="advertisement"]',
  'div[id*="ad-"]',
  'div[id*="ads-"]',
  'div[class*="banner"]',
  'div[class*="sponsored"]',
  'aside[class*="ad"]',
  '[class*="adsbygoogle"]',
  '[data-ad-slot]',
  '[data-ad-client]'
];

// Función para remover elementos de anuncios
function removeAdElements() {
  adSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.remove();
        console.log('Elemento de anuncio removido:', selector);
      });
    } catch (e) {
      // Ignorar selectores inválidos
    }
  });
}

// Ejecutar al cargar la página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', removeAdElements);
} else {
  removeAdElements();
}

// Observar cambios en el DOM para anuncios dinámicos
const observer = new MutationObserver((mutations) => {
  removeAdElements();
});

// Configurar el observer
observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

// Limpiar al descargar la página
window.addEventListener('beforeunload', () => {
  observer.disconnect();
});

// Bloquear scripts de anuncios inline
(function() {
  const originalAppendChild = Element.prototype.appendChild;
  const originalInsertBefore = Element.prototype.insertBefore;
  
  const blockScript = (node) => {
    if (node.tagName === 'SCRIPT') {
      const src = node.src || '';
      const adKeywords = ['ads', 'advert', 'doubleclick', 'googlesyndication', 'analytics'];
      
      if (adKeywords.some(keyword => src.toLowerCase().includes(keyword))) {
        console.log('Script de anuncio bloqueado:', src);
        return true;
      }
    }
    return false;
  };
  
  Element.prototype.appendChild = function(node) {
    if (blockScript(node)) {
      return node;
    }
    return originalAppendChild.call(this, node);
  };
  
  Element.prototype.insertBefore = function(node, reference) {
    if (blockScript(node)) {
      return node;
    }
    return originalInsertBefore.call(this, node, reference);
  };
})();
