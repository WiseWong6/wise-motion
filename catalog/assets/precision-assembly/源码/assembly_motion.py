"""The approved scene's ordered depth separation and exact reassembly.
Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0

Reusable with any ordered list of Blender objects and depth travel distances.
Blender's original BEZIER interpolation and automatic handles are retained.
"""

def animate_layers(items, start=241, departure=252, separated=305,
                   hold=357, return_frame=405, end=432, stagger=2):
    for index, (obj, travel) in enumerate(items):
        base_z = obj.location.z
        for frame, delta in [(start, 0), (departure + index * stagger, 0),
                             (separated + index * stagger, travel),
                             (hold + index, travel),
                             (return_frame + index * stagger, 0), (end, 0)]:
            obj.location.z = base_z + delta
            obj.keyframe_insert(data_path='location', frame=frame)
