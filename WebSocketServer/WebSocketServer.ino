#include <ESP8266WiFi.h>
#include <WebSocketsServer.h>
#include <DHT.h>

const char *ssid = "not_eduroam";    // Nom du point d'accès (SSID)
const char *password = "12345678";  // Mot de passe du point d'accès

const int DHTPin = 0;  // Broche connectée au capteur DHT11
DHT dht(DHTPin, DHT11);

WebSocketsServer webSocket = WebSocketsServer(80);

const int redPin = 4;    // Broche pour la LED rouge
const int greenPin = 12;  // Broche pour la LED verte
const int bluePin = 14;   // Broche pour la LED bleue

int lastRed = 255;
int lastGreen = 0;
int lastBlue = 0;
float lastTemperature = 0; // Stocker la dernière valeur de température
float lastHumidity = 0;

void handleWebSocketMessage(uint8_t num, WStype_t type, uint8_t *payload, size_t length) {
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
        analogWrite(redPin, redValue);
        analogWrite(greenPin, greenValue);
        analogWrite(bluePin, blueValue);
      }

    } break;
  }
}

void setup() {
  Serial.begin(115200);

  dht.begin();

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("Connected to WiFi with IP address: " + WiFi.localIP().toString());

  webSocket.begin();
  webSocket.onEvent(handleWebSocketMessage);

  pinMode(redPin, OUTPUT);    // Configurer la broche de la LED rouge en sortie
  pinMode(greenPin, OUTPUT);  // Configurer la broche de la LED verte en sortie
  pinMode(bluePin, OUTPUT);   // Configurer la broche de la LED bleue en sortie

  analogWrite(redPin, lastRed);
  analogWrite(greenPin, lastGreen);
  analogWrite(bluePin, lastBlue);
}

void dghtloop(){
      float temperature = dht.readTemperature();
      float humidity = dht.readHumidity();

      if (temperature != lastTemperature || humidity != lastHumidity) { // Vérifier si la température a changé
        String jsonData = "{\"temperature\":" + String(temperature) + ",\"humidity\":" + String(humidity) + "}";
        webSocket.broadcastTXT(jsonData);
        lastTemperature = temperature;
        lastHumidity = humidity;
 // Mettre à jour la dernière valeur de température
      }

}

void loop() {
  webSocket.loop();
  dghtloop();
}
