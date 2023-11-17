#include <ESP8266WiFi.h>
#include <WebSocketsServer.h>
#include <DHT.h>

const char *ssid = "ESP-8266-GA";    // Set the SSID (name) of the access point
const char *password = "12345678";  // Set the password of the access point

const int DHTPin = 0;  // Pin connected to the DHT11 sensor
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

  dht.begin();
  WiFi.softAP(ssid, password);

  Serial.println("Access Point IP address: " + WiFi.softAPIP().toString());

  webSocket.begin();
  webSocket.onEvent(handleWebSocketMessage);
}

void loop() {
  webSocket.loop();

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  String jsonData = "{\"temperature\":" + String(temperature) + ",\"humidity\":" + String(humidity) + "}";
  Serial.println(humidity);
  Serial.println(temperature);

  webSocket.broadcastTXT(jsonData);
  delay(1000);
}
