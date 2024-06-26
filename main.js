import './style.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { TileWMS } from 'ol/source';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import Overlay from 'ol/Overlay.js';
import { toLonLat } from 'ol/proj.js';
import { toStringHDMS } from 'ol/coordinate.js';
import GeoJSON from 'ol/format/GeoJSON';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import XYZ from 'ol/source/XYZ';
import { ScaleLine, defaults as defaultControls } from 'ol/control.js';

const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');

const scaleControl = new ScaleLine({
  units: 'metric',
  bar: true,
  steps: 4,
  text: true,
  minWidth: 140,
});

const overlay = new Overlay({
  element: container,
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});

// Define a style function based on the 'country_name_count' property
const styleFunction = function (feature) {
  const count = feature.get('country_name_count');
  let fillColor;

  if (count > 50) {
    fillColor = '#67000d';
  } else if (count > 20) {
    fillColor = '#d32020';
  } else if (count > 10) {
    fillColor = '#fb7050';
  } else if (count > 5) {
    fillColor = '#fcbea5'
  } else {
    fillColor = '#fff5f0'
  }

  return new Style({
    stroke: new Stroke({
      color: '#000000',
      width: 2
    }),
    fill: new Fill({
      color: fillColor
    })
  });
};
const layers = [
  new TileLayer({
    source: new OSM(),
    title: 'OpenStreetMap',
    type: 'base',
    visible: true
  }),
  new TileLayer({
    source: new XYZ({
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attributions: '© Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      maxZoom: 19,
    }),
    title: 'Satellite',
    type: 'base',
    visible: false
  }),
  //DOTA2 GeoJSON layers
  new VectorLayer({
    source: new VectorSource({
      url: 'https://api.maptiler.com/data/dd197af5-2861-4740-9251-0c162e3a0b88/features.json?key=AMVO8mU7fwY8vNjJNkPJ',
      format: new GeoJSON()
    }),
    title: 'dotaearnings2021_geojson',
    visible: false,
    style: styleFunction
  })
];

const map = new Map({
  controls: defaultControls().extend([scaleControl]),
  target: 'map',
  layers: layers,
  overlays: [overlay],
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};

// Function to change the layer visibility based on checkbox state
function changeLayer(layerTitle, visible) {
  const layer = layers.find(layer => layer.get('title') === layerTitle);
  if (layer) {
    layer.setVisible(visible);
  }
}
// Event listener for the checkboxes
document.querySelectorAll('input[name="layer"]').forEach(checkbox => {
  checkbox.addEventListener('change', function (e) {
    changeLayer(e.target.value, e.target.checked);
  });
});

// Map Handle Single Click and display Info
map.on('singleclick', function (evt) {
  const coordinate = evt.coordinate;
  const hdms = toStringHDMS(toLonLat(coordinate));

  // Display clicked coordinates
  content.innerHTML = '<p>You clicked here:</p><code>' + hdms + '</code>';
  overlay.setPosition(coordinate);

  // Find the currently visible WMS or vector layer
  const visibleLayers = layers.filter(layer => layer.getVisible() && (layer.getSource() instanceof TileWMS || layer.getSource() instanceof VectorSource));

  if (visibleLayers.length > 0) {
    const visibleLayer = visibleLayers[0];

    if (visibleLayer.getSource() instanceof TileWMS) {
      const infoFormat = 'application/json';
      const url = visibleLayer.getSource().getFeatureInfoUrl(
        coordinate,
        map.getView().getResolution(),
        map.getView().getProjection(),
        {
          'INFO_FORMAT': infoFormat,
          'QUERY_LAYERS': visibleLayer.getSource().getParams().LAYERS,
          'LAYERS': visibleLayer.getSource().getParams().LAYERS,
          'FEATURE_COUNT': 50  // Adjust as needed
        }
      );

      if (url) {
        fetch(url)
          .then(response => response.json())
          .then(data => {
            if (data.features && data.features.length > 0) {
              // Parse the feature information from the response
              data.features.forEach(feature => {
                // Format the information to display
                const featureInfo = `
                <p>Player Name: ${feature.properties["Player Name"]}</p>
                <p>Player ID: ${feature.properties["Player ID"]}</p>
                <p>Total earnings (year): ${feature.properties["Total earnings(year)"]}</p>
              `;
                // Display the formatted feature information in the popup
                content.innerHTML += featureInfo;
              });
            } else {
              content.innerHTML += '<p>No feature information found at this location.</p>';
            }
          })
          .catch(error => {
            console.error('Error fetching feature info:', error);
            content.innerHTML += '<p>Error fetching feature information.</p>';
          });
      } else {
        content.innerHTML += '<p>No feature information found at this location.</p>';
      }
    } else if (visibleLayer.getSource() instanceof VectorSource) {
      const features = visibleLayer.getSource().getFeaturesAtCoordinate(coordinate);

      if (features.length > 0) {
        features.forEach(feature => {
          // Format the information to display
          const featureInfo = `
            <p>Player ID: ${feature.get('Player ID')}</p>
            <p>Total earnings (year): ${feature.get('Total earnings(year)')}</p>
          `;
          // Display the formatted feature information in the popup
          content.innerHTML += featureInfo;
        });
      } else {
        content.innerHTML += '<p>No feature information found at this location.</p>';
      }
    }
  } else {
    content.innerHTML += '<p>No visible layer to query.</p>';
  }
});
// Search functionality
document.getElementById('search-button').addEventListener('click', function () {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const vectorLayers = layers.filter(layer => layer instanceof VectorLayer);

  console.log('Search Term:', searchTerm);

  let found = false;

  for (const layer of vectorLayers) {
    const source = layer.getSource();
    const features = source.getFeatures();

    console.log('Number of features in layer:', features.length);

    const matchingFeatures = features.filter(feature => {
      const properties = feature.getProperties();
      return Object.values(properties).some(value =>
        String(value).toLowerCase().includes(searchTerm)
      );
    });

    if (matchingFeatures.length > 0) {
      const extent = matchingFeatures[0].getGeometry().getExtent();

      // Only fit to the extent if it's valid
      if (extent && extent[0] !== Infinity && extent[1] !== Infinity) {
        map.getView().fit(extent, { duration: 1000 });
        found = true;
        break;
      } else {
        console.warn('Invalid extent found for feature:', matchingFeatures[0]);
      }
    }
  }

  if (!found) {
    alert('No matching features found.');
  }
});
