import logging
import os

import furl
import requests
import yaml
from dotenv import load_dotenv
from flask import Flask, request
from paste.translogger import TransLogger
from waitress import serve

from monitors.blueprints.api.mapi import mapi
from monitors.blueprints.frontend.displays import displays

load_dotenv('../.env')

env = {}
for key in ('WORKSTATIONS_API_BASE', 'EQUIPMENT_API_BASE'):
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

with open('monitors.yaml', 'r') as mfile:
    bibs_floors = yaml.safe_load(mfile)


def prepare_equip(data):
    post_data = []
    i = 0
    for bibnum in data:
        post_data.append("bib=" + bibnum + "|Equipment" + str(i))
        i = i + 1

    return "&".join(post_data)


def prepare_legacy_equip(data):
    post_data = []
    for bibnum_arr in data:
        for bibnum, name in bibnum_arr.items():
            post_data.append("bib=" + str(bibnum) + "|" + name)

    return "&".join(post_data)


def prepare_floors(data):
    floors = {}
    for floor in data:
        for key, name in floor.items():
            floors[key] = name
    return floors


stem_chargers = prepare_equip(bibs_floors['equipment_stem_chargers'])
stem_laptop_chargers = prepare_equip(bibs_floors['equipment_stem_lchargers'])
stem_laptops = prepare_equip(bibs_floors['equipment_stem_laptops'])
stem_calculators = prepare_equip(bibs_floors['equipment_stem_calc'])
stem_headphones = prepare_equip(bibs_floors['equipment_stem_headphones'])
mck_chargers = prepare_equip(bibs_floors['equipment_mck_chargers'])
mck_laptops = prepare_equip(bibs_floors['equipment_mck_laptops'])
mck_headphones = prepare_equip(bibs_floors['equipment_mck_headphones'])
stem_equipment = prepare_legacy_equip(bibs_floors['equipment_stem'])
mck_equipment = prepare_legacy_equip(bibs_floors['equipment_mck'])
mck_floors = prepare_floors(bibs_floors['workstations_mck'])
stem_floors = prepare_floors(bibs_floors['workstations_stem'])
stem_nearby = prepare_floors(bibs_floors['workstations_stem_nearby'])

app.register_blueprint(displays)
app.register_blueprint(mapi)


@app.route('/')
def root():
    return {'status': 'ok'}


@app.route('/ping')
def ping():
    return {'status': 'ok'}


def run_app():
    return app
