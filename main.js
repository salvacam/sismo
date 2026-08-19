document.addEventListener('DOMContentLoaded', function () {
  app.init();
});

let app = {  
  URL_RSS: 'https://www.ign.es/ign/RssTools/sismologia.xml',
  URL_10: 'https://www.ign.es/web/ign/portal/ultimos-terremotos/-/ultimos-terremotos/get10dias',
  URL_30: 'https://www.ign.es/web/ign/portal/ultimos-terremotos/-/ultimos-terremotos/get30dias',

  updateButton: document.getElementById('update'),
  listado: document.getElementById('listado'),
  darkModeButton: document.getElementById('darkMode'),
  bodyDiv: document.getElementById('body'),
  get10: document.getElementById('source-10'),
  get30: document.getElementById('source-30'),
  getRss: document.getElementById('source-rss'),
  configToggle: document.getElementById('configToggle'),
  config: document.getElementById('config'),

  source: 10,

  init: function() {
    if (app.updateButton) {
      app.updateButton.addEventListener('click', app.getData);
    }

    app.darkModeButton.addEventListener('change', app.ChangeDarkMode);    

    var darkModeBool = localStorage.getItem("_sismo_dark");
    if (darkModeBool != null && darkModeBool == "true") {
      app.bodyDiv.classList.add('dark');
      app.darkModeButton.checked = true;
    }

    var sourceStorage = localStorage.getItem("_sismo_source");

    if (sourceStorage != null && sourceStorage == "30") {
      app.get10.checked = false;
      app.get30.checked = true;
      app.getRss.checked = false;
      app.source = "30";
    }
    
    if (sourceStorage != null && sourceStorage == "rss") {
      app.get10.checked = false;
      app.get30.checked = false;
      app.getRss.checked = true;
      app.source = "rss";
    }

    app.get10.addEventListener('change', app.ChangeSource10);
    app.get30.addEventListener('change', app.ChangeSource30);
    app.getRss.addEventListener('change', app.ChangeSourceRss);

    app.configToggle.addEventListener('click', app.ChangeConfig);   
    
    app.getData();
  },

  ChangeConfig: function() {
    if (app.config.classList.contains('show')) {
      app.config.classList.remove('show');
    } else {
      app.config.classList.add('show');
    }
  },

  ChangeSource10: function() {
    app.get10.checked = true;
    app.get30.checked = false;
    app.getRss.checked = false;

    app.source = "10";

    localStorage.setItem("_sismo_source", app.source);
    app.getData();
    app.config.classList.remove('show');
  },

  ChangeSource30: function() {
    app.get10.checked = false;
    app.get30.checked = true;
    app.getRss.checked = false;

    app.source = "30";

    localStorage.setItem("_sismo_source", app.source);
    app.getData();
    app.config.classList.remove('show');
  },

  ChangeSourceRss: function() {
    app.get10.checked = false;
    app.get30.checked = false;
    app.getRss.checked = true;

    app.source = "rss";

    localStorage.setItem("_sismo_source", app.source);
    app.getData();
    app.config.classList.remove('show');
  },

  ChangeDarkMode: function() {
    var darkModeBool = false;
    
    if (app.bodyDiv.classList.contains('dark')) {
      app.bodyDiv.classList.remove('dark');
      darkModeBool = false;
    } else {
      app.bodyDiv.classList.add('dark');
      darkModeBool = true;
    }

    localStorage.setItem("_sismo_dark", darkModeBool);
  },

  getData: function() {
    app.listado.innerHTML = '';

    let url = app.URL_10;
    if (app.source == "30") {
      url = app.URL_30;
    } else if (app.source == "rss") {
      url = app.URL_RSS;
    }

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Error en la respuesta HTTP: ' + response.status);
        }
        return response.text();
      })
      .then(htmlText => {
        if (app.source == "rss") {

          let parser = new DOMParser();
          let xmlDoc = parser.parseFromString(htmlText, "text/xml");

          const itemsNodeList = xmlDoc.querySelectorAll("item");
          //debugger;

          const terremotos = Array.from(itemsNodeList).map(item => {
            const link = item.querySelector("link")?.textContent || '';
            const urlParams = new URLSearchParams(link.split('?')[1]);
            const evento = urlParams.get('evid') || '';

            const rawDescription = item.querySelector("description")?.textContent || '';

            // Cadena ej: "...magnitud 2.8 en NW ARMILLA.GR en la fecha 19/08/2026 10:32:56..."
            const regexInfo = /magnitud\s+([\d.,]+)\s+en\s+(.*?)\s+en la fecha\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{1,2}:\d{2}:\d{2})/i;
            const match = rawDescription.match(regexInfo);

            let magnitud = '';
            let localizacion = '';
            let fechaLocal = '';
            let horaLocal = '';

            if (match) {
              magnitud = match[1];      // "2.8"
              localizacion = match[2];  // "NW ARMILLA.GR"
              const fechaUTCStr = match[3]; // "19/08/2026"
              const horaUTCStr = match[4];  // "10:32:56"

              const [dia, mes, ano] = fechaUTCStr.split('/');
              const [hora, min, seg] = horaUTCStr.split(':');
              
              const fechaUTC = new Date(Date.UTC(ano, mes - 1, dia, hora, min, seg));

              fechaLocal = fechaUTC.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });

              horaLocal = fechaUTC.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
            }

            return {
              evento: evento,            // "es2026qfcyg"
              fecha: fechaLocal,         // "19/08/2026"
              horaLocal: horaLocal,      // "12:32" (o la correspondiente en hora local)
              localizacion: localizacion,// "NW ARMILLA.GR"
              magnitud: magnitud,        // "2.8"
              linkMasInfo: link          // URL original por si necesitas el enlace
            };
          });

          //console.log('Listado de filas/terremotos obtenidos:', terremotos);
          app.renderData(terremotos);

        } else {
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlText, 'text/html');

          let section1 = doc.getElementById('section1');

          if (app.source == "30") {
            section1 = doc.getElementById('section2');
          }

          if (!section1) {
            console.log('No se encontró el elemento #section1');
            return;
          }

          let filas = section1.querySelectorAll('table tr:not(:first-child)');
        
          if (app.source == "30") {
            filas = section1.querySelectorAll('table tr:nth-child(n+3)');
          }

          const terremotos = Array.from(filas).map(tr => {
            const celdas = tr.querySelectorAll('td, th');
            
            if (celdas.length < 10) return null;

            const fechaRaw = celdas[1]?.textContent.trim();
            const horaUTCRaw = celdas[2]?.textContent.trim();

            return {
              evento: celdas[0]?.textContent.trim(),
              //fecha: celdas[1]?.textContent.trim(),
              // Aplicamos la lógica de sumar día si la hora UTC es >= 22:00
              fecha: app.formatearFechaLocal(fechaRaw, horaUTCRaw),
              horaUTC: celdas[2]?.textContent.trim(),
              horaLocal: celdas[3]?.textContent.trim().substring(0, 5),
              profundidadKm: celdas[6]?.textContent.trim(),
              magnitud: celdas[7]?.textContent.trim(),
              tipoMagnitud: celdas[8]?.textContent.trim(),
              sentido: celdas[9]?.textContent.trim(),
              localizacion: celdas[10]?.textContent.trim()
            };
          }).filter(item => item !== null); // Filtramos nulos si los hubiera

          //console.log('Listado de filas/terremotos obtenidos:', terremotos);
          app.renderData(terremotos);
        }
      })
      .catch(err => {
        console.error('Error al parsear la tabla:', err);
      });

  },

  // Función auxiliar para sumar 1 día a una fecha en formato "DD/MM/YYYY"
  formatearFechaLocal: function(fechaStr, horaUTCStr) {
    if (!fechaStr) return '';

    // 1. Descomponemos la fecha DD/MM/YYYY
    const partesFecha = fechaStr.split('/');
    if (partesFecha.length !== 3) return fechaStr;

    const dia = parseInt(partesFecha[0], 10);
    const mes = parseInt(partesFecha[1], 10) - 1; // Los meses en JS van de 0 a 11
    const ano = parseInt(partesFecha[2], 10);

    // 2. Extraemos la hora UTC
    const horaUTC = parseInt(horaUTCStr.split(':')[0], 10) || 0;

    // 3. Creamos el objeto Date
    const fechaObj = new Date(ano, mes, dia);

    // 4. Si la hora es >= 22, sumamos 1 día automáticamente
    if (horaUTC >= 22) {
      fechaObj.setDate(fechaObj.getDate() + 1);
    }

    // 5. Devolvemos la fecha en formato DD/MM/YYYY con ceros a la izquierda
    const diaLocal = String(fechaObj.getDate()).padStart(2, '0');
    const mesLocal = String(fechaObj.getMonth() + 1).padStart(2, '0');
    const anoLocal = fechaObj.getFullYear();

    return `${diaLocal}/${mesLocal}/${anoLocal}`;
  },

  renderData: function(listaTerremotos) {
    if (!app.listado) return;

    listaTerremotos.forEach(terremoto => {
      const card = document.createElement('div');
      const magnitudNum = parseFloat(terremoto.magnitud.replace(',', '.'));

      if (!isNaN(magnitudNum) && magnitudNum >= 2.0 && magnitudNum < 3.0) {
        card.classList.add('yellow');
      } else if (!isNaN(magnitudNum) && magnitudNum >= 3.0) {
        card.classList.add('red');      
      }

      let sentido = "";
      if (terremoto.sentido == "Sentido") {
        sentido = "- " + terremoto.sentido;
      } else if (terremoto.sentido != null && terremoto.sentido != undefined && terremoto.sentido.length > 0) {
        sentido = "- Int. " + terremoto.sentido;
      }

      let profundidad = "";
      if (terremoto.profundidadKm != null && terremoto.profundidadKm != undefined && terremoto.profundidadKm.length > 0) {
        profundidad = "- Prof. " + terremoto.profundidadKm;
      }

      card.innerHTML = `
          <p class="btn btn-sm">${terremoto.fecha} ${terremoto.horaLocal} - ${terremoto.localizacion}<br>Mag. <b>${terremoto.magnitud}</b> ${profundidad} Km ${sentido}</p>
          <a href="http://www.ign.es/web/ign/portal/sis-catalogo-terremotos/-/catalogo-terremotos/detailTerremoto?evid=${terremoto.evento}" target="_blank" rel="noopener">+</a>
        `;
      app.listado.appendChild(card);
    });
  }
};