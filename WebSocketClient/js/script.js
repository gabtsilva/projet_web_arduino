// Map to retrieve an ESP8266 websocket connection based on its IP address
let ESPList = new Map();

// Map to retrieve chartjs data and update it on message event
let dataMaps = new Map();

const createESP = document.getElementById("add-esp");
createESP.addEventListener("click",() => {
  let espIP = document.getElementById("esp-ip").value;
  connectToESP(espIP);
})

const broadcastColor = document.getElementById("broadcast-color");
broadcastColor.addEventListener("change", () => {
  let selectedColor = broadcastColor.value;
  for(let socket of ESPList.values()){
    updateRGBInfo(selectedColor, socket);
  }
})

function connectToESP(ip) {
  const socket = new WebSocket("ws://" + ip + ":80");
  let containerDiv;

  socket.addEventListener("open", (event) => {
    console.log("WebSocket connection opened");
    socket.send("Client connected to ESP8266 !");
    createModule(ip);
    containerDiv = document.getElementById(ip);
  });

  socket.addEventListener("message", (event) => {
    let ip = event.origin;
    ip = ip.split("ws://")[1].split("/")[0];
    var obj = JSON.parse(event.data);
    let currentData = dataMaps.get(ip).data;
    var currentTime = formatTime();
    if (obj.humidity) {
      let array = currentData.datasets[1].data;
      containerDiv.querySelector("#hum").innerHTML = obj.humidity + "%";
      array.push(obj.humidity);
      currentData.datasets[1].data = array;
      let labels= currentData.labels;
      labels.push(currentTime);
      dataMaps.get(ip).chart.update();
    }
    if(obj.temperature){
      let array = currentData.datasets[0].data;
      containerDiv.querySelector("#tmp").innerHTML = obj.temperature + "°C";
      array.push(obj.temperature);
      currentData.datasets[0].data = array;
      dataMaps.get(ip).chart.update();
    }
    if (obj.rgb) {
      containerDiv.querySelector("#color").value = "#" + obj.rgb;
    }
  });

  socket.addEventListener("close", (event) => {
    console.log("WebSocket connection closed");
  });

  socket.addEventListener("error", (event) => {
    console.error("WebSocket connection error:", event);
  });

  ESPList.set(ip,socket);
}

function updateRGBInfo(color, socket) {
  var rgb = hexToRgb(color);
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

// Dynamically creates an http subcontainer to receive data from the ESP8266
function createModule(ip){
  const closebtn = document.getElementById("esp-close-btn");

  // Get main container
  let mainContainer = document.getElementById("esp-container");

  //Create a subcontainer for the new ESP
  let newSubContainer = document.createElement("div");
  newSubContainer.id = ip;
  newSubContainer.classList.add("col-md-6");
  newSubContainer.style.position = "relative";
  mainContainer.appendChild(newSubContainer);

  // Create canva for chartjs
  let canvascontainer = document.createElement("div");
  canvascontainer.classList.add("pt-5","p-3");
  canvascontainer.style.width = "100%";
  let canvas = document.createElement("canvas");
  canvas.id = "esp-" + ip;
  canvascontainer.appendChild(canvas);
  newSubContainer.appendChild(canvascontainer);

  //Create subcontainer structure and components
  let containerHumTmp = document.createElement("div");
  containerHumTmp.id = "hum-tmp";
  containerHumTmp.classList.add("row");
  newSubContainer.appendChild(containerHumTmp);
  let humcontainer = createHumTmpContainer("Taux d'humidité","hum");
  containerHumTmp.appendChild(humcontainer);
  let tmpcontainer = createHumTmpContainer("Température","tmp");
  containerHumTmp.appendChild(tmpcontainer);
  let ledcontainer = document.createElement("div");
  let ledtitle = document.createElement("p");
  ledtitle.innerHTML = "LED control";
  let color = document.createElement("input");
  color.id = "color";
  color.setAttribute("type","color");

  color.addEventListener("input", function () {
    let selectedColor = color.value;
    updateRGBInfo(selectedColor, ESPList.get(ip));
  });
  ledcontainer.appendChild(ledtitle);
  ledcontainer.appendChild(color);
  newSubContainer.appendChild(ledcontainer);

  var data = {
    labels: [],
    datasets: [{
      label: 'Température',
      backgroundColor: 'rgba(255, 0, 255, 0.2)',
      borderColor: 'rgba(255, 99, 255, 1)',
      borderWidth: 1,
      data: []
    },
    {
      label: 'Humidité',
      backgroundColor: 'rgba(40, 255, 10, 0.2)',
      borderColor: 'rgba(10, 255, 10, 1',
      borderWidth: 1,
      data: []
    }]
  };
  var chart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: data,
    options: {
      events: ['click']
    }
  });

  dataMaps.set(ip,{"data":data,"chart": chart});

  // Add button and related event listener to close subcontainer and WebSocket connection
  let closebutton = document.createElement("button");
  closebutton.innerHTML = "X";
  closebutton.id = "esp-close-button";
  closebutton.classList.add("text-white","fw-bold");
  closebutton.addEventListener("click", () => {
    let socket = ESPList.get(ip);
    socket.close();
    let subcontainer = document.getElementById(ip);
    subcontainer.remove();
  });
  newSubContainer.appendChild(closebutton);

  closebtn.click();
}

function createHumTmpContainer(name, id){
  tmphumcontainer = document.createElement("div");
  tmphumcontainer.classList.add("col-md-6");
  tmphumtitle = document.createElement("p");
  tmphumtitle.classList.add("fw-bold", "text-center", "pt-3");
  tmphumtitle.innerHTML = name;
  tmphumdata = document.createElement("p");
  tmphumdata.classList.add("fw-bold", "text-center");
  tmphumdata.id = id;
  tmphumcontainer.appendChild(tmphumtitle);
  tmphumcontainer.appendChild(tmphumdata);
  return tmphumcontainer;
}

function formatTime(){
  var currentDate = new Date();
  var hours = currentDate.getHours();
  var minutes = currentDate.getMinutes();
  var seconds = currentDate.getSeconds()
  if (minutes < 10) {
      minutes = '0' + minutes;
  }
  if (seconds < 10) {
    seconds = '0' + seconds;
}
  return hours + ":" + minutes + ":" + seconds;
}