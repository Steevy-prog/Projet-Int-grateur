#ifndef GAS_H
#define GAS_H

#include <Arduino.h>

int calculerPPM(int valeurBrute) {
  //conversion pour ESP32 (0-4095) vers PPM (350-5000)
  return map(valeurBrute, 0, 4095, 350, 5000);
}

void lireGaz(int pin, const Settings& cfg) {
  int brut = analogRead(pin);
  int ppm = calculerPPM(brut);
  
  Serial.print(F("[GAS] Concentration : ")); 
  Serial.print(ppm); 
  Serial.println(F(" ppm"));

  if (ppm > cfg.gazMax) { // cfg.gazMax doit être dans ta struct Settings
    Serial.println(F("  ! ALERTE : Air vicié / Gaz détecté !"));
  }
}

#endif