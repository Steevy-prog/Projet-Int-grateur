#include "../../main/lcd.h"

void setup() {
  Serial.begin(115200);
  initialiserLCD();
}

void loop() {
  //valeurs de test simulant tous tes capteurs
  float testTemp = 28.5;
  float testHum = 55.0;
  int testSol = 42;
  int testNiveauEau = 85;
  int testLux = 450;
  int testGas = 120;

  //cette fonction gère l'alternance automatiquement
  rafraichirAffichage(testTemp, testHum, testSol, testNiveauEau, testLux, testGas);
  
  delay(100); //une pause pour la stabilité
}