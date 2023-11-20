let ESPList = new Map();
let dataMaps = new Map();

// var dataOne = {
//   labels: [],
//   datasets: [{
//     label: 'Température',
//     backgroundColor: 'rgba(255, 0, 255, 0.2)',
//     borderColor: 'rgba(255, 99, 255, 1)',
//     borderWidth: 1,
//     data: []
//   },
//   {
//     label: 'Humidité',
//     backgroundColor: 'rgba(40, 255, 10, 0.2)',
//     borderColor: 'rgba(10, 255, 10, 1',
//     borderWidth: 1,
//     data: []
//   }]
// };

// var dataTwo = {
//   labels: [],
//   datasets: [{
//     label: 'Température',
//     backgroundColor: 'rgba(255, 0, 255, 0.2)',
//     borderColor: 'rgba(255, 99, 255, 1)',
//     borderWidth: 1,
//     data: []
//   },
//   {
//     label: 'Humidité',
//     backgroundColor: 'rgba(40, 255, 10, 0.2)',
//     borderColor: 'rgba(10, 255, 10, 1',
//     borderWidth: 1,
//     data: []
//   }]
// };

// var chartOne = new Chart(document.getElementById("esp-1").getContext('2d'), {
//   type: 'line',
//   data: dataOne,
//   options: {
//     events: ['click']
//   }
// });
// var chartTwo = new Chart(document.getElementById("esp-2").getContext('2d'), {
//   type: 'line',
//   data: dataTwo,
//   options: {
//     events: ['click']
//   }
// });

// dataMaps.set("192.168.23.111",{"data":dataOne,"chart": chartOne});
// dataMaps.set("192.168.23.100",{"data":dataTwo,"chart": chartTwo});

console.log(dataMaps);

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

function connectToESP(url) {
  const socket = new WebSocket("ws://" + url + ":80");
  let containerDiv;

  socket.addEventListener("open", (event) => {
    console.log("WebSocket connection opened");
    socket.send("Client connected to ESP8266 !");
    createModule(url);
    containerDiv = document.getElementById(url);
    // containerDiv.querySelector("#state").innerHTML = "Connected";
  });

  socket.addEventListener("message", (event) => {
    console.log(event.data);
    let url = event.origin;
    url = url.split("ws://")[1].split("/")[0];
    var obj = JSON.parse(event.data);
    let currentData = dataMaps.get(url).data;
    var currentTime = formatTime();
    if (obj.humidity) {
      let array = currentData.datasets[1].data;
      containerDiv.querySelector("#hum").innerHTML = obj.humidity + "%";
      array.push(obj.humidity);
      currentData.datasets[1].data = array;
      let labels= currentData.labels;
      labels.push(currentTime);
      dataMaps.get(url).chart.update();
    }
    if(obj.temperature){
      let array = currentData.datasets[0].data;
      containerDiv.querySelector("#tmp").innerHTML = obj.temperature + "°C";
      array.push(obj.temperature);
      currentData.datasets[0].data = array;
      dataMaps.get(url).chart.update();
    }
    if (obj.rgb) {
      containerDiv.querySelector("#color").value = "#" + obj.rgb;
    }
    console.log(dataMaps.get(url));
  });

  socket.addEventListener("close", (event) => {
    console.log("WebSocket connection closed");
    // containerDiv.querySelector("#state").innerHTML = "Disconnected";
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
  const closebtn = document.getElementById("esp-close-btn");
  // Get main container
  let mainContainer = document.getElementById("esp-container");
  //Create a subcontainer for the new ESP
  let newSubContainer = document.createElement("div");
  newSubContainer.id = url;
  newSubContainer.classList.add("col-md-6");
  mainContainer.appendChild(newSubContainer);
  // Create canva for chartjs
  let canvascontainer = document.createElement("div");
  canvascontainer.classList.add("pt-5","p-3");
  canvascontainer.style.width = "100%";
  let canvas = document.createElement("canvas");
  canvas.id = "esp-" + url;
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
    updateRGBInfo(selectedColor, ESPList.get(url));
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

  dataMaps.set(url,{"data":data,"chart": chart});
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