struct Settings { 
  int niveauEauMin = 20; 
  int solHumMin = 35;
};

Settings config;

#include "../../main/pompe.h"

bool etatPompe = false;
const int PIN_POMPE = 14;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_POMPE, OUTPUT);
}

void loop() {
  //test 1: réservoir vide 
  Serial.println("Test: Reservoir vide");
  gererPompe(10, 30, etatPompe, config, PIN_POMPE);
  delay(2000);

  //test 2: sol sec (Besoin d'eau)
  Serial.println("Test: Sol sec");
  gererPompe(50, 20, etatPompe, config, PIN_POMPE);
  delay(2000);
}