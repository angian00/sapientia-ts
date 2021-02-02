#!/usr/bin/env python3

import sys
from datetime import datetime
from PIL import Image


max_w = 60
max_h = 36


def main():
	if len(sys.argv) < 2:
		print(f"Usage: {sys.argv[0]} filename")
		sys.exit(1)

	scan_image(sys.argv[1])


def scan_image(filename):
	im = Image.open(filename)
	w, h = im.size

	if w > max_w:
		print("Width too big")
		sys.exit(1)

	if h > max_h:
		print("Height too big")
		sys.exit(1)

	color_mapping = {}
	lines = []
	for x in range(w):
		line = ""
		for y in range(h):
			curr_color = im.getpixel((x, y))
			if curr_color in color_mapping:
				tile_code = color_mapping[curr_color]
			else:
				tile_code = str(len(color_mapping))
				color_mapping[curr_color] = tile_code

			if line == "":
				line = tile_code
			else:
				line = line + "|" + tile_code
		
		lines.append(line)

	print("%%map")
	print(f"# automatically generated from [{filename}] on {datetime.now()}")
	print("%metadata")
	print("type:map")
	print(f"name:{filename}")
	print(f"width:{w}")
	print(f"height:{h}")
	print()
	print("%terrain_codes")
	print("# TODO: uncomment and map to valid terrains")
	for c in color_mapping:
		print(f"#{color_mapping[c]}:{color2str(c)}")
	print()
	print("%tile_list")
	for line in lines:
		print(line)
	print()


def color2str(c):
	return f"#{c[0]:02x}{c[1]:02x}{c[2]:02x}"
	
if __name__ == "__main__":
	main()
