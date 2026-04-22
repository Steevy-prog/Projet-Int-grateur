#ifndef LUMIERE_H
#define LUMIERE_H

#include <Arduino.h>

void gererLumiere(int lux, const Settings& cfg, int pin) {
  //si lux < 300 (le seuil min), on allume la lumière
  if (lux < cfg.ldrMinLux) {
    digitalWrite(pin, HIGH);
  } else {
    digitalWrite(pin, LOW);
  }
}

#endif