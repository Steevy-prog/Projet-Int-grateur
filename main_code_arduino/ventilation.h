#ifndef VENTILATION_H
#define VENTILATION_H

#include <Arduino.h>

void gererVentilation(float temp, int ppm, const Settings& cfg, int pin) {
  //le ventilateur s'active si T > 30°C ou CO2 > 1000 ppm
  bool alerteChaleur = (temp > cfg.tempMax);
  bool alerteGaz = (ppm > cfg.gazMax);

  if (alerteChaleur || alerteGaz) {
    digitalWrite(pin, HIGH);
    //debug console pour proteus
    if (alerteChaleur) Serial.print(F("[VENTILO] ON (Chaleur) "));
    if (alerteGaz) Serial.print(F("[VENTILO] ON (Gaz/CO2) "));
    Serial.println();
  } else {
    digitalWrite(pin, LOW);
  }
}

#endif

