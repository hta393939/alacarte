import bpy
import mathutils
import datetime

def mes(label, val):
    print(f'{label}\n{val}')

v1 = mathutils.Vector((1.0, 2.0, 3.0))


curvedata = bpy.data.curves.new("my curve", type='CURVE')    
curvedata.dimensions = '3D'    

num = 10

polyline = curvedata.splines.new('BEZIER')
polyline.bezier_points.add(num - 1)

round_num = 3
for i in range(num):
    v2 = mathutils.noise.random_unit_vector(size=2)
    x, y, z = v2[0] * 0.25, v2[1] * 0.25, i - 1
    r = 1
    if i == 0:
        x, y, z = 0, 0, 0
    if i == 1:
        x, y, z = 0, 0, 0.5
    if i == 2:
        x, y, z = 0, 0, 1
    if i >= num - round_num:
        c = i - (num - round_num)       
        x, y, z = x, y, z
        r = (round_num - 1 - c) / (round_num - 1)
    polyline.bezier_points[i].co = x, y, z
    polyline.bezier_points[i].handle_left_type = 'AUTO'
    polyline.bezier_points[i].handle_right_type = 'AUTO'
    polyline.bezier_points[i].radius = r

"""
polyline.bezier_points[0].co = 0,0,0
polyline.bezier_points[0].handle_left = -1,0,0
polyline.bezier_points[0].handle_right = 1,0,0
"""

d = datetime.datetime.today()
obj = bpy.data.objects.new(f'cv{d}', curvedata) 


# 新しいCollrectionを作成

newCol = bpy.data.collections.new(f'cl{d}')

# 現在のシーンにコレクションをリンク
bpy.context.scene.collection.children.link(newCol)

# コレクションにオブジェクトをリンク
newCol.objects.link(obj)

