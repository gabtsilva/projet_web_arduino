#include <ESP8266WiFi.h>
#include <WebSocketsServer.h>
#include <DHT.h>

const char *ssid = "not_eduroam";    // Set the SSID (name) of the access point
const char *password = "12345678";  // Set the password of the access point

const int DHTPin = 0;  // Pin connected to the DHT11 sensor
const int FANPin = 4;
DHT dht(DHTPin, DHT11);

WebSocketsServer webSocket = WebSocketsServer(80);

void handleWebSocketMessage(uint8_t num, WStype_t type, uint8_t *payload, size_t length) {
  switch (type) {
    case WStype_TEXT: {
      Serial.println("Received text message: " + String((char *)payload));
    } break;
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(FANPin, OUTPUT);

  dht.begin();
  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");

  // Print the IP address of the ESP8266
  Serial.println("IP address: " + WiFi.localIP().toString());
  
  webSocket.begin();
  webSocket.onEvent(handleWebSocketMessage);
}

void loop() {
  webSocket.loop();

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  digitalWrite(FANPin,HIGH);
  // if(temperature >= 25.00){
  //   digitalWrite(FANPin, HIGH);
  // }else{
  //   digitalWrite(FANPin, LOW);
  // }

  String jsonData = "{\"temperature\":" + String(temperature) + ",\"humidity\":" + String(humidity) + "}";
  Serial.println(humidity);
  Serial.println(temperature);

  webSocket.broadcastTXT(jsonData);
  delay(1000);
}
