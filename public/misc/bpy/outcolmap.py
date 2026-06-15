import bpy
import math
import json
import struct
import re
from mathutils import Quaternion, Vector
import numpy as np

camera_obj_name = 'whole'

def parsergb(file_name):
    ret = {}
    ret['samples'] = []
    img = bpy.data.images.load(file_name, check_existing=True)
    w, h = img.size
    ret['width'] = w
    ret['height'] = h
    print(w, h)
    
    pixels_255 = (np.array(img.pixels) * 255).astype(np.uint8)
    pixels_255 = pixels_255.reshape(h, w, -1)


    
    div = 32
    x_size = math.ceil(w / div)
    y_size = math.ceil(h / div)

    for i in range(div):
        y = int((i * 2 + 1) * y_size / 2)
        # NOTE: turn up down try 2026-06-10 1 OK!!
        y = h - 1 - y
        
        for j in range(div):
            x = int((j * 2 + 1) * x_size / 2)

            val = pixels_255[y, x, :3]
            #print("中央のRGB(0-255):", color)

            ret['samples'].append(val)

    return ret

def parsefix(file_name, w, h):
    # binary parsing
    ret = {}
    ret['offsets'] = ()
    ret['samples'] = []
    ret['pos2d'] = []
    with open(file_name, 'rb') as f:
        magics = struct.unpack('<II', f.read(8))
        while True:
            # Not implemented
            prop_name = ''
            if prop_name == '':
                break
            type_name = ''
            data_byte = struct.unpack('<I', f.read(4))
            f.seek(data_byte, 1)
        div = 32
        x_size = math.ceil(w / div)
        y_size = math.ceil(h / div)
        fix_offset = 0x1db
        f.seek(fix_offset, 0)
        # capital is unsigned
        offsets = struct.unpack(f'<{h}Q', f.read(h * 8))
        ret['offsets'] = offsets
        print(f'len, {len(offsets)}')
        
        for i in range(div):
            y = int((i * 2 + 1) * y_size / 2)
            f.seek(ret['offsets'][y], 0)
            # y coordinate, byte
            y_byte = struct.unpack('<II', f.read(8))
            x_line = struct.unpack(f'<{w}f', f.read(w * 4))
            for j in range(div):
                x = int((j * 2 + 1) * x_size / 2)
                val = x_line[x]
                ret['samples'].append(val)
                ret['pos2d'].append((x, y))
    return ret


