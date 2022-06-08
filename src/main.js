/**
* Hausaufgabe 4 im Kurs Geosoftware 1, 25.05.2022
* @author: {Kieran Galbraith} matr.Nr.: {453493}
*/

"use strict";

// Dekleration der benötigten Variablen
var distance = new Array(); //Array der die jeweiligen Distanzen speichert
//Quelle zum Umgang mit Leaflet: https://leafletjs.com/examples/quick-start/
var mapKey = 'pk.c60b589529c268617694a4b6c1eecffc'; //Öffentlicher Leaflet API-Key
var mapLayer = L.tileLayer.Unwired({
  key: mapKey
});
var map = L.map('leafletMap', {
  center: [51.969508, 7.595737], //Koordinaten von Münster
  zoom: 11,
  layers: [mapLayer],
  zoomControl: true
});
var setLocation;

/**
* @function toGeoJSON
* @desc Funktion, die ein Array mit Lat/Long Koordinaten in ein Vernünftigen GeoJSON Datensatz umwandeltt
* Quelle: Einige Ideen (aber nicht alles) von hier: https://stackoverflow.com/questions/55496909/how-do-you-convert-normal-geographic-json-coming-from-server-into-geojson
* @param coords die Koordinaten die umgewandelt werden sollen
*/

function toGeoJSON(coords){
  //Der Umriss des GeoJSON Datensatzes
  //Überprüfung erfolgte durch https://geojsonlint.com/
  var geoJSON = { "type": "FeatureCollection", "features": [] };
  var features = { "type": "Feature", "properties": {}, "geometry": { "type": "Point", "coordinates": [] } };
  for (var i = 0; i < coords.length; i++){
    var geoJSONFeature = features;
    geoJSONFeature.geometry.coordinates = coords[i];
    geoJSON.features.push(JSON.parse(JSON.stringify(geoJSONFeature)));
  }
  return geoJSON;
}

/**
* @function calculateDistance
* @desc Die Funktion nimmt zwei Punkte im WGS84 Format entgegen
* und berechnet die Entfernung zwischen den Punkten
* Quelle der Berechnung: https://www.movable-type.co.uk/scripts/latlong.html
* @param point ein Array, das aus [lon, lat] Koordinaten besteht
* @param pointOfInterest ein Array, das aus [lon, lat] Koordinaten besteht
* die mit dem Parameter point verglichen werden kann
*/

function calculateDistance(point, pointOfInterest){
  //Variablen Deklaration
  var R; //Radius der Erde in Meter
  var phi1; //Phi und Lambda in Radianten
  var phi2;
  var deltaPhi;
  var deltaLambda;
  var a;
  var c;
  var d; //Das Ergebnis der Berechnung - also die die Distanz
  var pi; // Hilfsvariable

  pi = Math.PI;
  R = 6371e3;
  phi1 = point[1] * pi/180; //Umrechnung zu Radianten
  phi2 = pointOfInterest[1] * pi/180;
  deltaPhi = ((pointOfInterest[1] - point[1]) * pi/180);
  deltaLambda = ((point[0] - pointOfInterest[0]) * pi/180);
  //Das folgende berechnet die "Haversine-Formel" Quelle: Siehe oben
  a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
      Math.cos(phi1) * Math.cos(phi2) *
      Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
  c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  d = R * c;
  return d.toFixed(3); //Gibt die Entfernung in Kilometer zurück, gerundet auf 3 Stellen
}

/**
 * @function getLocation
 * @desc Funktion, die im Browser eine Anfrage auf die geographische Position des Nutzers stellt
 * Quelle: https://www.w3schools.com/html/html5_geolocation.asp
 */
