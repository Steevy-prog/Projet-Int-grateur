struct Settings { 
  float tempMax = 30.0; 
  int gazMax = 1000; 
};
Settings config;

#include "../../main/ventilation.h"

const int PIN_VENTILO = 27;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_VENTILO, OUTPUT);
}

void loop() {
  //test 1: simulation chaleur (35°C > 30°C)
  Serial.println("--- Test Chaleur ---");
  gererVentilation(35.0, 500, config, PIN_VENTILO); 
  delay(3000);

  //test 2: simulation air sain
  Serial.println("--- Test Air sain ---");
  gererVentilation(25.0, 400, config, PIN_VENTILO);
  delay(3000);
}