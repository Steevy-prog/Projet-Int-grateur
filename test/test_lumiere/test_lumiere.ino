struct Settings { int ldrMinLux = 300; };
Settings config;

#include "../../main/lumiere.h"

const int PIN_LED = 2; 

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LED, OUTPUT);
}

void loop() {
  //simuler l'obscurité (100 Lux < 300 Lux)
  Serial.println("Test: Obscurité");
  gererLumiere(100, config, PIN_LED);
  delay(2000);

  //simuler le jour (500 Lux)
  Serial.println("Test: Plein jour");
  gererLumiere(500, config, PIN_LED);
  delay(2000);
}