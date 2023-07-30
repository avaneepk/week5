document.addEventListener("DOMContentLoaded", () => {
  // Step 1: Create the Leaflet map with the specified attributes
  const map = L.map("map", {
    minZoom: -3
  }).setView([63.0, 25.0], 5);

  // Step 2: Add OpenStreetMap background to the map
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Step 3: Fetch and display GeoJSON data
  fetch(
    "https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326"
  )
    .then((response) => response.json())
    .then((data) => {
      const geojsonLayer = L.geoJSON(data, {
        weight: 2
      }).addTo(map);

      // Step 4: Fit the map to the bounds of the GeoJSON data
      map.fitBounds(geojsonLayer.getBounds());

      // Step 5: Add tooltip to show municipality name on hover
      geojsonLayer.eachLayer((layer) => {
        layer.bindTooltip(layer.feature.properties.nimi, {
          permanent: false,
          direction: "auto"
        });
      });

      // Step 6: Add popup to show positive and negative migration on click
      geojsonLayer.on("click", (e) => {
        const municipalityCode = e.layer.feature.properties.kunta;
        const positiveMigrationUrl = `https://statfin.stat.fi/PxWeb/sq/4bb2c735-1dc3-4c5e-bde7-2165df85e65f?query=alueraja&tiedot=Muuttoliike&kunta=${municipalityCode}&vuosi=2020&v5=107`;
        const negativeMigrationUrl = `https://statfin.stat.fi/PxWeb/sq/944493ca-ea4d-4fd9-a75c-4975192f7b6e?query=alueraja&tiedot=Muuttoliike&kunta=${municipalityCode}&vuosi=2020&v5=108`;

        Promise.all([
          fetch(positiveMigrationUrl).then((response) => response.json()),
          fetch(negativeMigrationUrl).then((response) => response.json())
        ])
          .then((results) => {
            const positiveMigration = results[0].data[0][0];
            const negativeMigration = results[1].data[0][0];

            const popupContent = `
              <b>${e.layer.feature.properties.nimi}</b><br>
              Positive Migration: ${positiveMigration}<br>
              Negative Migration: ${negativeMigration}
            `;

            e.layer.bindPopup(popupContent).openPopup();
          })
          .catch((error) => {
            console.error("Error fetching migration data:", error);
          });
      });
    })
    .catch((error) => {
      console.error("Error fetching GeoJSON data:", error);
    });
});
