#ifndef POMPE_H
#define POMPE_H

#include <Arduino.h>

void gererPompe(int niveauPct, int solHum, bool& etatPompe, const Settings& cfg, int pin) {
  // Sécurité matérielle : réservoir insuffisant
  if (niveauPct <= cfg.niveauEauMin) {
    digitalWrite(pin, LOW);
    if (etatPompe) {
      Serial.println(F("[POMPE] Arret d'urgence : reservoir vide!"));
      etatPompe = false;
    }
    return;
  }

  // Logique d'arrosage basée sur tes seuils
  bool besoinEau = (solHum < cfg.solHumMin); // Utilise le seuil de 35% fixé

  if (besoinEau && !etatPompe) {
    digitalWrite(pin, HIGH);
    etatPompe = true;
    Serial.println(F("[POMPE] ACTIVEE : Sol sec"));
  } 
  else if (!besoinEau && etatPompe) {
    digitalWrite(pin, LOW);
    etatPompe = false;
    Serial.println(F("[POMPE] DESACTIVEE : Humidite suffisante"));
  }
}

#endif
