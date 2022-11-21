import logging
import os

import furl
import requests
from dotenv import load_dotenv
from flask import Flask, request
from paste.translogger import TransLogger
from waitress import serve

from monitors.blueprints.api.mapi import mapi
from monitors.blueprints.frontend.displays import displays

load_dotenv('../.env')

env = {}
for key in ('WORKSTATIONS_API_BASE', 'EQUIPMENT_API_BASE',
            'EQUIPMENT_STEM_LAPTOPS', 'EQUIPMENT_STEM_LAPTOP_CHARGERS',
            'EQUIPMENT_STEM_CHARGERS', 'EQUIPMENT_STEM_CALCULATORS',
            'EQUIPMENT_STEM_HEADPHONES', 'EQUIPMENT_MCK_HEADPHONES',
            'EQUIPMENT_MCK_LAPTOPS', 'EQUIPMENT_MCK_CHARGERS',
            'WORKSTATIONS_STEM', 'WORKSTATIONS_MCK',
            'EQUIPMENT_STEM', 'EQUIPMENT_MCK'):
    env[key] = os.environ.get(key)
    if env[key] is None:
        raise RuntimeError(f'Missing environment variable: {key}')

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False

workstations_api = furl.furl(env['WORKSTATIONS_API_BASE'])
equipment_api = furl.furl(env['EQUIPMENT_API_BASE'])
debug = os.environ.get('FLASK_DEBUG')

logger = logging.getLogger('library-monitors')

if debug:
    logger.setLevel(logging.DEBUG)
else:
    logger.setLevel(logging.INFO)


def prepare_equip(data):
    arr = data.split(",")
    post_data = []
    i = 0
    for bibnum in arr:
        bib_raw = bibnum.split("|")
        if len(bib_raw) >= 2:
            post_data.append("bib=" + bib_raw[0] + "|" + bib_raw[1])
        else:
            post_data.append("bib=" + bibnum + "|Equipment" + str(i))
            i = i + 1

    return "&".join(post_data)


def prepare_floors(data):
    floors = {}
    arr = data.split(",")
    for floor in arr:
        floor_raw = floor.split("|")
        if len(floor_raw) >= 2:
            floors[floor_raw[0]] = floor_raw[1]
        else:
            floors[floor_raw[0]] = floor_raw[0]
    return floors


stem_chargers = prepare_equip(env['EQUIPMENT_STEM_CHARGERS'])
stem_laptop_chargers = prepare_equip(env['EQUIPMENT_STEM_LAPTOP_CHARGERS'])
stem_laptops = prepare_equip(env['EQUIPMENT_STEM_LAPTOPS'])
stem_calculators = prepare_equip(env['EQUIPMENT_STEM_CALCULATORS'])
stem_headphones = prepare_equip(env['EQUIPMENT_STEM_HEADPHONES'])
mck_chargers = prepare_equip(env['EQUIPMENT_MCK_CHARGERS'])
mck_laptops = prepare_equip(env['EQUIPMENT_MCK_LAPTOPS'])
mck_headphones = prepare_equip(env['EQUIPMENT_MCK_HEADPHONES'])
mck_floors = prepare_floors(env['WORKSTATIONS_MCK'])
stem_floors = prepare_floors(env['WORKSTATIONS_STEM'])
stem_equipment = prepare_equip(env['EQUIPMENT_STEM'])

app.register_blueprint(displays)
app.register_blueprint(mapi)
