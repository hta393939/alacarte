
/**
 * @file nodetemplate.js
 * MIT License (c) 2018 Usagi
 */

'use strict';

        const _tree =
    {"name": "Armature", "k": ["exc"], "pts":[], "r": [0,0,0], "sz": [0.0], "c":[
        {"name": "hips", "r": [0, 0.9, 0], "sz": [0.08], "c":[
            { "name": "leftUpperLeg" , "r": [-0.1, -0.11, -0.01], "c": [
                { "name": "leftLowerLeg", "r": [0, -0.4, 0], "c": [
                    { "name": "leftFoot", "r": [0, -0.35, 0], "sz": [0.03], "c": [
                        { "name": "leftToes", "pts":[], "r": [0, -0.05, -0.2], "sz": [0.02], "c":[
                            {"name": "leftToeEnd", "k": ["exc"], "pts":[], "r": [0,0, -0.05], "sz": [0.01]}
                        ]}
                    ]},
                ]},
            ]},
            { "name": "rightUpperLeg", "r": [0.1, -0.11, -0.01], "c": [
                { "name": "rightLowerLeg", "r": [0, -0.4, 0], "c": [
                    { "name": "rightFoot", "r": [0, -0.35, 0], "sz": [0.03], "c": [
                        { "name": "rightToes", "pts":[], "r": [0, -0.05, -0.2], "sz": [0.02], "c": [
                            {"name": "rightToeEnd", "k": ["exc"], "pts":[], "r": [0,0, -0.05], "sz": [0.01]}
                        ]}
                    ]},
                ]},
            ]},
            { "name": "spine", "r": [0, 0.2, -0.01], "sz": [0.08], "c": [
                { "name": "neck", "pts":[], "r": [0, 0.4, 0], "sz": [0.04], "c": [
                    {"name":"head", "pts":[], "r": [0, 0.1, -0.01], "sz": [0.04], "c": [
                        {"name":"leftEye", "pts":[], "r": [-0.04, 0, -0.01], "sz": [0.01], "c": [
                            {"name":"leftEyeEnd", "pts":[], "k":["exc"], "r": [0,0, -0.1], "sz": [0.02]}
                        ]},
                        {"name":"rightEye", "pts":[], "r": [0.04, 0, -0.01], "sz": [0.01], "c": [
                            {"name":"rightEyeEnd", "k": ["exc"], "pts": [], "r": [0,0, -0.1], "sz": [0.02]}
                        ]},
                        {"name":"antenna0", "k": ["exc"], "pts":[], "r": [-0.04, 0.04, 0.05], "sz":[0.02], "c":[
                            {"name":"antenna1", "k": ["exc"], "pts":[], "r": [0, 0.04, 0.05], "sz": [0.01], "c":[
                                {"name":"antenna2", "k": ["exc"], "pts": [], "r":[0, 0.04, 0.05], "sz": [0.01]}
                            ]}
                        ]}
                    ]} // 頭
                ]},

                {"name": "chest", "r": [0, 0.3, 0], "sz": [0.08], "c": [
                    {"name": "leftShoulder", "pts":[], "r": [-0.1, 0, -0.01], "sz": [0.04], "c":[
                        { "name": "leftUpperArm", "r": [-0.1, 0, 0], "sz": [0.04], "c": [
                            { "name": "leftLowerArm", "r": [-0.3, 0, 0], "sz": [0.04], "c": [
                                { "name": "leftHand", "r": [-0.2, 0, 0], "sz": [0.025], "c": [
                                    { "name": "leftThumbProximal", "pts":[], "r": [-0.05, 0, -0.02], "ci": [2,0,0], "sz": [0.015], "c": [
                                        {"name": "leftThumbIntermediate", "pts":[], "r": [-0.03, 0, -0.02], "ci": [3,0,0], "sz": [0.012], "c": [
                                            { "name": "leftThumbDistal", "pts":[], "r": [-0.03, 0, -0.02], "ci": [4,0,0], "sz": [0.009], "c": [
                                                { "name": "leftThumbEnd", "k":["exc"], "pts":[], "r": [-0.02, 0, -0.01], "ci": [5,0,0], "sz": [0.008] }
                                            ] }
                                        ]}
                                    ]},
                                    { "name": "leftIndexProximal", "pts":[], "r": [-0.095, 0, -0.025], "ci": [0,2,0], "sz": [0.008], "c": [
                                        {"name": "leftIndexIntermediate", "pts":[], "r": [-0.06, 0,0], "ci": [0,3,0], "sz": [0.008], "c":[
                                            { "name": "leftIndexDistal", "pts":[], "r": [-0.03, 0,0], "ci": [0,4,0], "sz": [0.007], "c":[
                                                {"name": "leftIndexEnd", "k":["exc"], "pts":[], "r": [-0.02,0,0], "ci": [0,5,0], "sz": [0.005]}
                                            ]},
                                        ]},
                                    ]},
                                    { "name": "leftMiddleProximal", "pts":[], "r": [-0.1, 0, -0], "ci": [0,0,2], "sz": [0.008], "c": [
                                        { "name": "leftMiddleIntermediate", "pts":[], "r": [-0.06, 0,0], "ci": [0,0,3], "sz": [0.008], "c":[
                                            { "name": "leftMiddleDistal", "pts":[], "r": [-0.03, 0,0], "ci": [0,0,4], "sz": [0.007], "c":[
                                                {"name":"leftMiddleEnd", "k":["exc"], "pts":[], "r":[-0.02,0,0], "ci": [0,0,5], "sz": [0.005]}
                                            ]}
                                        ]}
                                    ]},
                                    { "name": "leftRingProximal", "pts":[], "r": [-0.09, 0, 0.02], "ci": [2,1,0], "sz": [0.008], "c": [
                                        {"name": "leftRingIntermediate", "pts":[], "r": [-0.06, 0,0], "ci": [3,2,0], "sz": [0.008], "c":[
                                            { "name": "leftRingDistal", "pts":[], "r": [-0.03, 0,0], "ci": [4,2,0], "sz": [0.007], "c": [
                                                {"name":"leftRingEnd", "k":["exc"], "pts":[], "r":[-0.02,0,0], "ci": [5,3,0], "sz": [0.005]}
                                            ]}
                                        ]},
                                    ]},
                                    { "name": "leftLittleProximal", "pts":[], "r": [-0.08, 0, 0.04], "ci": [2,2,0], "sz": [0.008], "c": [
                                        {"name": "leftLittleIntermediate", "pts":[], "r": [-0.04, 0,0], "ci": [3,3,0], "sz": [0.008], "c":[
                                            { "name": "leftLittleDistal", "pts":[], "r": [-0.02, 0,0], "ci": [4,4,0], "sz": [0.007], "c": [
                                                {"name":"leftLittleEnd", "k":["exc"], "pts":[], "r":[-0.015,0,0], "ci":[5,5,0], "sz": [0.004]}
                                            ]}
                                        ]},
                                    ]}

                                ]}
                            ]}
                        ]}
                    ]},
                    {"name": "rightShoulder", "pts":[], "r": [0.1, 0, -0.01], "sz": [0.04], "c":[
                        { "name": "rightUpperArm", "r": [0.1, 0, 0], "sz": [0.04], "c": [
                            { "name": "rightLowerArm", "r": [0.3, 0,0], "sz": [0.04], "c": [
                                { "name": "rightHand", "r": [0.2, 0,0], "sz": [0.025], "c": [
                                    { "name": "rightThumbProximal", "pts":[], "r": [0.05, 0, -0.02], "ci": [3,0,0], "sz": [0.015], "c": [
                                        {"name": "rightThumbIntermediate", "pts":[], "r": [0.03, 0, -0.02], "ci": [4,0,0], "sz": [0.012], "c":[
                                            { "name": "rightThumbDistal", "pts":[], "r": [0.03, 0, -0.02], "ci": [5,0,0], "sz": [0.009], "c":[
                                                {"name": "rightThumbEnd", "k":["exc"], "pts":[], "r": [0.02, 0, -0.01], "ci": [5,0,0], "sz": [0.008]}
                                            ] }
                                        ]}
                                    ]},
                                    { "name": "rightIndexProximal", "pts":[], "r": [0.095, 0, -0.025], "ci": [0,3,0], "sz": [0.008], "c": [
                                        {"name": "rightIndexIntermediate", "pts":[], "r": [0.06, 0,0], "ci": [0,4,0], "sz": [0.008], "c":[
                                            { "name": "rightIndexDistal", "pts":[], "r": [0.03, 0,0], "ci": [0,5,0], "sz": [0.007], "c":[
                                                {"name": "rightIndexEnd", "k":["exc"], "pts":[], "r": [0.02, 0,0], "ci": [0,5,0], "sz": [0.005]}
                                            ] }
                                        ]}
                                    ]},
                                    { "name": "rightMiddleProximal", "pts":[], "r": [0.1, 0, -0], "ci": [0,0,3], "sz": [0.008], "c": [
                                        {"name": "rightMiddleIntermediate", "pts":[], "r": [0.06, 0,0], "ci": [0,0,4], "sz": [0.008], "c":[
                                            { "name": "rightMiddleDistal", "pts":[], "r": [0.03, 0,0], "ci": [0,0,5], "sz": [0.007], "c":[
                                                {"name":"rightMiddleEnd", "k":["exc"], "pts":[], "r": [0.020, 0,0], "ci":[0,0,5], "sz": [0.005]}
                                            ] }
                                        ]}
                                    ]},
                                    { "name": "rightRingProximal", "pts":[], "r": [0.09, 0, 0.02], "ci": [3,2,0], "sz": [0.008], "c": [
                                        {"name": "rightRingIntermediate", "pts":[], "r": [0.06, 0,0], "ci": [4,2,0], "sz": [0.008], "c":[
                                            { "name": "rightRingDistal", "pts":[], "r": [0.03, 0,0], "ci": [5,3,0], "sz": [0.007], "c":[
                                                {"name": "rightRingEnd", "k":["exc"], "pts":[], "r": [0.020, 0,0], "ci": [5,3,0], "sz":[0.005]}
                                            ] }
                                        ]}
                                    ]},
                                    { "name": "rightLittleProximal", "pts":[], "r": [0.08, 0, 0.04], "ci": [3,3,0], "sz": [0.008], "c": [
                                        {"name": "rightLittleIntermediate", "pts":[], "r": [0.04, 0,0], "ci": [4,4,0], "sz": [0.008], "c":[
                                            { "name": "rightLittleDistal", "pts":[], "r": [0.02, 0,0], "ci": [5,5,0], "sz": [0.007], "c":[
                                                {"name": "rightLittleEnd", "k":["exc"], "pts":[], "r": [0.015, 0,0], "ci":[5,5,0], "sz": [0.004]}
                                            ]}
                                        ]}
                                    ]}

                                ]} // 右手               
                            ]}
                        ]}
                    ]} // 右肩

                ]} // chest
            ]} // spine

        ]} // hips
    ]};
