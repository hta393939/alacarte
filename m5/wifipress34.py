# wifipress34.mpy

from m5stack import *
from m5ui import *
from uiflow import *
import sys
import math
import urequests
import unit
import network
import utime
import imu

# https://qiita.com/inachi/items/686658a81ef8096f890f

# Tooney, 

# 1.10.2 も ok
# 1.6.3 で動かしたい 2020/9/19
# time.ticks_ms() が DL だと正常動作しない
# utime にするのが正解

a = ''
b = ''

ver = '2022-08-21 01'

class Misc:
  def __init__(self):
    # 1～10 右上から下へ、左下から上へ
    self.lednwno = 10
    self.counter = 1
    self.offsetx = (320 - 24 * 13) // 2
    self.bx = 6
    self.rc0 = M5Rect(self.offsetx, 24 * 9, 24-2, 24-2, 0x00FF00, 0xffffff)
    self.isqueue = False
    """LED 1ずつ変更"""
    self.isautoled = False
    self.turncounter = 0
    self.queue = list()
    self.accavg = None
    self.accstd = None
    self.acccount = 0
    self.std2 = 0
    self.isacc = False

    self.ledx = 0
    self.ledy = 4

    self.rindex = 0
    self.gindex = 0
    self.bindex = 0
    # LED レベル
    self.lvs = (0, 0x11, 0x22, 0x33, 0xff)
    self.lvs = (0, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff)
    self.lvs = (0, 0x22, 0x33, 0x55, 0x77, 0x99, 0xff)
    pass

  def rgbval(self, r, g, b):
    return (r << 16) | (g << 8) | b
    pass

  def getrgbval(self):
    """このインスタンスが保持しているインデックスで col val を求める"""
    r = self.rindex
    g = self.gindex
    b = self.bindex
    self.lrindex.setText(str(r))
    self.lgindex.setText(str(g))
    self.lbindex.setText(str(b))

    r255 = self.lvs[r]
    g255 = self.lvs[g]
    b255 = self.lvs[b]
    return self.rgbval(r255, g255, b255)

  def updatequeue(self, x, y, z, tick, inlen):
    obj = { 'acc': [x, y, z], 'tick': tick, 'len': inlen }
    self.queue.append(obj)
    num = len(self.queue)
    self.countlabel.setText(str(num))

    if self.accavg == None:
      if num >= 30:
        sum = 0
        sum2 = 0
        for i, val in enumerate(self.queue):
          alen = val['len']
          sum += alen
          sum2 += alen * alen
          pass
        self.accavg = sum / num
        self.accvar = sum2 / num - math.pow(self.accavg, 2)
        self.accstd = math.sqrt(self.accvar)

        self.laccavg.setText(str(self.accavg))
        self.laccstd.setText(str(self.accstd))
        self.lacccount.setText(str(self.acccount))
        self.oneled(1,4, 0xff0000)
      pass
    pass

  def updateled(self):
    """LED随時更新"""
    count = self.turncounter % 512
    lv = count
    if lv >= 256:
      lv = 512 - lv
    self.oneled(0,0, self.rgbval(0, lv, 0))

    count = (self.turncounter + 256) % 512
    lv = count
    if lv >= 256:
      lv = 512 - lv
    self.oneled(0,1, self.rgbval(0, lv, 0))
    pass

  def putacc(self):
    x = self.offsetx
    self.xlabel = M5TextBox(x, 24 * 2, '', lcd.FONT_Default,0xFFFFFF, rotate=0)
    self.ylabel = M5TextBox(x, 24 * 2 + 12, '', lcd.FONT_Default,0xFFFFFF, rotate=0)
    self.zlabel = M5TextBox(x, 24 * 3, '', lcd.FONT_Default,0xFFFFFF, rotate=0)

    self.countlabel = M5TextBox(x + 24 * 4, 24 * 2, 'c1', lcd.FONT_Default,0xFFFFFF, rotate=0)
    self.lstd2 = M5TextBox(x + 24 * 4, 24 * 2 + 12, 'c2', lcd.FONT_Default,0xFFFFFF, rotate=0)
    self.lenlabel = M5TextBox(x + 24 * 4, 24 * 3, 'c3', lcd.FONT_Default,0xFFFFFF, rotate=0)

    self.laccavg = M5TextBox(x + 24 * 8, 24 * 2, 'r1', lcd.FONT_Default,0xFFFFFF, rotate=0)
    self.laccstd = M5TextBox(x + 24 * 8, 24 * 2 + 12, 'r2', lcd.FONT_Default,0xFFFFFF, rotate=0)
    self.lacccount = M5TextBox(x + 24 * 8, 24 * 3, 'r3', lcd.FONT_Default,0xFFFFFF, rotate=0)

  def putlabels(self):
    """ラベル配置する 0-5, 6-12"""
    labels = ('led', 'Y', 'X', 'B', 'G', 'R',
      '  ', 'que', 'accv', '09', '10', '11', '12漢♥')

    ox = self.offsetx - 2

    num = len(labels)
    for i in range(num):
      label = labels[i]
      x = self.offsetx + (1 + i) * 24 - 2
      M5TextBox(x, 24 * 7, label, lcd.FONT_UNICODE,0xFFFFFF, rotate=90)

    self.lledy = M5TextBox(ox + 24 * (1+1), 24 * 6, 'ly', lcd.FONT_UNICODE,0x8080FF, rotate=90)
    self.lledx = M5TextBox(ox + 24 * (2+1), 24 * 6, 'lx', lcd.FONT_UNICODE,0x8080FF, rotate=90)

    self.lbindex = M5TextBox(ox + 24 * 4, 24 * 6, 'bi', lcd.FONT_UNICODE,0x80CCFF, rotate=90)
    self.lgindex = M5TextBox(ox + 24 * 5, 24 * 6, 'gi', lcd.FONT_UNICODE,0x80FF80, rotate=90)
    self.lrindex = M5TextBox(ox + 24 * 6, 24 * 6, 'ri', lcd.FONT_UNICODE,0xFF8080, rotate=90)

  def oneled(self, x, y, col):
    """座標指定っぽく1つの LED を指定する"""
    if x == 0:
      ledno = 10 - y
    else:
      ledno = y + 1
    rgb.setColorFrom(ledno, ledno, col)

  def lednw(self, col):
    rgb.setColorFrom(self.lednwno, self.lednwno, col)

  def ledone(self, col):
    rgb.setColorFrom(self.counter, self.counter, col)
    self.counter += 1
    if self.counter > 10:
      self.counter = 1

  def movecursor(self, dir = 0):
    """方向を指定して移動"""
    self.bx += dir
    if self.bx < 0:
      self.bx = 0
    if self.bx > 12:
      self.bx = 12

    x = self.bx * 24 + self.offsetx
    self.rc0.setPosition(x = x)


