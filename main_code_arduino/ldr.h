#ifndef LDR_H
#define LDR_H

#include <Arduino.h>

int calculerLux(int brut) {
  //on convertit la valeur 0-4095 en une échelle de 0-1000 lux
  float tension = (brut * 3.3) / 4095.0;
  if (tension <= 0) return 0;
  //formule simplifiée
  int lux = (int)(500 * (tension / 3.3)); 
  return lux;
}

void lireLDR(int luxactuel, const Settings& config) {
  Serial.print(F("[LDR] Luminosité : ")); 
  Serial.print(luxactuel); 
  Serial.println(F(" Lux"));
  
  if (luxactuel < config.ldrMinLux) {
    Serial.println(F("  ! ALERTE : Lumière insuffisante !"));
  }
}

#endif