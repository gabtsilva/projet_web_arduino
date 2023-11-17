let ESPList = new Map();

var colorPicker = document.getElementById("colorPicker");
let divInfoConnexion = document.querySelector(".connexion");
let FLAG_COLOR = true;

function connectToESP(url) {
  const socket = new WebSocket("ws://" + url + ":80");

  socket.addEventListener("open", (event) => {
    console.log("WebSocket connection opened");
    divInfoConnexion.innerHTML = "connecté à ESP8266";
    socket.send("Client connected to ESP8266 !");
    createModule(url);
    var obj = JSON.parse(event.data);
    document.getElementById("humidity").innerHTML = obj.humidity + "%";
    document.getElementById("temperature").innerHTML = obj.temperature + "°C";
    colorPicker.value = "#" + obj.rgb;
  });

  socket.addEventListener("message", (event) => {
    var obj = JSON.parse(event.data);
    if (obj.humidity) {
      document.getElementById("humidity").innerHTML = obj.humidity + "%";
      document.getElementById("temperature").innerHTML = obj.temperature + "°C";
    }
    console.log(event.data);
    if (obj.rgb) {
      // FLAG_COLOR = false;
      colorPicker.value = "#" + obj.rgb;
      // FLAG_COLOR = true;
    }
  });

  socket.addEventListener("close", (event) => {
    console.log("WebSocket connection closed");
    divInfoConnexion.innerHTML = "Déconnecté";
  });

  socket.addEventListener("error", (event) => {
    console.error("WebSocket connection error:", event);
  });

  ESPList.set(url,socket);
}
// Ajouter un écouteur d'événements pour détecter les changements de couleur
colorPicker.addEventListener("input", function () {
  console.log("HANDLER");
  // Récupérer la valeur de la couleur sélectionnée
  var selectedColor = colorPicker.value;

  // Mettre à jour l'affichage des informations RGB
  //if (FLAG_COLOR) {
  updateRGBInfo(selectedColor);
  //}
});

function updateRGBInfo(color) {
  // Convertir la couleur hexadécimale en RGB
  var rgb = hexToRgb(color);

  console.log("rouge : " + rgb.r);
  console.log("vert : " + rgb.g);
  console.log("bleu : " + rgb.b);

  const rdgMessage = `RGB:${rgb.r}, ${rgb.g}, ${rgb.b}`;
  socket.send(rdgMessage);
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

function createModule(url){
  const p_state = document.createElement("p").setAttribute("id","state." + url);
  const p_hum = document.createElement("p").setAttribute("id","hum-" + url);
  const p_tmp = document.createElement("p").setAttribute("id","tmp-" + url);
  const input = document.createElement("input").setAttribute("id","color-" + url);
  document.body.appendChild(p_state);

}