misc = Misc()

def tryconnect():
  """ 最初に wi-fi 探しにいく """
  setScreenColor(0x229922)

  lcd.font(lcd.FONT_Default)
  lcd.println('' + ver, 0, 0, 0xccffff, transparent=True)
  lcd.set_fg(0xff0000)
  lcd.println(sys.version)
  lcd.println('Now scanning...')

  wlan = network.WLAN(network.STA_IF)
  wlan.active(True)
  wlan.connect('', '')

  mac = wlan.config('mac')
  s = ''
  for i in range(len(mac)):
    s += '{0:02x}'.format(mac[i])
  # bytes
  lcd.println(s)

  counter = 0
  wait_sec = 5
  while True:
    counter += 1
    if counter > 10:
      wait_sec = 30
      lcd.rect(0, 0, 320, 240, lcd.BLACK, lcd.BLACK)
      lcd.println('', 0,0)
      lcd.println('')
      lcd.font(lcd.FONT_7seg)
      lcd.set_fg(0xffffff)
      lcd.print('' + str(counter))
      lcd.font(lcd.FONT_DejaVu24)
      lcd.println('')
    if counter > 200:
      wait_sec = 60 * 2

    if not wlan.isconnected():
      lcd.set_fg(0xff0000)
      lcd.println('8/21 not conne, ' + str(counter), rotate=0)
      wait(wait_sec)
    else:
      lcd.set_fg(0x00ff00)
      lcd.println('connected, ' + str(counter))
      break

  config = wlan.ifconfig()
  lcd.set_fg(0xffffff)
  for v in config:
    lcd.println(v)

  wait(5)


tryconnect()


setScreenColor(0x222222)
env3 = unit.get(unit.ENV, unit.PORTA)
rgb.setBrightness(10)
# 右
rgb.setColorFrom(3, 3, 0x00ffff)
# 左
#rgb.setColorFrom(8, 8, 0xff8000) # 肌色っぽい
#rgb.setColorFrom(8, 8, 0x008000) # あんまり暗くならない
rgb.setColorFrom(8, 8, 0x003300)

