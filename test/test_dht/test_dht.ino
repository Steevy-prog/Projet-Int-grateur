struct Settings { 
  float tempMax = 30.0; 
  float tempChaud = 35.0;
  float tempFroid = 15.0;
};
Settings config;

#include <DHT.h>
#include "../../main/dht11.h"

DHT dht(4, DHT11);

void setup() {
  Serial.begin(115200);
  dht.begin();
}

void loop() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  bool ok = !isnan(t) && !isnan(h);
  
  lireDHT11(t, h, ok, dht, config);
  
  if (ok && t > config.tempMax) {
    Serial.println("Action: Activer Ventilation");
  }
  
  delay(2000);
}