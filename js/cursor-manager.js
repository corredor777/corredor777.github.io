// Objeto de cursores (adicione todos aqui)
const globalCursorMap = {
  '.cur-skeleton-hand': '/assets/images/cursor/skeleton-hand.cur',
  '.cur-draw': '/assets/images/cursor/caneta.cur',
  '.cur-chama': '/assets/images/cursor/blueflame.gif',
  '.cur-none': 'none',
  '.link-duat': 'help',
  '.cur-eye': '/assets/images/cursor/eye.gif',
  '.cur-vscroll': 'row-resize',
  '.cur-doubt': '/assets/images/cursor/doubt.gif',
  '.cur-angel': '/assets/images/cursor/angel-wings.gif'
};

function gerenciarCursoresGeral(mapa) {

  // 1. Cria o elemento para GIFs
  const fakeCursor = document.createElement('img');
  fakeCursor.id = 'fake-cursor';
  Object.assign(fakeCursor.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '99999',
    display: 'none',
    width: 'auto',
    height: 'auto'
  });
  document.body.appendChild(fakeCursor);

  // 2. CSS Global (Esconde por padrão)
  const estilo = document.createElement('style');
  estilo.innerHTML = `* { cursor: none !important; } html, body { cursor: none !important; min-height: 100vh; }`;
  document.head.appendChild(estilo);

  // 1. Monitora quando o mouse entra em qualquer iframe
  document.querySelectorAll('iframe').forEach(iframe => {
      iframe.addEventListener('mouseover', () => {
          const fakeCursor = document.getElementById('fake-cursor');
          if (fakeCursor) {
              fakeCursor.style.display = 'none';
          }
      });
  });

  // 2. Correção específica para o Firefox (Perda de foco da janela)
  window.addEventListener('blur', () => {
      const fakeCursor = document.getElementById('fake-cursor');
      if (fakeCursor) {
          fakeCursor.style.display = 'none';
      }
  });

  // 3. Reset agressivo no mousemove (Caso o mouse passe rápido demais)
  document.addEventListener('mousemove', (e) => {
      const fakeCursor = document.getElementById('fake-cursor');
      if (!fakeCursor) return;

      // Se o mouse estiver sobre um iframe, o Firefox às vezes ainda 
      // dispara um último evento. Checamos o target aqui.
      if (e.target.tagName === 'IFRAME') {
          fakeCursor.style.display = 'none';
      }
  }, { passive: true });

  document.addEventListener('mousemove', (e) => {
    if (e.target.tagName === 'IFRAME') {
        const fakeCursor = document.getElementById('fake-cursor');
        if (fakeCursor) fakeCursor.style.display = 'none';
        return; 
    }

    let valor = null;

    for (const seletor in mapa) {
      if (e.target.closest(seletor)) {
        valor = mapa[seletor];
        break;
      }
    }

    if (valor) {
      // Verifica se é um arquivo (tem ponto no nome) ou nativo
      const ehArquivo = valor.includes('.');
      const ehGIF = valor.toLowerCase().endsWith('.gif');

      if (ehArquivo) {
        if (ehGIF) {
          if (!fakeCursor.src.endsWith(valor)) fakeCursor.src = valor;
          fakeCursor.style.display = 'block';
          fakeCursor.style.left = e.clientX + 'px';
          fakeCursor.style.top = e.clientY + 'px';
          document.documentElement.style.cursor = 'none';
        } else {
          // .cur ou .png
          fakeCursor.style.display = 'none';
          e.target.style.setProperty('cursor', `url('${valor}'), auto`, 'important');
        }
      } else {
        // CURSOR NATIVO (wait, help, pointer, etc)
        fakeCursor.style.display = 'none';
        e.target.style.setProperty('cursor', valor, 'important');
      }
    } else {
      fakeCursor.style.display = 'none';
      document.documentElement.style.cursor = 'none';
    }
  });
}

gerenciarCursoresGeral(globalCursorMap);