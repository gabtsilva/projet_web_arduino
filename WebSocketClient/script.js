const socket = new WebSocket("ws://192.168.4.1:81"); // UPDATE EN FONCTIONS
var colorPicker = document.getElementById("colorPicker");

socket.addEventListener("open", (event) => {
  console.log("WebSocket connection opened");

  socket.send("Client connected to ESP8266 !");
});

socket.addEventListener("message", (event) => {
  var obj = JSON.parse(event.data);
  document.getElementById("humidity").innerHTML = obj.humidity + "%";
  document.getElementById("temperature").innerHTML = obj.temperature + "°C";
  console.log(event.data);
});

// Connection closed
socket.addEventListener("close", (event) => {
  console.log("WebSocket connection closed");
});

// Connection error
socket.addEventListener("error", (event) => {
  console.error("WebSocket connection error:", event);
});

// Ajouter un écouteur d'événements pour détecter les changements de couleur
colorPicker.addEventListener("input", function () {
  console.log("HANDLER");
  // Récupérer la valeur de la couleur sélectionnée
  var selectedColor = colorPicker.value;

  // Mettre à jour l'affichage des informations RGB
  updateRGBInfo(selectedColor);
});

function updateRGBInfo(color) {
  // Convertir la couleur hexadécimale en RGB
  var rgb = hexToRgb(color);

  // Afficher les informations RGB
  var rgbInfo = document.getElementById("rgbValue");
  rgbInfo.textContent = rgb
    ? `(${rgb.r}, ${rgb.g}, ${rgb.b})`
    : "Invalid Color";

  console.log("rouge : " + rgb.r);
  console.log("vert : " + rgb.g);
  console.log("bleu : " + rgb.b);
}

function hexToRgb(hex) {
  // Supprimer le caractère # du début, si présent
  hex = hex.replace(/^#/, "");

  // Vérifier la longueur de la chaîne hexadécimale
  if (hex.length === 3) {
    // Étendre la couleur courte à une couleur longue (ex: #abc -> #aabbcc)
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  // Convertir la chaîne hexadécimale en valeurs RGB
  var bigint = parseInt(hex, 16);
  var r = (bigint >> 16) & 255;
  var g = (bigint >> 8) & 255;
  var b = bigint & 255;

  // Retourner un objet avec les composants RGB
  return { r, g, b };
}
