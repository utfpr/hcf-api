window.addEventListener('load', () => {
  const svg = document.querySelector('[id^="code128_"]');
  if (svg) {
    if (typeof JsBarcode !== 'function') {
      console.error('JsBarcode não carregado. Verifique o caminho do script e a CSP.');
      return;
    }
    const attr = svg.getAttribute('data-codigo-barras');
    const id = svg.id;
    const cbarra = attr || '';
    JsBarcode('#'.concat(id), cbarra, { margin: 0, width: 1.4, height: 40, fontSize: 10 });
  }


  if (!/standalone/.test(window.location.href)) {
    window.print();
  }
});
