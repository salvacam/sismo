document.addEventListener('DOMContentLoaded', function () {
  app.init();
});

let app = {  
  URL_RSS: 'https://www.ign.es/ign/RssTools/sismologia.xml',

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
      .then(strXml => {
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(strXml, "text/xml");

        const itemsNodeList = xmlDoc.querySelectorAll("item");

        const terremotos = Array.from(itemsNodeList).map(item => {
          let rawDescription = item.querySelector("description")?.textContent || '';
  
		  let cleanDescription = rawDescription
		  	.replace(/^Se ha producido un terremoto de[\s\u00A0]*/i, '')
		    .replace(/\s*en la siguiente localización:.*$/i, '')
		    .trim();

		  // 2. Buscamos y convertimos la fecha UTC a hora local
		  // Busca el patrón "en la fecha DD/MM/YYYY HH:mm:ss"
		  cleanDescription = cleanDescription.replace(
		    /en la fecha (\d{2}\/\d{2}\/\d{4}) (\d{2}:\d{2}:\d{2})/,
		    (match, fechaStr, horaStr) => {
		      // Descomponemos la fecha (DD/MM/YYYY) y la hora (HH:mm:ss)
		      const [dia, mes, ano] = fechaStr.split('/');
		      const [hora, min, seg] = horaStr.split(':');

		      // Creamos la fecha indicando explícitamente que está en UTC (con la 'Z' al final)
		      const fechaUTC = new Date(Date.UTC(ano, mes - 1, dia, hora, min, seg));

		      // Convertimos a string en formato local (DD/MM/YYYY HH:mm:ss)
		      const options = {
		        day: '2-digit',
		        month: '2-digit',
		        year: 'numeric',
		        hour: '2-digit',
		        minute: '2-digit',
		        second: '2-digit',
		        hour12: false
		      };
		      
		      const fechaLocalFormateada = fechaUTC.toLocaleString('es-ES', options).replace(',', '');

		      return `en la fecha ${fechaLocalFormateada}`;
		    }
		  );

		  return cleanDescription;
        });

        app.renderData(terremotos);
      })
      .catch(err => {
        console.error('Error cargando el RSS:', err);
      });
  },

  renderData: function(listaTerremotos) {
    if (!app.listado) return;

    listaTerremotos.forEach(terremoto => {
      const card = document.createElement('div');
      card.innerHTML = `<p class="btn btn-sm">${terremoto}</p>`;
      app.listado.appendChild(card);
    });
  }
};