#ifndef ULTRASONIC_H
#define ULTRASONIC_H

#include <Arduino.h>

float mesurerDistance(int pinTrig, int pinEcho, float haut, float offset) {
  digitalWrite(pinTrig, LOW);
  delayMicroseconds(4);
  digitalWrite(pinTrig, HIGH);
  delayMicroseconds(10);
  digitalWrite(pinTrig, LOW);

  long duree = pulseIn(pinEcho, HIGH, 30000UL);

  if (duree == 0) {
    return haut + offset;
  }
  return (duree * 0.0343f) / 2.0f;
}

int calculerNiveauPct(float distCm, float haut, float offset) {
  float eau = (haut + offset) - distCm;
  eau = constrain(eau, 0.0f, haut);
  return (int)((eau / haut) * 100.0f);
}

void lireReservoir(float dist, int pct, const Settings& config) {
  Serial.println(F("[HC-SR04] Reservoir d'eau"));
  Serial.print(F("Distance : ")); Serial.print(dist, 1); Serial.println(F(" cm"));
  Serial.print(F("Niveau : ")); Serial.print(pct);     Serial.println(F(" %"));

  Serial.print(F("Barre : ["));
  int b = pct / 5;
  for (int i = 0; i < 20; i++) Serial.print(i < b ? '#' : '.');
  Serial.print(F("] ")); Serial.print(pct); Serial.println(F(" %"));

  Serial.print(F("Etat : "));
  if      (pct <= config.niveauCritique) Serial.println(F("CRITIQUE: remplir d'urgence !"));
  else if (pct <= config.niveauBas)      Serial.println(F("BAS: remplissage a prevoir"));
  else if (pct <= config.niveauOk)       Serial.println(F("MOYEN: surveiller"));
  else                                  Serial.println(F("PLEIN: systeme operationnel"));
}

#endif