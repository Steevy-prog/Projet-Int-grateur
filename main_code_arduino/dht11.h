#ifndef DHT11_H
#define DHT11_H

#include <DHT.h> 

void lireDHT11(float temp, float humid, bool ok, DHT& dht, const Settings& cfg) {
  Serial.println(F("[DHT11] Capteur Ambiant"));
  if (!ok) {
    Serial.println(F("Erreur : capteur non détecté ou débranché."));
    return;
  }

  Serial.print(F("T (°C): ")); Serial.print(temp, 1);
  Serial.print(F(" | H (%): ")); Serial.println(humid, 1);

  //analyse selon les seuils
  if (temp > cfg.tempChaud) {
    Serial.println(F("  Etat : Chaleur excessive décelée."));
  } else if (temp < cfg.tempFroid) {
    Serial.println(F("Etat : Température basse."));
  } else {
    Serial.println(F("Etat : Température idéale."));
  }
}

#endif