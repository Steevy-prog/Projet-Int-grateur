#ifndef SOIL_H
#define SOIL_H

#include <Arduino.h>

int lireHumiditeSol(int pin) {
  int brut = analogRead(pin);
  int pct = map(brut, 4095, 1500, 0, 100);
  return constrain(pct, 0, 100);
}

#endif