label0 = M5TextBox(0, 0, "label0", lcd.FONT_Default,0xFFFFFF, rotate=0)
label01 = M5TextBox(0, 12, "12", lcd.FONT_Default, 0x0000ff, rotate=0)

# 気温ラベル
telabel = M5TextBox(misc.offsetx, 24, "telabel", lcd.FONT_UNICODE, 0x00FFFF, rotate=0)

reslabel = M5TextBox(misc.offsetx, 24 * 4, "reslabel", lcd.FONT_Default,0xFFFFFF, rotate=0)
ticklabel = M5TextBox(misc.offsetx + 24 * 6, 24 * 1, "ticklabel", lcd.FONT_Default,0xFFFFFF, rotate=0)
misc.movecursor()

lstatus = M5TextBox(misc.offsetx + 150, 24 * 7, "1", lcd.FONT_Comic,0xcccccc, rotate=-10)
seclabel = M5TextBox(misc.offsetx + 24 * 9, 24 * 5, "sec", lcd.FONT_DejaVu40, 0xFFFFFF, rotate=0)

misc.putacc()
misc.putlabels()

#img0 = M5Img(misc.offsetx + 24*10, 24 * 6, "res/icon24.jpg", True)

sec = None
scr = None
pr = None
s = None
status = None
te = None
mo = None
str2 = None

def offscr():
  """ 画面を消す """
  global scr
  scr = 0
  actscr()

def sen1():
  """ センサー文字列を query 作文 """
  global sec, scr, pr, s, status, te, mo, str2
  rgb.setColorFrom(9, 9, 0x00ff00)
  pr = env3.pressure
  te = env3.temperature
  mo = env3.humidity

  telabel.setText(str(te) + ' ℃')

  s = 'pr='
  s = (s + str(pr))
  s = (s + '&te=')
  s = (s + str(te))
  s = (s + '&mo=')
  s = (s + str(mo))
  return s

def get():
  global sec, scr, pr, s, status, te, mo, str2, misc
  rgb.setColorFrom(10, 10, 0xff0000)
  url = ''
  # どっちか
  url += '_dc=' + str(utime.ticks_ms())
  #url += '_a=0'
  # セーフ
  url += '&' + sen1()
  try:
    misc.lednw(0xffff00)
    req = urequests.request(method='GET', url=url, headers={})
    label0.setText('status_code, ' + str(req.status_code))
    reslabel.setText(str(req.text))
    rgb.setColorFrom(6, 7, 0x0000ff)
  except:
    label0.setText('get request failure')
    rgb.setColorFrom(6, 7, 0xff0000)
  # 左は下から上(6-10)
  misc.lednw(0x0000ff)
  return 1

def battery():
  """バッテリー情報"""
  return

  f = power.isChargeFull()
  col = 0xffffff
  if f:
    col = 0x00ff00
  rgb.setColorFrom(1, 1, col)

  c = power.isCharging()
  col = 0xffffff
  if c:
    col = 0xff4000
  rgb.setColorFrom(2, 2, col)

  cent = power.getBatteryLevel()
  col1 = 0x00ff00
  col2 = 0x00ff00
  if cent < 90:
    col1 = 0xffff00
  if cent < 70:
    col1 = 0xff0000
  if cent < 50:
    col1 = 0x000000
  if cent < 50:
    col2 = 0xffff00
  if cent < 20:
    col2 = 0xff0000
  rgb.setColorFrom(4, 4, col1)
  rgb.setColorFrom(5, 5, col2)


def actscr():
  """srcが1なら30にして違うなら0にする"""
  global sec, scr, pr, s, status, te, mo, str2
  try:
    if scr == 1:
      lcd.setBrightness(30)
    else:
      lcd.setBrightness(0)
  except:
    pass



# 普通に左から A, B, C
def buttonA_pressLong():
  global misc
  misc.bx = 0
  misc.movecursor()

  rgb.setColorFrom(6, 10, 0xff00ff)
  pass

def buttonA_wasReleased():
  # sec を 1 減らす
  global misc, sec, scr, pr, s, status, te, mo
  sec = (sec if isinstance(sec, int) else 0) - 1
  seclabel.setText(str(sec))

  misc.movecursor(dir = -1)
  pass
btnA.wasReleased(buttonA_wasReleased)
btnA.pressFor(0.8, buttonA_pressLong)


