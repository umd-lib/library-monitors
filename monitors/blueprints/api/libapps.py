import requests
import monitors
import time
import datetime
import pytz

from requests_oauthlib import OAuth2Session
from oauthlib.oauth2 import BackendApplicationClient

from flask import Blueprint, request, redirect, session
from flask.json import jsonify
from cachetools import cached, TTLCache
from datetime import datetime, timedelta, timezone

libapps = Blueprint('libapps', __name__, url_prefix='/spaces/api')

tz = pytz.timezone('US/Eastern')

@cached(cache=TTLCache(maxsize=2, ttl=120))
def get_token():
    client = BackendApplicationClient(client_id=monitors.libapps_client)
    oauth = OAuth2Session(client=client)
    oauth_endpoint = monitors.libapps_api.url + '/oauth/token'
    token = oauth.fetch_token(oauth_endpoint,
                                client_id=monitors.libapps_client,
                                client_secret=monitors.libapps_secret)
    monitors.logger.error(token)
    if token['access_token'] is None:
        return None
    return token['access_token']


def authenticate():
    token = get_token()
    if token is None:
        get_token.cache.clear()

    return token

def make_api_request(url, params=None):
    token = authenticate()
    if token is None:
        return None
    headers = {"Authorization": f"Bearer {token}",
               'Accept': 'application/json',
               'Content-Type': 'application/json'}
    response = requests.get(url, headers=headers, params=params)
    return response


def get_locations(location=None):
    locations_endpoint = monitors.libapps_api.url + '/space/locations'
    params = {'details': '0'}
    response = make_api_request(locations_endpoint, params)
    monitors.logger.error(response.json())

    if response.json() is None:
        return error_response('Response is empty')
    if location is None:
        return response.json()
    
    items = response.json()
    for item in items:
        if item['name'] is not None:
            name = item['name'].lower()
            if location.lower() in name:
                return item
    return error_response

def get_location_details(lid):
    spaces_endpoint = monitors.libapps_api.url + '/space/items/' + str(lid)
    # params = {'page_size': '100', 'availability': '2025-02-25'}
    params = {'page_size': '100', 'availability': 'next_only'}
    monitors.logger.error(spaces_endpoint)
    response = make_api_request(spaces_endpoint, params)

    if response.content is None:
        return error_response('Response is empty')
    if 'application/json' in response.headers.get('Content-Type', ''):
        return response.json()
    return None 


# Used in mckeldin.html template
@libapps.route('locations')
def app_locations(location=None):
    return get_locations(location)


@libapps.route('spaces')
def app_spaces(location=None):
    items = get_locations(location)
    spaces = []
    # Check if only one return
    if items['lid'] is not None:
        space = get_location_details(items['lid'])
        if space is not None:
            spaces.append(space)
    else:
        for item in items:
            if item['lid'] is not None:
                monitors.logger.error(item['lid'])
                space = get_location_details(item['lid'])
                if space is not None:
                    spaces.append(space)
    return spaces 


def build_space_response(locations):
    response = {}
    current_group = None
    current_subsec = {} 
    current_avail = 0
    current_next_avail = None
    overall_avail = 0
    for spaces in locations:
        for space in spaces:
            if 'groupId' in space and current_group != space['groupId']:
                if (len(current_subsec) > 0):
                    response[current_group] = current_subsec
                    current_subsec = {}
                current_group = str(space['groupId'])
                current_subsec['name'] = space['groupName']
                # If they come out of order, use existing array
                if current_group in response:
                    current_subsec = response[current_group]
                    current_avail = int(current_subsec['available'])
            if 'availability' in space and \
                space['availability'][0] is not None and \
                space['availability'][0]['to'] is not None:
                to_date = space['availability'][0]['to']
                if check_if_available(to_date):
                    overall_avail = overall_avail + 1
                    current_avail = current_avail + 1
                current_subsec['available'] = str(current_avail)
    response['overall_available'] = overall_avail
    monitors.logger.error(response)
    return response


def check_if_available(to_date):
    # 2025-02-26T06:30:00-05:00
    # to_date = time.strptime(to_date, "%Y-%m-%dT%H:%M:%S%z")
    to_date = datetime.fromisoformat('2025-02-26T06:30:00-05:00') 
    monitors.logger.error(to_date)
    curr_time = datetime.now()
    monitors.logger.error(tz.localize(curr_time))
    return tz.localize(curr_time) < to_date


def compare_dates(date_1, date_2):
    time_1 = time.strptime(date_1, "%Y-%m-%dT%H:%M:%S%z")
    time_2 = time.strptime(date_2, "%Y-%m-%dT%H:%M:%S%z")
    return time_1 < time_2


@libapps.route('mckeldin')
def app_mckeldin_spaces():
    spaces = app_spaces('Mckeldin')
    return build_space_response(spaces)


@libapps.route('stem')
def app_stem_spaces():
    spaces = app_spaces('Stem')
    # return spaces
    resp = build_space_response(spaces)
    return resp 


def error_response(message='Response error'):
    return message
