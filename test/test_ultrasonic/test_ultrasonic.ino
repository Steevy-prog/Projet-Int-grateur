struct Settings {
  float reservoirHauteur = 20.0; 
  float reservoirOffset = 2.0;
  int niveauEauMin = 20;
};
Settings config;

#include "../../main/ultrasonic.h"

void setup() {
  Serial.begin(115200);
  pinMode(12, OUTPUT);
  pinMode(13, INPUT); 
}

void loop() {
  float d = mesurerDistance(12, 13, config.reservoirHauteur, config.reservoirOffset);
  int n = calculerNiveauPct(d, config.reservoirHauteur, config.reservoirOffset);
  
  Serial.print("Distance: "); Serial.print(d); Serial.print(" cm | ");
  Serial.print("Niveau: "); Serial.print(n); Serial.println("%");
  
  if (n < config.niveauEauMin) Serial.println("!!! ALERTE NIVEAU BAS !!!");
  
  delay(2000);
}