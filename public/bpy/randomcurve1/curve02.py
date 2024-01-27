import bpy
import mathutils
import datetime
import math

def mes(label, val):
    print(f'>> {label}\n{val}')


curvedata = bpy.data.curves.new("my curve", type='CURVE')    
curvedata.dimensions = '3D'    

div = 16
rootr = 0.5

pre = [0, 0, 0]
diff = mathutils.Vector((0, 0, 1))
head = mathutils.Vector((0, 0, 1))
head_len = 0.25
mes('head', head)
round_num = div / 4
num = 15

polyline = curvedata.splines.new('BEZIER')
polyline.bezier_points.add(num - 1)

for i in range(num):

    v2 = mathutils.noise.random_unit_vector(size=2)
    x, y, z = v2[0] * 0.25, v2[1] * 0.25, i - round_num
    
    polyline.bezier_points[i].handle_left_type = 'AUTO'
    polyline.bezier_points[i].handle_right_type = 'AUTO'
    #polyline.bezier_points[i].handle_right = x, y, z + 0.01
    #polyline.bezier_points[i].handle_left = x, y, z - 0.01
    
    r = 1
    if i <= round_num:
        ang = math.pi * 2 * i / div
        x, y, z = 0, 0, (1 - math.cos(ang)) * rootr * head_len
        r = (1 - math.sin(ang)) * rootr + 1
        '''
        polyline.bezier_points[i].handle_left_type = 'FREE'
        polyline.bezier_points[i].handle_right_type = 'FREE'
        polyline.bezier_points[i].handle_right = x, y, z + 0.01
        polyline.bezier_points[i].handle_left = x, y, z - 0.01
        '''
        if i == 0:
            polyline.bezier_points[i].handle_right_type = 'FREE'
            polyline.bezier_points[i].handle_right = x, y, z
            polyline.bezier_points[i].handle_left_type = 'FREE'
            polyline.bezier_points[i].handle_left = x, y, z

    if i >= num - round_num:
        if i == num - round_num:
            head = diff.normalized()
        c = i - (num - round_num) + 1
        ang = math.pi * 2 * c / div
        len = math.sin(ang) * head_len
        x, y, z = pre[0] + head[0] * len, pre[1] + head[1] * len, pre[2] + head[2] * len
        r = math.cos(ang)
        '''
        polyline.bezier_points[i].handle_left_type = 'FREE'
        polyline.bezier_points[i].handle_right_type = 'FREE'
        polyline.bezier_points[i].handle_right = x, y, z + 0.01
        polyline.bezier_points[i].handle_left = x, y, z - 0.01
        '''
        if i == num - 1:
            polyline.bezier_points[i].handle_right_type = 'FREE'
            polyline.bezier_points[i].handle_right = x, y, z
            
            polyline.bezier_points[i].handle_left_type = 'FREE'
            polyline.bezier_points[i].handle_left = x, y, z            
    else:
        diff = mathutils.Vector((x - pre[0], y - pre[1], z - pre[2])).normalized()
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