function getLocation() {
  var x = document.getElementById("userGeoJSON");
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else {
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}

/**
 * @function showPosition
 * @desc Funktion um die in "getLocation()" abgefragte Position in validen GeoJSON anzuzeigen
 * wandelt die Position von Lat/Long Koordinaten mit Hilfe der "toGeoJSON()" Funktion um
 * Quelle: https://www.w3schools.com/html/html5_geolocation.asp (abgewandelt)
 * @param position Position des Nutzers
 */
function showPosition(position) {
  var x = document.getElementById("userGeoJSON");
  var location = [];
  location.push(position.coords.latitude);
  location.push(position.coords.longitude);
  setLocation = L.marker(location).addTo(map).on('click', function(newFunction){
    map.removeLayer(setLocation);
  });
  map.setView(location);
  //Bekannte Variablen aus der toGeoJSON() Funktion: Der Umriss des GeoJSON Datensatzes
  var geoJSON = { "type": "FeatureCollection", "features": [] };
  var features = {"type": "Feature","properties": {},"geometry": {"type": "Point","coordinates": []}};
  features.geometry.coordinates = [position.coords.longitude, position.coords.latitude];
  geoJSON.features.push(features);
  x.innerHTML = JSON.stringify(geoJSON);
}

/**
* @class BusAbfrage
* @desc Klasse zur Steuerung der XHR Anfragen der Münsteraner Bus API
* Weitere Informationen zur genutzten API unter: https://api.busradar.conterra.de/
*/
class BusAbfrage{
  //Konstruktor um Objekte der Klasse BusAbfrage zu erstellen
  constructor(){
    this.xhr = new XMLHttpRequest();
    this.xhr.responseType = 'json';
  }

  /**
  * @function sendHaltestellen
  * @desc Sendet die XHR Anfrage um alle Haltestellen zu erhalten
  */
  static sendHaltestellen(){
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.onerror = function(){
      console.log("An error has occured");
      alert("An error has occured");
    };
    xhr.onreadystatechange = function(){
      if (xhr.status == "200" && xhr.readyState == 4) {
        BusAbfrage.haltestellenCallback(xhr.response);
      }
    };
    xhr.open('GET', 'https://rest.busradar.conterra.de/prod/haltestellen', true);
    xhr.send();
  }

  /**
  * @function haltestellenCallback
  * @desc Callbackfunktin der Haltestellenabfrage
  * @param geoJSON Die Antwort auf die Haltestellenanfrage aus sendHaltestellen
  */
  static haltestellenCallback(geoJSON){
      // Dekleration der benötigten Variablen
      var userLocation = JSON.parse(document.getElementById('userGeoJSON').value);

      //var userLocation = JSON.parse(document.getElementById('userGeoJSON').value);
      setLocation.setLatLng(userLocation.features[0].geometry.coordinates.reverse()); //Die Nutzer Koordinaten werden in GeoJSON falschrum angegeben (Lon, Lat)
      map.setView(userLocation.features[0].geometry.coordinates);
      //Berechnung  der Distanzen und Eintragen ins Array
      for (var i = 0; i < geoJSON.features.length; i++) {
        var distanz = Math.round(calculateDistance(userLocation.features[0].geometry.coordinates, geoJSON.features[i].geometry.coordinates));
        var haltestellenNr = geoJSON.features[i].properties.nr;
        var haltestellenName = geoJSON.features[i].properties.lbez;
        distance.push([distanz, haltestellenNr, haltestellenName]);
      }

      //Sortieren der Distanzen auf bekannte Art; Siehe W3Schools: https://www.w3schools.com/js/js_array_sort.asp
      distance.sort(function(a, b) {
        return a[0] - b[0];
      });

      //Variablen zum Auffüllen der 10 Busstationen
      var bus = document.getElementById('bus');
      var buslist = "";

      //Bushaltestelle und Entfernung einfügen
      //###WICHTIG### Ich habe es auf 10 Haltestellen reduziert um die Anfragen gering zu halten
      for (var j = 0; j < 10; j++) {
        BusAbfrage.sendAbfahrten(distance[j][1]);
        buslist = buslist + "<div><h4>" + distance[j][2] + "</h4> liegt " + distance[j][0] + " Meter entfernt" + ".<br><div id='" + distance[j][1] + "'></div></div>";
      }
      bus.innerHTML = buslist;
  }

  /**
  * @function sendAbfahrten
  * @desc Sendet die XHR Anfrage um alle Haltestellen zu erhalten
  * @param haltestelle die Nummer der Haltestelle für detaillierte Informationen
  */
  static sendAbfahrten(haltestelle){
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.onerror = function(){
      console.log("An error has occured");
      alert("An error has occured");
    };
    xhr.onreadystatechange = function() {
      if (xhr.status == "200" && xhr.readyState == 4) {
        BusAbfrage.abfahrtenCallback(xhr.response, haltestelle);
      }
    };
    xhr.open('GET', 'https://rest.busradar.conterra.de/prod/haltestellen/' + haltestelle + '/abfahrten?sekunden=300', true);
    xhr.send();
  }

  /**
  * @function abfahrtenCallback
  * @desc Callbackfunktion der Abfahrtenanfrage
  * @param geoJSON Antwort der Abfahrtenanfrage
  * @param haltestelle die Nummer der Haltestelle für detaillierte Informationen
  */
  static abfahrtenCallback(geoJSON, haltestelle){
    //DOM Manipulation um eine Tabelle im HTML Dokument zu erstellen und zu füllen
    var fillTable = document.getElementById(haltestelle);
    //Fehler Meldung falls keine Busse an der Haltestelle in den nächsten 5 Minuten (300 Sekunden) abfahren
    if (geoJSON.length == 0) {
      fillTable.innerHTML = "<p>Es fahren leider keine Busse in den nächsten 5 Minutenvon dieser Haltestelle</p>";
    } else BusAbfrage.createTable(geoJSON, fillTable);
  }

  /**
  * @function createTable
  * @desc Erzeugt durch DOM Manipulation eine Tabelle mit den Abfahrtsinformationen im HTML Dokument
  * @param geoJSON Die Antworten auf die XHR anfragen
  * @param fillTable  Der Inhalt der Tabelle
  */
  static createTable(geoJSON, fillTable){
    //Kopfzeile der Tabelle mit den Abfahrtsinformationen erzeugen
    var innerHTMLTable = "<tr><thead><td>Busnummer</td><td>Richtung</td><td>Abfahrtszeit</td></thead></tr>";
    var table = document.createElement('table');
    //Tabelle mit Infos der API auffüllen
    for (var i = 0; i < geoJSON.length; i++) {
      var busnummer = geoJSON[i].linienid;
      var richtungstext = geoJSON[i].richtungstext;
      var uhrzeit = new Date(geoJSON[i].tatsaechliche_abfahrtszeit * 1000).toLocaleTimeString();
      innerHTMLTable = innerHTMLTable + "<tr><td>" + busnummer + "</td><td>" + richtungstext + "</td><td>" + uhrzeit + "</td></tr>";
    }
    table.innerHTML = innerHTMLTable;
    fillTable.appendChild(table);
  }
} //Letzte Klammer der Klasse!


  /**
  * @function leafletHaltestellen
  * @desc XHR Anfrage um die Haltestellen auf der Leaflet Karte darstellen zu können
  */
  function leafletHaltestellen(){
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json'
    xhr.onerror = function(){
      console.log("An error has occured");
      alert("An error has occured");
    };
    xhr.onreadystatechange = function() {
      if(xhr.status == "200" && xhr.readyState == 4){
        leafletHaltestellenCallback(xhr.response);
      }
    };
    xhr.open('GET', 'https://rest.busradar.conterra.de/prod/haltestellen', true);
    xhr.send();
  }

  /**
  * Ab hier größten Teils neu (Geoinformatik1 Hausaufgabe 4)
  * Stand: 25.05.2022
  */

  /**
  * @function leafletHaltestellenCallback
  * @desc Callbackfunktion der leafletHaltestellen Anfrage
  * @param geoJSON XHR Antwort auf die Anfrage leafletHaltestellen
  */
  function leafletHaltestellenCallback(geoJSON){
    //Definition bzw. Lokalisation des Bildes was als Icon für die Bushaltestelle dient
    var busStopIcon = L.icon({
      iconUrl: 'bus.png',
      iconSize: [17, 17],
      iconAnchor: [5, 5]
    });
    // Karte füllen
    for(var i = 0; i < geoJSON.features.length; i++){
      // Dekleration der benötigten Variablen
      var userLocation = JSON.parse(document.getElementById('userGeoJSON').value);
      var lbez = geoJSON.features[i].properties.lbez;
      var richtung = geoJSON.features[i].properties.richtung;
      var coords = geoJSON.features[i].geometry.coordinates;
      var distanz = Math.round(calculateDistance(userLocation.features[0].geometry.coordinates, coords));
      var marker = L.marker(coords.reverse(), {
        icon: busStopIcon
      }).addTo(map);
      marker.bindPopup("<b>Haltestelle: " + lbez + "<br>Richtung: " + richtung + "<br>Entfernung zum Nutzer: " + distanz + " Meter" + "</b>");
    }
  }
