import requests
import monitors
import datetime
import pytz

from requests_oauthlib import OAuth2Session
from oauthlib.oauth2 import BackendApplicationClient

from flask import Blueprint, Response
from cachetools import cached, TTLCache
from datetime import datetime

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

    if response.json() is None:
        return error_response('No Response', 400)
    if location is None:
        return response.json()
    
    items = response.json()
    for item in items:
        if item['name'] is not None:
            name = item['name'].lower()
            if location.lower() in name:
                return item
    return error_response('No Response', 400)


def get_location_details(lid):
    spaces_endpoint = monitors.libapps_api.url + '/space/items/' + str(lid)
    params = {'page_size': '100', 'availability': 'next_only'}
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
                space = get_location_details(item['lid'])
                if space is not None:
                    spaces.append(space)
    return spaces 


def build_space_response(locations):
    response = {}
    current_group = None
    current_subsec = {} 
    current_avail = 0
    current_total = 0
    current_next_avail = None
    overall_avail = 0
    overall_total = 0
    for spaces in locations:
        for space in spaces:
            if 'groupId' in space and current_group != space['groupId']:
                # Consider refactoring. This does not cover last item
                # in array.
                if len(current_subsec) > 0:
                    current_subsec['next_available'] = current_next_avail
                    response[current_group] = current_subsec
                    current_subsec = {}
                    current_avail = 0
                    current_total = 0
                    current_next_avail = None
                current_group = str(space['groupId'])
                current_subsec['name'] = space['groupName']
                # If they come out of order, use existing array
                if current_group in response:
                    current_subsec = response[current_group]
                    current_avail = int(current_subsec['available'])
                    current_total = int(current_subsec['total'])
                    current_next_avail = current_subsec['next_available']
            if 'availability' in space and \
                space['availability'][0] is not None and \
                space['availability'][0]['to'] is not None:
                to_date = space['availability'][0]['to']
                from_date = space['availability'][0]['from']
                current_total = current_total + 1
                overall_total = overall_total + 1
                if check_if_available(from_date, to_date):
                    overall_avail = overall_avail + 1
                    current_avail = current_avail + 1
                current_subsec['available'] = str(current_avail)
                current_subsec['total'] = str(current_total)
                if current_next_avail is None:
                    current_next_avail = from_date
                elif compare_dates(current_next_avail, from_date):
                    current_next_avail = from_date

    # Add last item to array
    if len(current_subsec) > 0:
        current_subsec['next_available'] = current_next_avail
        response[current_group] = current_subsec
        
    response['overall_available'] = overall_avail
    response['total'] = overall_total
    return response


def check_if_available(from_date, to_date):
    to_date = datetime.fromisoformat(to_date) 
    from_date = datetime.fromisoformat(from_date)
    curr_time = datetime.now()
    return from_date < tz.localize(curr_time) < to_date


def compare_dates(date_1, date_2):
    time_1 = datetime.fromisoformat(date_1)
    time_2 = datetime.fromisoformat(date_2)
    return time_1 > time_2


@libapps.route('mckeldin')
def app_mckeldin_spaces():
    spaces = app_spaces('Mckeldin')
    return build_space_response(spaces)


@libapps.route('stem')
def app_stem_spaces():
    spaces = app_spaces('Stem')
    return build_space_response(spaces)


@libapps.route('mspal')
def app_mspal_spaces():
    spaces = app_spaces('Michelle Smith')
    return build_space_response(spaces)


@libapps.route('art')
def app_art_spaces():
    spaces = app_spaces('Art Library')
    return build_space_response(spaces)


def error_response(message='Response error', status=500):
    return Response(message, status)
