import bpy
import mathutils
import datetime
import math

def mes(label, val):
    print(f'{label}\n{val}')

v1 = mathutils.Vector((1.0, 2.0, 3.0))


curvedata = bpy.data.curves.new("my curve", type='CURVE')    
curvedata.dimensions = '3D'    

num = 10

polyline = curvedata.splines.new('BEZIER')
polyline.bezier_points.add(num - 1)

div = 16

pre = [0, 0, 0]
head = mathutils.noise.random_unit_vector()
if head[2] < 0:
    head[2] *= -1
mes('head', head)
round_num = 3
for i in range(num):
    polyline.bezier_points[i].handle_left_type = 'AUTO'
    polyline.bezier_points[i].handle_right_type = 'AUTO'
    v2 = mathutils.noise.random_unit_vector(size=2)
    x, y, z = v2[0] * 0.25, v2[1] * 0.25, i - (div / 4)
    r = 1
    if i <= div / 4:
        rootr = 0.5
        ang = math.pi * 2 * i / div
        x, y, z = 0, 0, math.sin(ang) * rootr
        r = math.cos(ang) * rootr + 1
        polyline.bezier_points[i].handle_left_type = 'FREE'
        polyline.bezier_points[i].handle_right_type = 'FREE'
        polyline.bezier_points[i].handle_left = 0, 0, z + 0.1
        polyline.bezier_points[i].handle_right = 0, 0, z - 0.1
    if i >= num - round_num:
        c = i - (num - round_num)
        ang = math.pi * 2 * c / div
        len = math.sin(ang)
        x, y, z = pre[0] + head[0] * len, pre[1] + head[1] * len, pre[2] + head[2] * len
        r = math.cos(ang)
    else:
        pre = [x, y, z]
    polyline.bezier_points[i].co = x, y, z

    polyline.bezier_points[i].radius = r


d = datetime.datetime.today()
obj = bpy.data.objects.new(f'cv{d}', curvedata) 


# 新しいCollrectionを作成

newCol = bpy.data.collections.new(f'cl{d}')

# 現在のシーンにコレクションをリンク
bpy.context.scene.collection.children.link(newCol)

# コレクションにオブジェクトをリンク
newCol.objects.link(obj)

