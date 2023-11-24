#include <ESP8266WiFi.h>
#include <WebSocketsServer.h>
#include <DHT.h>
#include "config.h"

DHT dht(DHT_PIN, DHT11);
WebSocketsServer webSocket = WebSocketsServer(80);

int lastRed = 255;
int lastGreen = 0;
int lastBlue = 0;
float lastTemperature = 0; // Stocker la dernière valeur de température
float lastHumidity = 0;

void handleWebSocketEvents(uint8_t num, WStype_t type, uint8_t *payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED: {
    // Convertir les valeurs RGB en une seule valeur hexadécimale
    unsigned int rgbValue = ((lastRed & 0xFF) << 16) | ((lastGreen & 0xFF) << 8) | (lastBlue & 0xFF);

    // Convertir la valeur hexadécimale en chaîne hexadécimale formatée avec une longueur fixe de 6 caractères
    char hexChars[7];
    sprintf(hexChars, "%06X", rgbValue);
    String hexString = String(hexChars);

    // Créer un objet JSON pour la température et l'humidité
    String currentData = "{\"temperature\":" + String(lastTemperature) + ",\"humidity\":" + String(lastHumidity) + ",\"rgb\": \"" + hexString + "\"}";

    // Envoie les informations courantes au client qui se connecte en cours de route
    webSocket.sendTXT(num, currentData);
    }
    case WStype_TEXT: {
      String receivedMessage = String((char *)payload);

      if (receivedMessage.startsWith("RGB:")) {
        Serial.println(receivedMessage);
        // Extraire les valeurs RGB de la chaîne reçue
        receivedMessage.remove(0, 4); // Supprimer "RGB:"
        int firstComma = receivedMessage.indexOf(',');
        int secondComma = receivedMessage.lastIndexOf(',');
        
        Serial.println();
        // Extraire les valeurs R, G et B
        int redValue = receivedMessage.substring(0, firstComma).toInt();
        int greenValue = receivedMessage.substring(firstComma + 1, secondComma).toInt();
        int blueValue = receivedMessage.substring(secondComma + 1).toInt();
                
       // Convertir les valeurs RGB en une seule valeur hexadécimale
        unsigned int rgbValue = ((redValue & 0xFF) << 16) | ((greenValue & 0xFF) << 8) | (blueValue & 0xFF);

        // Convertir la valeur hexadécimale en chaîne hexadécimale formatée avec une longueur fixe de 6 caractères
        char hexChars[7];
        sprintf(hexChars, "%06X", rgbValue);
        String hexString = String(hexChars);

        // Créer un objet JSON avec la valeur hexadécimale
        String jsonData = "{\"rgb\": \"" + hexString + "\"}";

        // Envoyer la chaîne JSON via WebSocket
        webSocket.broadcastTXT(jsonData);

        lastRed = redValue;
        lastGreen = greenValue;
        lastBlue = blueValue;
        
        // Appliquer les valeurs RGB aux broches correspondantes
        analogWrite(RED_LED_PIN, redValue);
        analogWrite(GREEN_LED_PIN, greenValue);
        analogWrite(BLUE_LED_PIN, blueValue);
      }

    } break;
  }
}

void dghtloop(){
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  if (temperature != lastTemperature || humidity != lastHumidity) { // Vérifier si la température a changé
    String jsonData = "{\"temperature\":" + String(temperature) + ",\"humidity\":" + String(humidity) + "}";
    webSocket.broadcastTXT(jsonData);
    lastTemperature = temperature;
    lastHumidity = humidity;
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();

  // Connect to Wi-Fi
  WiFi.begin(SSID, SSID_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("Connected to WiFi with IP address: " + WiFi.localIP().toString());

  webSocket.begin();
  webSocket.onEvent(handleWebSocketEvents);

  pinMode(RED_LED_PIN, OUTPUT);    // Configurer la broche de la LED rouge en sortie
  pinMode(GREEN_LED_PIN, OUTPUT);  // Configurer la broche de la LED verte en sortie
  pinMode(BLUE_LED_PIN, OUTPUT);   // Configurer la broche de la LED bleue en sortie

  analogWrite(RED_LED_PIN, lastRed);
  analogWrite(GREEN_LED_PIN, lastGreen);
  analogWrite(BLUE_LED_PIN, lastBlue);
}

void loop() {
  webSocket.loop();
  dghtloop();
}
