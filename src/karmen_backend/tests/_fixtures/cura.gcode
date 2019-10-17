;FLAVOR:Marlin
;TIME:160
;Filament used: 0.203432m
;Layer height: 0.2
;MINX:79.205
;MINY:83.508
;MINZ:0.3
;MAXX:120.793
;MAXY:116.48
;MAXZ:1.5
;Generated with Cura_SteamEngine 4.3.0
M140 S60
M105
M190 S60
M104 S200
M105
M109 S200
M82 ;absolute extrusion mode
G21 ;metric values

G1 X87.175 Y86.572 E0.21548
G1 X87.856 Y86.222 E0.25368
G1 X88.501 Y85.93 E0.28901
G1 X89.169 Y85.664 E0.32488
G1 X89.837 Y85.433 E0.36014
G1 X90.539 Y85.227 E0.39664
G1 X91.224 Y85.06 E0.43182
G1 X91.948 Y84.919 E0.46861

G1 X109.13 Y106.302
;TIME_ELAPSED:160.596768
G1 F1500 E196.9317
M140 S0
M107
M104 S0 ;extruder heater off
M140 S0 ;heated bed heater off (if you have it)
G91 ;relative positioning
G1 E-1 F300  ;retract the filament a bit before lifting the nozzle, to release some of the pressure
G1 Z+0.5 E-5 X-20 Y-20 F9000 ;move Z up a bit and retract filament even more
G28 X0 Y0 ;move X/Y to min endstops, so the head is out of the way
M84 ;steppers off
G90 ;absolute positioning
M82 ;absolute extrusion mode
M104 S0
;End of Gcode