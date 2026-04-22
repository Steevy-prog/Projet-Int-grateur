#ifndef LDR_H
#define LDR_H

#include <Arduino.h>

void lireLDR(int brut, float pct, const Settings& config, int pinLed) {
  Serial.println(F("[LDR] Intensite lumineuse"));
  Serial.print(F("  Valeur : ")); Serial.print(brut);
  Serial.print(F(" | "));        Serial.print(pct, 1); Serial.println(F(" %"));
  Serial.print(F("  Etat : "));

  if (brut < config.ldrNuit) {
    Serial.println(F("Nuit"));
    digitalWrite(pinLed, LOW);
  } else if (brut < config.ldrFaible) {
    Serial.println(F("Couvert"));
    digitalWrite(pinLed, LOW);
  } else if (brut < config.ldrMoyen) {
    Serial.println(F("Diffuse"));
    digitalWrite(pinLed, HIGH);
  } else {
    Serial.println(F("Pleine luminosite"));
    digitalWrite(pinLed, HIGH);
  }
}

#endif