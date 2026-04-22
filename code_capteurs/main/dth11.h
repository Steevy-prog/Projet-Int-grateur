#ifndef DHT_H
#define DHT_H

#include <dht.h>

void lireDHT11(float temp, float humid, bool ok, DHT& dht, const Settings& config) {
  Serial.println(F("[DHT11] Temperature & Humidite"));
  if (!ok) {
    Serial.println(F("Erreur : Verifier cablage."));
    return;
  }

  float ressenti = dht.computeHeatIndex(temp, humid, false);
  Serial.print(F("Temp : ")); Serial.print(temp, 1); Serial.println(F(" C"));
  Serial.print(F("Humidite : ")); Serial.print(humid, 1); Serial.println(F(" %"));

  Serial.print(F("  T. etat : "));
  if      (temp <= config.tempGel)   Serial.println(F("GEL: proteger d'urgence !"));
  else if (temp <= config.tempFroid) Serial.println(F("FROID: croissance ralentie"));
  else if (temp <= config.tempChaud) Serial.println(F("OPTIMAL"));
  else                               Serial.println(F("CHAUD: stress thermique"));

  Serial.print(F("H. etat : "));
  if      (humid <= config.humidSecheresse) Serial.println(F("Secheresse critique!"));
  else if (humid <= config.humidArrosage)   Serial.println(F("SEC: augmenter arrosage"));
  else if (humid <= config.humidHaut)       Serial.println(F("OPTIMAL"));
  else                                      Serial.println(F("EXCESSIF: ventiler"));
}

#endif