def main():
    print('main start')
    
    scene = bpy.context.scene
    render = scene.render
    cam = scene.camera

    width = render.resolution_x
    height = render.resolution_y

    cam_obj = bpy.data.objects.get(camera_obj_name)
    if cam_obj is None:
        print(f'not found {camera_obj_name}')
        return
    if cam_obj.type != 'CAMERA':
        print('type not CAMERA')
        return

    images = []
    pts = []

    dir = 'C:/path/to'

    if True: # output
        name = f'{dir}/cameras.bin'
        with open(name, 'wb') as f:
            f.write(struct.pack('<Q', 1))
            for i in range(1):
                #angle_y = cam_obj.data.angle_y
                angle_x = cam_obj.data.angle_x
                print(f'camera data, {angle_x} {cam_obj.data.sensor_fit}')
                #angle_x_deg = 39.6
                #focal = width * 0.5 / math.tan(angle_x_deg * math.pi / 180.0 * 0.5)
                
                focal = width * 0.5 / math.tan(angle_x * 0.5)
                f.write(struct.pack('<i', 1)) # id
                f.write(struct.pack('<i', 1)) # PINHOLE
                f.write(struct.pack('<QQ', width, height))
                f.write(struct.pack(f'<{4}d', *[focal, focal, width * 0.5, height * 0.5]))


    frame_num = scene.frame_end - scene.frame_start + 1
    for i in range(frame_num):
        no = i + scene.frame_start
        bpy.context.scene.frame_set(no)

        #cam_obj = bpy.data.objects.get(camera_obj_name)
        loc, rot, scale = cam_obj.matrix_world.decompose()

        
        if False: # keep blender coordinate
        #if True:

            turnq = Quaternion((0, 1,0,0))
            fwq = turnq @ rot

            qvec = fwq.conjugated()
            qvec.normalize()
            #R = qvec.to_matrix()
            #tvec = -R @ loc
            tvec = qvec @ Quaternion((0, -loc.x, -loc.y, -loc.z)) @ fwq
            tvec = Vector((tvec.x, tvec.y, tvec.z))
            
        else: # Y+ front view

            # NOTE: minus??
            sq2 = math.cos(90.0 * math.pi / 180.0 * 0.5)
            frontzq = Quaternion((sq2, sq2,0,0))
            # 180 turn around x axis
            bltocvq = Quaternion((0, 1,0,0))
            
            fwq = frontzq @ rot @ bltocvq

            # Y+ front view conv
            loc = Vector((loc.x, -loc.z, loc.y))

            qvec = fwq.conjugated()
            qvec.normalize()
            tvec = Vector((-loc.x, -loc.y, -loc.z))
            tvec.rotate(qvec) # fix

        info = {}
        #info['no'] = no
        info['qvec'] = (qvec.w, qvec.x, qvec.y, qvec.z)
        info['tvec'] = (tvec.x, tvec.y, tvec.z)
        images.append(info)



        rgb_name = f'{dir}/col/{no:04}.png'
        base_name = f'comd{no:04}.exr'
        depth_name = f'{dir}/depth/{base_name}'
        print(depth_name)
        if True:
            # float V depth exr
            rgb_result = parsergb(rgb_name)
            iw = rgb_result['width']
            ih = rgb_result['height']
            
            print(f'width, height, {width}x{height} iw, ih, {iw}x{ih}')
            
            depth_result = parsefix(depth_name, iw, ih)

            num = len(rgb_result['samples'])
            #print(rgb_result['samples'], num)          

            for i in range(num):
                pt = {}
                dp = depth_result['samples'][i]
                pos2d = depth_result['pos2d'][i]
                x, y = pos2d
                # pos in cv camera
                pos = Vector(((x - iw * 0.5) / focal * dp, (y - ih * 0.5) / focal * dp, dp))
                pos -= tvec
                pos.rotate(qvec.conjugated())
                
                # additional rotation
                #addq = Quaternion((0, 1, 0, 0)) # w_head
                #pos.rotate(addq)

                
                pt['pos'] = (pos.x, pos.y, pos.z)
                pt['rgb'] = rgb_result['samples'][i]
                pts.append(pt)
            
        else:

            # if multi exr

            img = bpy.data.images.get(base_name)
            #img = bpy.data.images.load(depth_name, check_existing=True)
            if img is None:
                print('cannot get', base_name)
                img = bpy.data.images.load(depth_name)
                print('img', img)
            if img is not None:
                #img.update()
                print(img, img.size[0], img.size[1])
                layer_name = 'RenderLayer'
                pass_name = 'Depth.Z'
                ch_idx = -1
                for i, channel in enumerate(img.channels_info):
                    print(channel)
                    if channel.layer == layer_name and channel.channel_name == pass_name:
                        ch_idx = i
                if i >= 0:
                    pxs = np.array(img.pixels)
                    val = pxs[index + ch_idx]
                
            


    if True: # output
        #print(json.dumps(images))

        filename = f'{dir}/out.json'
        #with open(filename, 'w') as f:
        #    f.write(json.dumps(images))


    if True: # output
        name = f'{dir}/images.bin'
        with open(name, 'wb') as f:
            f.write(struct.pack('<Q', len(images)))
            for i in range(len(images)):
                img = images[i]
                f.write(struct.pack('<i', i + 1)) # 32bit            
                f.write(struct.pack('<4d', *img['qvec']))
                f.write(struct.pack('<3d', *img['tvec']))
                f.write(struct.pack('<i', 1))
            
                name_bytes = f'{(i+1):04}.png'.encode('utf-8') + b'\x00'
                f.write(name_bytes)
            
                # zero points
                f.write(struct.pack('<Q', 0))

    if True: # output
        name = f'{dir}/points3D.bin'
        with open(name, 'wb') as f:
            num = len(pts)
            print(f'points3D, {num}')
            f.write(struct.pack('<Q', num))
            for i in range(num):
                pt = pts[i]
                f.write(struct.pack('<Q', i + 1)) # id
                f.write(struct.pack('<3d', *pt['pos'])) # pos
                f.write(struct.pack('<3B', *pt['rgb'])) # rgb
                f.write(struct.pack('<d', 0.125)) # err
                f.write(struct.pack('<Q', 0)) # track

    print('end')

main()
