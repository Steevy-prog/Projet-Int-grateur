void setup() {
  Serial.begin(9600); 
  for (int i = 2; i <= 13; i++) {
    pinMode(i, OUTPUT);
  }
}

void loop() {
  //test des pins digitaux (vers le LCD ou LEDs)
  for (int i = 2; i <= 13; i++) {
    digitalWrite(i, HIGH);
    delay(100);
    digitalWrite(i, LOW);
  }

  //lecture des entrées analogiques (capteurs LDR, Gaz, Sol)
  for (int a = 0; a <= 5; a++) {
    int val = analogRead(a);
    Serial.print("Analog A"); Serial.print(a);
    Serial.print(" : "); Serial.println(val);
  }
  delay(1000);
}