def buttonB_wasPressed():
  """B ボタン押した瞬間"""
  global misc, scr, status
  num = len(misc.lvs)

  if scr == 0:
    scr = 1
    actscr()
  else:
    if status == 0:
      status = 1
    else:
      status = 0
    lstatus.setText(str(status))

  bx = misc.bx
  if bx == 0:
    if misc.isautoled:
      misc.isautoled = False
    else:
      misc.isautoled = True
    pass
  elif bx == 1:
    misc.ledy = (misc.ledy + 1) % 5
    misc.lledy.setText(str(misc.ledy))
    pass
  elif bx == 2:
    misc.ledx = (misc.ledx + 1) % 2
    misc.lledx.setText(str(misc.ledx))
    pass
  elif bx == 3:
    misc.bindex = (misc.bindex + 1) % num
    col = misc.getrgbval()
    x = misc.ledx
    misc.oneled(x, 3, 0)
    misc.oneled(x, misc.ledy, col)
    pass
  elif bx == 4:
    misc.gindex = (misc.gindex + 1) % num
    col = misc.getrgbval()
    x = misc.ledx
    misc.oneled(x, 3, 0)
    misc.oneled(x, misc.ledy, col)
    pass
  elif bx == 5:
    misc.rindex = (misc.rindex + 1) % num
    col = misc.getrgbval()
    x = misc.ledx
    misc.oneled(x, 3, 0)
    misc.oneled(x, misc.ledy, col)
    pass
  elif bx == 6:
    # nop
    pass
  elif bx == 7:
    if misc.isqueue:
      misc.isqueue = False
    else:
      misc.isqueue = True
    pass
  elif bx == 8:
    if misc.isacc:
      misc.isacc = False
    else:
      misc.isacc = True
    pass
  elif bx == 9:
    pass
  elif bx == 10:
    pass
  elif bx == 11:
    pass
  elif bx == 12:
    pass

  pass
btnB.wasPressed(buttonB_wasPressed)


def buttonC_pressLong():
  global misc
  misc.bx = 12
  misc.movecursor()

  rgb.setColorFrom(1, 5, 0xff0000)
  pass

def buttonC_wasReleased():
  # sec を 1増やす 5 より小さくなったら 5 にする
  global misc, sec
  sec = (sec if isinstance(sec, int) else 0) + 1
  if sec < 5:
    sec = 5
  seclabel.setText(str(sec))

  if btnC.pressFor(0.8):
    rgb.setColorFrom(1, 10, 0x00ffff)
    return

  misc.movecursor(dir = 1)
  pass
btnC.wasReleased(buttonC_wasReleased)
btnC.pressFor(0.8, buttonC_pressLong)


#def buttonA_pressFor():
#  global misc
#  misc.ledone(0xff0000)
# 長押しした後話すと発火する ただし押した瞬間の前述の関数も発動する
#btnA.pressFor(0.8, buttonA_pressFor)

#def buttonC_pressFor():
#  global misc
#  rgb.setColorFrom(1,5, 0x00ff00)
#btnC.pressFor(0.8, buttonC_pressFor)

imu0 = imu.IMU()

sec = 300
status = 1
scr = 1
#premsec = utime.ticks_ms()
premsec = -9999999
wait(1)
while True:
  """ 常時ループ """
  nowmsec = utime.ticks_ms()

  diffmsec = nowmsec - premsec

  misc.turncounter += 1
  if misc.isautoled:
    #pass
    misc.updateled()

  # 加速度
  accx = imu0.acceleration[0]
  accy = imu0.acceleration[1]
  accz = imu0.acceleration[2]
  acclen = math.sqrt(math.pow(accx, 2) + math.pow(accy, 2) + math.pow(accz, 2))

  if misc.isacc:
    misc.xlabel.setText(str(accx))
    misc.ylabel.setText(str(accy))
    misc.zlabel.setText(str(accz))
    misc.lenlabel.setText(str(acclen))

  if misc.isqueue:
    misc.updatequeue(accx, accy, accz, nowmsec, acclen)

  if misc.accavg != None:
    diff = math.fabs(acclen - misc.accavg)
    if diff > misc.accstd * 2.0:
      misc.std2 += 1
      misc.lstd2.setText(str(misc.std2))
    if diff > misc.accstd:
      misc.acccount += 1
      misc.lacccount.setText(str(misc.acccount))


  if diffmsec > sec * 1000:
    premsec = nowmsec

    if status == 1:
      rgb.setColorFrom(3, 3, 0xffff00)
      str2 = get()
      #battery()
    else:
      rgb.setColorFrom(3, 3, 0xff0000)
      pass
    ticklabel.setText('ticks, ' + str(nowmsec))

  wait_ms(1)



