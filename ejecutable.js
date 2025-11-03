
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const clearBtn = document.getElementById('clearBtn');
  const status = document.getElementById('status');
  const results = document.getElementById('results');

  const zoneEl = document.getElementById('zone');
  const hemEl = document.getElementById('hem');
  var eastingEl = document.getElementById('easting');
 var northingEl = document.getElementById('northing');
  const latEl = document.getElementById('lat');
  const lonEl = document.getElementById('lon');
  const msgEl = document.getElementById('msg');

//Aqui iba el codigo


  // Conversor UTM -> Lat/Lon (WGS84)
  // Adaptado para uso directo en el navegador (basado en fórmulas Transverse Mercator).
  // Precisión suficiente para uso general, para trabajo de precisión profesional usar librería geodésica dedicada.

  function utmToLatLon(easting, northing, zoneNumber, hemisphere) {
    // WGS84 parameters
    const a = 6378137.0; // semi-major axis
    const f = 1 / 298.257223563; // flattening
    const k0 = 0.9996;

    const e = Math.sqrt(f * (2 - f)); // eccentricity
    const e1sq = e*e / (1 - e*e);

    // Remove 500,000 meter offset for longitude
    const x = easting - 500000.0;
    let y = northing;

    // If southern hemisphere, remove 10,000,000 meter offset
    if (hemisphere === 'S' || hemisphere === 's') {
      y = y - 10000000.0;
    }

    const longOrigin = (zoneNumber - 1) * 6 - 180 + 3; //+3 puts origin in middle of zone

    // Footpoint latitude
    const m = y / k0;
    const mu = m / (a * (1 - Math.pow(e,2)/4 - 3*Math.pow(e,4)/64 - 5*Math.pow(e,6)/256));

    // series expansion to obtain phi1 (footprint latitude)
    const e1 = (1 - Math.sqrt(1 - e*e)) / (1 + Math.sqrt(1 - e*e));
    const j1 = (3*e1/2 - 27*Math.pow(e1,3)/32);
    const j2 = (21*Math.pow(e1,2)/16 - 55*Math.pow(e1,4)/32);
    const j3 = (151*Math.pow(e1,3)/96);
    const j4 = (1097*Math.pow(e1,4)/512);

    const phi1 = mu
      + j1 * Math.sin(2*mu)
      + j2 * Math.sin(4*mu)
      + j3 * Math.sin(6*mu)
      + j4 * Math.sin(8*mu);

    // compute latitude and longitude
    const sinPhi1 = Math.sin(phi1);
    const cosPhi1 = Math.cos(phi1);

    const tanPhi1 = Math.tan(phi1);
    const c1 = e1sq * Math.pow(cosPhi1,2);
    const t1 = Math.pow(tanPhi1,2);
    const n1 = a / Math.sqrt(1 - Math.pow(e*sinPhi1,2));
    const r1 = a * (1 - e*e) / Math.pow(1 - Math.pow(e*sinPhi1,2), 1.5);

    const d = x / (n1 * k0);

    // Latitude (radians)
    const latRad =
      phi1 - (n1 * tanPhi1 / r1) * (
        d*d/2
        - (5 + 3*t1 + 10*c1 - 4*c1*c1 - 9*e1sq) * Math.pow(d,4) / 24
        + (61 + 90*t1 + 298*c1 + 45*t1*t1 - 252*e1sq - 3*c1*c1) * Math.pow(d,6) / 720
      );

    // Longitude (radians)
    const lonRad =
      (d
        - (1 + 2*t1 + c1) * Math.pow(d,3) / 6
        + (5 - 2*c1 + 28*t1 - 3*c1*c1 + 8*e1sq + 24*t1*t1) * Math.pow(d,5) / 120
      ) / cosPhi1;

    const lat = latRad * 180 / Math.PI;
    const lon = longOrigin + lonRad * 180 / Math.PI;

    return { lat: lat, lon: lon };
  }

  // UI helpers

// aca pasan a 10 decimales
  function mostrarResultado(lat, lon) {
    latEl.textContent = lat.toFixed(10);
    lonEl.textContent = lon.toFixed(10);
    msgEl.textContent = `Coordenadas en WGS84 (grados decimales). Lat/Lon mostrados con 10 decimales.`;
  }

  function validarYConvertir() {
    const zone = parseInt(zoneEl.value, 10);
    const hem = hemEl.value;
    const easting = parseFloat(eastingEl.value);

    const northing = parseFloat(northingEl.value);

    if (!zone || zone < 1 || zone > 60) {
      alert('Zona UTM inválida. Debe ser 1–60.');
      return null;
    }
    if (isNaN(easting) || isNaN(northing)) {
      alert('Easting o Northing inválidos.');
      return null;
    }
    // basic sanity checks
    if (easting < 100000 || easting > 900000) {
      // still allow but warn
      console.warn('Easting fuera de rango típico (100000–900000).');
    }
    const out = utmToLatLon(easting, northing, zone, hem);
    mostrarResultado(out.lat, out.lon);
    return out;
  }

//  document.getElementById('convertBtn').addEventListener('click', () => {
 //   validarYConvertir();
//  });

  document.getElementById('mapsBtn').addEventListener('click', () => {
    const p = validarYConvertir();
    if (!p) return;
    // Google Maps search URL with query lat,lon
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.lat + ',' + p.lon)}`;
    window.open(url, '_blank');
  });

  document.getElementById('earthWebBtn').addEventListener('click', () => {
    const p = validarYConvertir();
    if (!p) return;
    // Google Earth Web supports a share-like URL using @lat,lon,alt but may require slightly different format.
    // We'll attempt to open Earth with a lat/lon view. Note: Earth Web may not support a guaranteed pin via URL,
    // but this will open the approximate location in Earth Web.
    const lat = p.lat.toFixed(10), lon = p.lon.toFixed(10);
    // altitude chosen modest: 1000m
    const url = `https://earth.google.com/web/@${lat},${lon},1000a,1000d,35y,0h,0t,0r`;
    window.open(url, '_blank');
  });

  document.getElementById('kmlBtn').addEventListener('click', () => {
    const p = validarYConvertir();
    if (!p) return;
    const name = `UTM_${zoneEl.value}${hemEl.value}_${Date.now()}`;
    const description = `Conversión UTM zona ${zoneEl.value}${hemEl.value} → lat:${p.lat.toFixed(10)} lon:${p.lon.toFixed(10)}`;
    const kml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
`<kml xmlns="http://www.opengis.net/kml/2.2">\n` +
`  <Document>\n` +
`    <name>${escapeXml(name)}</name>\n` +
`    <Placemark>\n` +
`      <name>${escapeXml(name)}</name>\n` +
`      <description>${escapeXml(description)}</description>\n` +
`      <Point>\n` +
`        <coordinates>${p.lon.toFixed(10)},${p.lat.toFixed(10)},0</coordinates>\n` +
`      </Point>\n` +
`    </Placemark>\n` +
`  </Document>\n` +
`</kml>`;

    downloadFile(kml, name + '.kml', 'application/vnd.google-earth.kml+xml');
  });

  // Utility: download a text file
  function downloadFile(content, filename, mime) {
    const blob = new Blob([content], { type: mime || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Basic XML escape for KML content
  function escapeXml(unsafe) {
    return (''+unsafe).replace(/[<>&'"]/g, function (c) {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case "'": return '&apos;';
        case '"': return '&quot;';
      }
    });
  }

  // Optional: convert on enter when inside inputs
  [zoneEl, hemEl, eastingEl, northingEl].forEach(el => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        validarYConvertir();
      }
    });
  });

  // Auto-convert initial sample
  validarYConvertir();

