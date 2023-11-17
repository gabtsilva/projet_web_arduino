#include <ArduinoWebsockets.h>
#include <ESP8266WiFi.h>

const char* ssid = "not_eduroam"; //Enter SSID
const char* password = "12345678"; //Enter Password

using namespace websockets;

WebsocketsServer server;

void setup() {
  Serial.begin(115200);
  // Connect to wifi
  WiFi.begin(ssid, password);

  // Wait some time to connect to wifi
  for(int i = 0; i < 15 && WiFi.status() != WL_CONNECTED; i++) {
      Serial.print(".");
      delay(1000);
  }
  
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address:");
  Serial.println(WiFi.localIP());   //You can get IP address assigned to ESP

  server.listen(80);
  Serial.print("Is server live?");
  Serial.println(server.available());
}

void loop() {
  auto client = server.accept();
  if(client.available()) {
    auto msg = client.readBlocking();

    // log
    Serial.print("Got Message:");
    Serial.println(msg.data());

    // return echo
    client.send("Echo: " + msg.data());

    // close the connection
    client.close();
  }
  
  delay(1000);
}