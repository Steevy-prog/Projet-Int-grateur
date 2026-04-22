struct Settings { int ldrMinLux = 300; };
Settings config;

#include "../../main/ldr.h"

void setup() {
  Serial.begin(115200);
  pinMode(2, OUTPUT); //LED intégrée
}

void loop() {
  int brute = analogRead(34);
  int lux = calculerLux(brute);
  
  Serial.print("Brut: "); 
  Serial.print(brute);
  Serial.print("-> Lux: "); 
  Serial.println(lux);
  
  if (lux < config.ldrMinLux) {
    Serial.println("TEST: Seuil atteint -> LED ON");
    digitalWrite(2, HIGH);
  } else {
    digitalWrite(2, LOW);
  }
  delay(1000);
}