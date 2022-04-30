# import requests, json

# url = 'http://192.168.68.122/api/user/auth/login'
# jsonObj = json.loads('{"email": "tanhoetheng@gmail.com", "password": "12345abcde"}')

# x = requests.post(url, json = jsonObj, headers={'Content-Type': 'Application/json'})

# print(x.text)

from threading import Thread, Lock
from enum import Enum
import socketio
import asyncio
import constant as cf
import RPi.GPIO as GPIO
import time

class Status(Enum):
  EMPTY = 0,
  RESERVED = 1,
  NOT_OCCUPIED = 2,
  OCCUPIED = 3

class Led:
  def __init__(self, red_pin, green_pin):
    GPIO.setup(red_pin, GPIO.OUT)
    GPIO.setup(green_pin, GPIO.OUT)

    self.red = GPIO.PWM(red_pin, 100)
    self.green = GPIO.PWM(green_pin, 100)
    self.red.start(100)
    self.green.start(100)
    pass
  
  def on_red(self):
    self.red.ChangeDutyCycle(100)
    self.green.ChangeDutyCycle(0)
    pass

  def on_green(self):
    self.red.ChangeDutyCycle(0)
    self.green.ChangeDutyCycle(100)
    pass

  def on_yellow(self):
    self.red.ChangeDutyCycle(100)
    self.green.ChangeDutyCycle(50)
    pass

  def on_orange(self):
    self.red.start(100)
    self.green.start(10)
    pass

class Servo:
  def __init__(self, signal_pin):
    GPIO.setup(signal_pin, GPIO.OUT)
    self.signal_pin = signal_pin
    self.pwm = GPIO.PWM(signal_pin, 50)
    self.pwm.start(0)

  def _set_angle(self, angle):
    duty = angle / 18 + 2
    GPIO.output(self.signal_pin, True)
    self.pwm.ChangeDutyCycle(duty)
    time.sleep(1.5)
    GPIO.output(self.signal_pin, False)
    self.pwm.ChangeDutyCycle(0)

  def on(self):
    self._set_angle(90)
    
  def off(self):
    self._set_angle(0)

  def clean_up(self):
    self.pwm.stop()

class Sensor:
  def __init__(self, trigger_pin, echo_pin):
    self.echo_pin = echo_pin
    self.trigger_pin = trigger_pin
    GPIO.setup(echo_pin, GPIO.IN)
    GPIO.setup(trigger_pin, GPIO.OUT)
  
  def get_distance(self):
    GPIO.output(self.trigger_pin, False)
    time.sleep(1)

    GPIO.output(self.trigger_pin, True)
    time.sleep(0.00001)
    GPIO.output(self.trigger_pin, False)

    start_time = stop_time = time.time()

    while GPIO.input(self.echo_pin) == 0:
      start_time = time.time()
    
    stop_time = time.time()
    while GPIO.input(self.echo_pin) == 1:
      stop_time = time.time()

    time_elapsed = stop_time - start_time
    return time_elapsed * 17150

class ParkingBarrier:
  def __init__(self, id, servo, sensor, led):
    self.id = id
    self.servo = servo
    self.sensor = sensor
    self.led = led
    self.mutex = Lock()
    self.status = Status.EMPTY
    self.set_status(Status.EMPTY)
    self.is_on = False
    self.on()

  def on(self):
    with self.mutex:
      dist = self.sensor.get_distance()
      if dist <= 5.0:
        print("An obstacle detected in " + str(dist) + "cm")
        return False

      self.servo.on()
      return True

  def off(self):
    with self.mutex:
      self.servo.off()

  def set_status(self, status):
    is_complete = True
    if status == Status.EMPTY:
      is_complete = self.on()
      if is_complete:
        self.led.on_green()
    elif status == Status.RESERVED:
      is_complete = self.on()
      if is_complete:
        self.led.on_orange()
    elif status == Status.NOT_OCCUPIED:
      self.off()
      self.led.on_yellow()
    elif status == Status.OCCUPIED:
      self.off()
      self.led.on_red()
    
    if is_complete:
      self.status = status

  def check_sensor(self):
    with self.mutex:
      print("Getting distance")
      return self.sensor.get_distance()


GPIO.setmode(GPIO.BCM)

led1 = Led(red_pin=cf.LED_R_PIN_1 , green_pin=cf.LED_G_PIN_1)
led2 = Led(red_pin=cf.LED_R_PIN_2, green_pin=cf.LED_G_PIN_2)    
servo1 = Servo(signal_pin=cf.SERVO_PIN_1)
servo2 = Servo(signal_pin=cf.SERVO_PIN_2)
sensor1 = Sensor(trigger_pin=cf.SENSOR_PIN_TRIG_1, echo_pin=cf.SENSOR_PIN_ECHO_1)
sensor2 = Sensor(trigger_pin=cf.SENSOR_PIN_TRIG_2, echo_pin=cf.SENSOR_PIN_ECHO_2)

#79800 - LEFT
#79802 - RIGHT
parking_spaces = {
  79800: ParkingBarrier(id='79800', servo=servo1, sensor=sensor1, led=led1),
  79802: ParkingBarrier(id='79802', servo=servo2, sensor=sensor2, led=led2)
}

sio = socketio.Client()
socket_connected = False

def connect_to_server():
  sio.connect('http://192.168.68.122:3002')

@sio.event
def reserve(parking_space_id):
  parking_spaces[parking_space_id].on()
  parking_spaces[parking_space_id].set_status(Status.RESERVED)

@sio.event
def unlock(parking_space_id):
  parking_spaces[parking_space_id].off()
  parking_spaces[parking_space_id].set_status(Status.NOT_OCCUPIED)

@sio.event
def clear(parking_space_id):
  parking_spaces[parking_space_id].on()
  parking_spaces[parking_space_id].set_status(Status.EMPTY)

@sio.event
def connect():
  global socket_connected 
  socket_connected = True

def main():
  while not socket_connected:
    time.sleep(1)

  while True:
    for id, ps in parking_spaces.items():
      if ps.status == Status.NOT_OCCUPIED or ps.status == Status.OCCUPIED:
        dist = ps.check_sensor()

        if dist <= 5.0 and ps.status == Status.NOT_OCCUPIED:
          i = 5
          while dist <= 5.0 and i > 0:
            dist = ps.check_sensor()
            print("A vehicle detected in " + str(dist) + "cm for " + str(5 - i) + " sec" )
            i -= 1

          if i <= 0:
            ps.set_status(Status.OCCUPIED)
            sio.emit('park', id)
          
        elif dist > 5.0 and ps.status == Status.OCCUPIED:
          i = 5
          while dist > 5.0 and i > 0:
            dist = ps.check_sensor()
            print("No vehicle detected for " + str(5 - i) + " sec")
            i -= 1
          
          if i <= 0:
            ps.set_status(Status.EMPTY)
            print("Vehicle leaved " + str(dist) + "cm")
            sio.emit('leave', id)


    time.sleep(1)

if __name__ == '__main__':
  try:
    io = Thread(target=connect_to_server)
    io.start()

    hw = Thread(target=main)
    hw.start()

    io.join()
    hw.join()
  except:
      GPIO.cleanup()