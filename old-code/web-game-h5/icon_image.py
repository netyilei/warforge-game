#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import argparse
import json
import Image
import plistlib


def process_file(input_file_path,w,h,out_path = None,rot = 0):
	"Scale input image to target size"
	fullpath = os.path.realpath(input_file_path)
	print("icon] scale file to {0}x{1} file = {2}".format(w,h,fullpath))

	filename = None 
	if out_path == None:
		pathes = os.path.split(fullpath)
		filename = pathes[1]
		filename = os.path.splitext(filename)[0]
		filename = "{0}-{1}x{2}.png".format(filename,w,h)
		out_path = os.path.join(pathes[0],filename)
	else:
		pathes = os.path.split(out_path)
		out_dir = pathes[0]
		if os.path.isdir(out_dir) == False:
			os.makedirs(out_dir)

	img = Image.open(fullpath)
	iw,ih = img.size

	if rot != 0:
		img = img.rotate(rot)
	out = img.resize((w,h), Image.ANTIALIAS)
	#os.remove(fullpath)
	out.save(out_path)