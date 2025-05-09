// Sensor A Pins
#define trigPinA 10
#define echoPinA 9

// Sensor B Pins
#define trigPinB 6
#define echoPinB 5

void setup() {
  Serial.begin(9600);

  // Sensor A
  pinMode(trigPinA, OUTPUT);
  pinMode(echoPinA, INPUT);

  // Sensor B
  pinMode(trigPinB, OUTPUT);
  pinMode(echoPinB, INPUT);
}

void loop() {
  int levelA = readLevel(trigPinA, echoPinA);
  int levelB = readLevel(trigPinB, echoPinB);

  // Average the two readings
  int averageLevel = (levelA + levelB) / 2;

  Serial.print("AccurateLevel:");
  Serial.println(averageLevel);

  delay(1000); // 1 seconds delay
}

// Function to calculate distance and map to level
int readLevel(int trigPin, int echoPin) {
  long duration, distance;

  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  duration = pulseIn(echoPin, HIGH);
  distance = duration * 0.034 / 2; // Convert to cm

  int level = map(distance, 0, 17, 100, 0); // Full = 0cm, Empty = 50cm
  return constrain(level, 0, 100);
}
