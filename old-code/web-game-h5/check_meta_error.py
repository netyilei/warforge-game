from distutils.command.sdist import sdist

# encoding: utf-8 

import os
import sys
import json

def main():
    current_directory = os.getcwd()
    parent_directory = os.path.dirname(current_directory)
    for root, dirs, files in os.walk(parent_directory):
        for file in files:
            if not (".meta" in file):
                continue
            try:
                f = open(root + "/" + file)
            except:
                ech = "open file error,dir is :" + root + "\\" + file
            try:
                dic = json.load(f)
            except:
                ech = "json file err ,dir is :" + root + "/" + file
                os.remove(root + "/" + file)
                print(ech.decode('UTF-8'))
if __name__ == "__main__":
    main()