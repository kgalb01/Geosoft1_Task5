/**
* Hausaufgabe 2 im Kurs Geosoftware 1, 24.04.2022
* @author: {Kieran Galbraith} matr.Nr.: {453493}
*/

"use strict";

// Dekleration der benötigten Variablen
var distance = new Array(); //Array der die jeweiligen Distanzen speichert

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
  d =  d/1000;
  return d.toFixed(3); //Gibt die Entfernung in Kilometer zurück, gerundet auf 3 Stellen
}

/**
* @function addToDistance
* @desc Fügt mit Hilfe einer for-Schleife ALLE Distanzen in das distance Array
* @param point ein Array, das aus [lon, lat] Koordinaten besteht
* @param poi ein Array von Punkten im GeoJSON-Format, das erst noch geparst werden muss
*/
function addToDistance(point, pois) {
  var parsedPoi = JSON.parse(pois);
  for (var i = 0; i < parsedPoi.features.length; i++) {
    distance[i] = calculateDistance(point, parsedPoi.features[i].geometry.coordinates);
  }
}

// Ausführen der Funktion
addToDistance(point, pois);

/**
* @function
* @desc Nutzt die vorgefertigte .sort Funktion um das Array
* distance zu sortieren, in dem die Entfernungen stecken
* Quelle: W3Schools: https://www.w3schools.com/js/js_array_sort.asp
*/
distance.sort(function(a,b) {
  return a-b;
  }
);

/**
* @function addToTable
* @desc Fügt die (sortierten) Werte des Arrays distance in die Tabelle von index.html
*/
function addToTable() {
  var parsedPoi = JSON.parse(pois);
  var tableBody = document.getElementById('tableBody');
  var table = "";
  for (var i = 0; i < parsedPoi.features.length; i++){
    table = table + "<tr><td>" + parsedPoi.features[i].geometry.coordinates +
    "<td></td>" + "</td><td>" +
    distance[i] + "</td><td>";
  }
  tableBody.innerHTML = table;
}
//Ausführen der Funktion
addToTable();

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
  //Bekannte Variablen aus der toGeoJSON() Funktion: Der Umriss des GeoJSON Datensatzes
  var geoJSON = { "type": "FeatureCollection", "features": [] };
  var features = {"type": "Feature","properties": {},"geometry": {"type": "Point","coordinates": []}};
  features.geometry.coordinates = [position.coords.longitude, position.coords.latitude];
  geoJSON.features.push(features);
  x.innerHTML = JSON.stringify(geoJSON);
}

/**
* @function deleteTable
* @desc Löscht auf Knopfdruck den Inhalt der Tabelle um die Entfernungen, um sie mit der vom Nutzer
* eingegebenen Position neu zu berechnen
* Quelle: https://www.w3schools.com/Jsref/met_table_deleterow.asp (habe mit einer Schleife gearbeitet um alles von der Tabelle zu löschen)
*/
function deleteTable(){
  var table = document.getElementById('tableBody');
  // Man braucht Variablen statt einfach "i" und "table.rows.length" zu nutzen in der Schleife, sonst löscht man nur eine Zeile, nicht alle
  var myVar = 0;
  var rows = table.rows.length;
  for(var i = myVar; i < rows; i++){
    table.deleteRow(myVar);
  }
  /*Um die Tabelle mit zu füllen mit dem vom Nutzer eingegebenen Punkt
  * parsen wir jetzt den Punkt, da er noch im GeoJSON Format ist
  * und führen die entsprechenden Funktionen dann noch mal aus
  */
  var geoJSONpoint = document.getElementById("userGeoJSON").value;
  var parsedGeoJSON = JSON.parse(geoJSONpoint);
  point = parsedGeoJSON.features[0].geometry.coordinates;
  // Jetzt führen wir die Funktionen aus, um die Tabelle entsprechend zu füllen
  addToDistance(point, pois);
  distance.sort(function(a,b) {
    return a-b;
    }
  );
  addToTable();
}
