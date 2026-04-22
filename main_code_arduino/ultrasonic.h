#ifndef ULTRASONIC_H
#define ULTRASONIC_H

#include <Arduino.h>

float mesurerDistance(int tr, int ec, float h, float o) {
  digitalWrite(tr, LOW); delayMicroseconds(2);
  digitalWrite(tr, HIGH); delayMicroseconds(10);
  digitalWrite(tr, LOW);
  long d = pulseIn(ec, HIGH, 30000);
  return (d == 0) ? (h + o) : (d * 0.0343) / 2.0;
}
int calculerNiveauPct(float dist, float h, float o) {
  float eau = (h + o) - dist;
  return constrain((int)((eau / h) * 100), 0, 100);
}
void lireReservoir(float dist, int pct, const Settings& cfg) {
  Serial.println(F("[HC-SR04] Reservoir d'eau"));
  Serial.print(F("  Distance : ")); Serial.print(dist, 1); Serial.println(F(" cm"));
  Serial.print(F("  Niveau   : ")); Serial.print(pct);     Serial.println(F(" %"));

  if (pct <= config.niveauEauMin) {
    Serial.println(F("  ! ALERTE : Niveau critique !"));
  }
}
#endif