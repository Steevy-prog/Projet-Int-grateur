#include "../../main/soil.h"

void setup() {
  Serial.begin(115200);
}

void loop() {
  int humidite = lireHumiditeSol(35);
  Serial.print("Humidite du sol: "); Serial.print(humidite); Serial.println("%");
  
  if (humidite < 35) {
    Serial.println("Pompe devrait s'activer (Sol sec)");
  }
  delay(1000);
}