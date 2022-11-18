import requests
import monitors
import json

from flask import Blueprint
from collections import OrderedDict
from bs4 import BeautifulSoup

mapi = Blueprint('mapi', __name__, url_prefix='/api')


@mapi.route('/')
def root():
    return {'status': 'ok'}


@mapi.route('/ping')
def ping():
    return {'status': 'ok'}


@mapi.route('workstations-mckeldin.json')
def workstations_mckeldin():
    # default dict to json serialization sorts the data
    # but we need this unsorted for the frontend
    # (unless we want to refactor the frontend JS)
    locs = monitors.mck_floors
    return json.dumps(build_workstations_response(locs, True), sort_keys=False)


@mapi.route('equipment-mckeldin.json')
def equipment_mckeldin():
    return build_equipment_mckeldin(monitors.mck_laptops,
                                    monitors.mck_headphones,
                                    monitors.mck_chargers, None, None)


@mapi.route('workstations-stem.json')
def workstations_stem():
    locs = monitors.stem_floors
    return json.dumps(build_workstations_response(locs, True), sort_keys=False)


@mapi.route('equipment-stem.json')
def equipment_stem():
    return build_equipment_stem(monitors.stem_laptops,
                                monitors.stem_headphones,
                                monitors.stem_chargers,
                                monitors.stem_calculators,
                                monitors.stem_laptop_chargers)


def build_workstations_response(locations, reverse_sort):
    try:
        response = requests.get(monitors.workstations_api.url)
    except Exception as err:
        monitors.logger.error('Workstations backend api error')

        return {
            'endpoint': 'workstations',
            'error': {
                'msg': 'Backend error',
            },
        }, 500

    if response.status_code != 200:
        monitors.logger.error(f'Workstations backend received {response.status_code}')
        return {
            'endpoint': 'workstations',
            'error': {
                'msg': f'Backend received {response.status_code}',
            },
        }, 500

    json_content = json.loads(response.text)

    results = OrderedDict() 
    for item in json_content:
        values = {}
        key = item['key']
        name = None
        total = 0
        available = 0
        occupied = 0
        if key in locations:
            name = locations[key]
            if 'workstations' in item:
                counts = get_total_workstations(item['workstations'])
                total = counts['total']
                values['pc_total'] = counts['pc_total']
                values['mac_total'] = counts['mac_total']
                avail_counts = get_available_workstations(item['workstations'])
                available = avail_counts['total']
                values['pc_available'] = avail_counts['pc_available']
                values['mac_available'] = avail_counts['mac_available']
                occupied = total - available
                values['occupied'] = occupied
                values['total'] = total
                values['name'] = name
                values['available'] = available
                values['key'] = key
                results[key] = values

    if reverse_sort:
        r_results = OrderedDict()
        reverse_keys = reversed(results)
        for key in reverse_keys:
            r_results[key] = results[key]
        results = r_results

    return results


def get_total_workstations(workstations):
    pc_total = 0
    mac_total = 0
    counts = {}
    if 'total' in workstations['pc']:
        pc_total = int(workstations['pc']['total'])
    if 'total' in workstations['mac']:
        mac_total = int(workstations['mac']['total'])

    counts['mac_total'] = mac_total
    counts['pc_total'] = pc_total
    counts['total'] = pc_total + mac_total
    return counts


def get_available_workstations(workstations):
    pc_avail = 0
    mac_avail = 0
    counts = {}
    if 'available' in workstations['pc']:
        pc_avail = int(workstations['pc']['available'])
    if 'available' in workstations['mac']:
        mac_avail = int(workstations['mac']['available'])

    counts['mac_available'] = mac_avail
    counts['pc_available'] = pc_avail
    counts['total'] = pc_avail + mac_avail
    return counts


def build_equipment_mckeldin(laptops, headphones, chargers, calculators, laptop_chargers):
    result = []
    if chargers is not None:
        chargers_raw = equipment_request(chargers)
        chargers_html = generate_equipment_response(chargers_raw, 'Chargers')
        result.append(chargers_html)
    if headphones is not None:
        headphones_raw = equipment_request(headphones)
        headphones_html = generate_equipment_response(headphones_raw, 'Headphones')
        result.append(headphones_html)
    if laptops is not None:
        laptops_raw = equipment_request(laptops)
        laptops_html = generate_equipment_response(laptops_raw, 'Laptops')
        result.append(laptops_html)
    return result


def build_equipment_stem(laptops, headphones, chargers, calculators, laptop_chargers):
    result = []
    if laptops is not None:
        laptops_raw = equipment_request(laptops)
        laptops_html = generate_equipment_response(laptops_raw, 'Laptops')
        result.append(laptops_html)
    if chargers is not None:
        chargers_raw = equipment_request(chargers)
        chargers_html = generate_equipment_response(chargers_raw, 'Phone Chargers')
        result.append(chargers_html)
    if laptop_chargers is not None:
        laptop_chargers_raw = equipment_request(laptop_chargers)
        laptop_chargers_html = generate_equipment_response(laptop_chargers_raw, 'Laptop Chargers')
        result.append(laptop_chargers_html)
    if headphones is not None:
        headphones_raw = equipment_request(headphones)
        headphones_html = generate_equipment_response(headphones_raw, 'Headphones')
        result.append(headphones_html)
    if calculators is not None:
        calculators_raw = equipment_request(calculators)
        calculators_html = generate_equipment_response(calculators_raw, 'Calculators')
        result.append(calculators_html)
    return result


def equipment_request(bibnums):
    result = None
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    response = requests.post(monitors.equipment_api.url,
                             data=bibnums,
                             headers=headers)
    result = response.text
    return result


def generate_equipment_response(raw_html, label):
    result = {}
    soup = BeautifulSoup(raw_html, 'html.parser')

    available = 0
    total = 0
    for td in soup.find_all('td'):
        td_field = td.get('class')[0]
        td_value = td.text
        # result[td_field] = td_value
        if td_field == 'available':
            available = available + int(td_value)
        if td_field == 'total':
            total = total + int(td_value)

    result['label'] = label
    result['total'] = total
    result['available'] = available

    return result
