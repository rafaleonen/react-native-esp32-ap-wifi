// Load Wi-Fi library
#include <WiFi.h>
#include <WebSocketsServer.h>

// Replace with your network credentials
const char* ssid     = "ESP32-Access-Point";
const char* password = "esp32teste";

WebSocketsServer webSocket = WebSocketsServer(80);

String cmd = "";

// Called when receiving any WebSocket message
void onWebSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  // Figure out the type of WebSocket event
  switch(type) {
 
    // Client has disconnected
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Disconnected!\n", num);
      break;
 
    // New client has connected
    case WStype_CONNECTED:
      {
        IPAddress ip = webSocket.remoteIP(num);
        Serial.printf("[%u] Connection from ", num);
        Serial.println(ip.toString());

        webSocket.sendTXT(num, cmd);
/*
        String msg = (char*)payload;

      if(msg == "READ") {
        Serial.println("leu");
        Serial.println(msg);
        WebSocketSendMessage(num); 
      }*/
      }
      break;
 
    // Echo text message back to client
    case WStype_TEXT:
      Serial.printf("[%u] Text: %s\n", num, payload);
  }
}

void WebSocketSendMessage(uint8_t num) {
  webSocket.sendTXT(num, cmd);
}

void setup() {
  Serial.begin(115200);

  // Connect to Wi-Fi network with SSID and password
  Serial.print("Setting AP (Access Point)…");
  // Remove the password parameter, if you want the AP (Access Point) to be open
  WiFi.softAP(ssid, password);
  IPAddress IP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(IP);

  webSocket.begin();
  webSocket.onEvent(onWebSocketEvent);
}

void loop() {

   webSocket.loop();

   if(Serial.available()) {
    cmd = Serial.readString();
   }
 }
