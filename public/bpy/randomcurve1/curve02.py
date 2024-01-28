import bpy
import mathutils
import datetime
import math

# 上下2つ

# https://docs.blender.org/manual/ja/dev/interface/controls/templates/curve.html
# 

def mes(label, val):
    print(f'>> {label}\n{val}')

def _near(ang):
    # ang * 2 [radian] の bezier で円弧を近似する場合の補助線の長さ
    if ang == 0:
        return 0
    return (1 - math.cos(ang)) * 4 / 3 / math.sin(ang)


curvedata = bpy.data.curves.new("my curve", type='CURVE')    
curvedata.dimensions = '3D'    

div = 16
root_r = 0.5

pre = [0, 0, 0]
diff = mathutils.Vector((0, 0, 1))
head = mathutils.Vector((0, 0, 1))
head_r = 1
mes('head', head)
num = 10

polyline = curvedata.splines.new('BEZIER')
polyline.bezier_points.add(num - 1)

for i in range(num):

    v2 = mathutils.noise.random_unit_vector(size=2)
    # 根半径1のとき
    x, y, z = v2[0] * 0.25, v2[1] * 0.25, i + 1

    polyline.bezier_points[i].handle_left_type = 'AUTO'
    polyline.bezier_points[i].handle_right_type = 'AUTO'

    r = 1
    match i:
        case 1:
            x, y, z = 0, 0, root_r
            r = 1
            offset = _near(math.pi * 0.5 * 0.5) * root_r
            offset = 0.5
            polyline.bezier_points[i].handle_right_type = 'FREE'
            polyline.bezier_points[i].handle_right = x, y, z + offset
            polyline.bezier_points[i].handle_left_type = 'FREE'
            polyline.bezier_points[i].handle_left = x, y, z - offset    

        case 0:
            x, y, z = 0, 0, 0
            r = 1 + root_r
            polyline.bezier_points[i].handle_right_type = 'FREE'
            polyline.bezier_points[i].handle_right = x, y, z
            polyline.bezier_points[i].handle_left_type = 'FREE'
            polyline.bezier_points[i].handle_left = x, y, z

        case _cap if i == num - 1:
            len = head_r * 2
            x, y, z = pre[0] + head[0] * len, pre[1] + head[1] * len, pre[2] + head[2] * len
            r = 0
            polyline.bezier_points[i].handle_right_type = 'FREE'
            polyline.bezier_points[i].handle_right = x, y, z
            polyline.bezier_points[i].handle_left_type = 'FREE'
            polyline.bezier_points[i].handle_left = x, y, z            

        case _cap if i == num - 2:
            head = diff.normalized()
            len = head_r
            x, y, z = pre[0] + head[0] * len, pre[1] + head[1] * len, pre[2] + head[2] * len
            r = 1

            sup = _near(math.pi * 0.5 * 0.5)
            sup = 0.8
            sup = 0.9
            ft = head[0] * sup, head[1] * sup, head[2] * sup
            polyline.bezier_points[i].handle_right_type = 'FREE'
            polyline.bezier_points[i].handle_right = x + ft[0], y + ft[1], z + ft[2]
            
            polyline.bezier_points[i].handle_left_type = 'FREE'
            polyline.bezier_points[i].handle_left = x - ft[0], y - ft[1], z - ft[2]

        case _:
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

