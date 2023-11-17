let ESPList = new Map();

function connectToESP(url) {
  const socket = new WebSocket("ws://" + url + ":80");
  let containerDiv;

  socket.addEventListener("open", (event) => {
    console.log("WebSocket connection opened");
    socket.send("Client connected to ESP8266 !");
    createModule(url);
    containerDiv = document.getElementById(url);
    containerDiv.querySelector("#state").innerHTML = "Connected";
  });

  socket.addEventListener("message", (event) => {
    var obj = JSON.parse(event.data);
    if (obj.humidity) {
      containerDiv.querySelector("#hum").innerHTML = obj.humidity + "%";
    }
    if(obj.temperature){     
      containerDiv.querySelector("#tmp").innerHTML = obj.temperature + "°C";
    }
    if (obj.rgb) {
      containerDiv.querySelector("#color").value = "#" + obj.rgb;
    }
  });

  socket.addEventListener("close", (event) => {
    console.log("WebSocket connection closed");
    containerDiv.querySelector("#state").innerHTML = "Disconnected";
  });

  socket.addEventListener("error", (event) => {
    console.error("WebSocket connection error:", event);
  });

  ESPList.set(url,socket);
}

function updateRGBInfo(color, socket) {
  var rgb = hexToRgb(color);

  console.log("rouge : " + rgb.r);
  console.log("vert : " + rgb.g);
  console.log("bleu : " + rgb.b);

  const rdgMessage = `RGB:${rgb.r}, ${rgb.g}, ${rgb.b}`;
  socket.send(rdgMessage);
}

function hexToRgb(hex) {  
  hex = hex.replace(/^#/, "");

  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  var bigint = parseInt(hex, 16);
  var r = (bigint >> 16) & 255;
  var g = (bigint >> 8) & 255;
  var b = bigint & 255;

  return { r, g, b };
}

function createModule(url){
  let elements = [];
  let containerDiv = document.getElementById(url);
  let containerHumTmp = containerDiv.querySelector("#hum-tmp");
  
  let state = document.createElement("p");
  state.id = "state";
  state.innerHTML = "Disconnected";
  
  let hum = containerHumTmp.querySelector("#hum");
  hum.innerHTML = "Awaiting for data"

  let tmp = containerHumTmp.querySelector("#tmp");
  tmp.innerHTML = "Awaiting for data";

  let color = document.createElement("input");
  color.id = "color";
  color.setAttribute("type","color");

  color.addEventListener("input", function () {
    let selectedColor = color.value;
    updateRGBInfo(selectedColor, ESPList.get(url));
  });

  elements.push(state);
  // elements.push(hum);
  // elements.push(tmp);
  elements.push(color);
  elements.forEach((element) => {
    containerDiv.append(element);
  });
}