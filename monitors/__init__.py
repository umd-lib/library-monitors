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
from monitors.blueprints.api.libapps import libapps
from monitors.blueprints.frontend.displays import displays

load_dotenv('../.env')

env = {}
for key in ('WORKSTATIONS_API_BASE',
            'LIBAPPS_BASE',
            'LIBAPPS_CLIENT',
            'LIBAPPS_SECRET'):
    env[key] = os.environ.get(key)
    if env[key] is None:
        raise RuntimeError(f'Missing environment variable: {key}')

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False

workstations_api = furl.furl(env['WORKSTATIONS_API_BASE'])

libapps_api = furl.furl(env['LIBAPPS_BASE'])
libapps_client = env['LIBAPPS_CLIENT']
libapps_secret = env['LIBAPPS_SECRET']

debug = os.environ.get('FLASK_DEBUG')

logger = logging.getLogger('library-monitors')

if debug:
    logger.setLevel(logging.DEBUG)
else:
    logger.setLevel(logging.INFO)

with open('monitors.yaml', 'r') as mfile:
    bibs_floors = yaml.safe_load(mfile)


def prepare_floors(data):
    floors = {}
    for floor in data:
        for key, name in floor.items():
            floors[key] = name
    return floors


mck_floors = prepare_floors(bibs_floors['workstations_mck'])
stem_floors = prepare_floors(bibs_floors['workstations_stem'])

app.register_blueprint(displays)
app.register_blueprint(mapi)
app.register_blueprint(libapps)


@app.route('/')
def root():
    return {'status': 'ok'}


@app.route('/ping')
def ping():
    return {'status': 'ok'}


def run_app():
    return app
