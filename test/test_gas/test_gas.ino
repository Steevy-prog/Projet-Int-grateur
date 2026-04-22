struct Settings { 
  int gazMax = 1000; 
};
Settings config;

#include "../../main/gas.h"

void setup() {
  Serial.begin(115200);
  analogReadResolution(12); 
}

void loop() {
  lireGaz(32, config); 
  
  delay(1000);
}