document.addEventListener('DOMContentLoaded', function () {
  app.init();
});

let app = {  
  //URL_RSS: 'https://www.ign.es/ign/RssTools/sismologia.xml',
  URL_RSS: 'https://www.ign.es/web/ign/portal/ultimos-terremotos/-/ultimos-terremotos/get10dias',

  updateButton: document.getElementById('update'),
  listado: document.getElementById('listado'),

  init: function() {
    if (app.updateButton) {
      app.updateButton.addEventListener('click', app.getData);
    }
    app.getData();    
  },

  getData: function() {

    app.listado.innerHTML = '';

    fetch(app.URL_RSS)
      .then(response => {
        if (!response.ok) {
          throw new Error('Error en la respuesta HTTP: ' + response.status);
        }
        return response.text();
      })
      .then(htmlText => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        const section1 = doc.getElementById('section1');

        if (!section1) {
          console.log('No se encontró el elemento #section1');
          return;
        }

        const filas = section1.querySelectorAll('table tr:not(:first-child)');

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
            horaLocal: celdas[3]?.textContent.trim(),//.substring(0, 5),
            profundidadKm: celdas[6]?.textContent.trim(),
            magnitud: celdas[7]?.textContent.trim(),
            tipoMagnitud: celdas[8]?.textContent.trim(),
            localizacion: celdas[10]?.textContent.trim()
          };
        }).filter(item => item !== null); // Filtramos nulos si los hubiera

        //console.log('Listado de filas/terremotos obtenidos:', terremotos);

        app.renderData(terremotos);
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

      if (!isNaN(magnitudNum) && magnitudNum >= 2.0) {
        card.classList.add('red');
      }

      card.innerHTML = `
          <p class="btn btn-sm">Mag. ${terremoto.magnitud} - prof. ${terremoto.profundidadKm} Km - ${terremoto.localizacion} - ${terremoto.fecha} ${terremoto.horaLocal}</p>
          <a href="http://www.ign.es/web/ign/portal/sis-catalogo-terremotos/-/catalogo-terremotos/detailTerremoto?evid=es2026qdhqs" target="_blank" rel="noopener">+</a>
        `;
      app.listado.appendChild(card);
    });
  }
};