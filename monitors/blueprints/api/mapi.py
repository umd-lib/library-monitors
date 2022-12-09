import requests
import monitors
import json

from flask import Blueprint
from collections import OrderedDict
from bs4 import BeautifulSoup
from datetime import date

mapi = Blueprint('mapi', __name__, url_prefix='/api')


# Used in mckeldin.html template
@mapi.route('workstations-mckeldin.json')
def workstations_mckeldin():
    locs = monitors.mck_floors
    # default dict to json serialization sorts the data
    # but we need this unsorted for the frontend
    return json.dumps(build_workstations_response(locs, True), sort_keys=False)


# Used in mckeldin.html template
@mapi.route('equipment-mckeldin.json')
def equipment_mckeldin():
    return build_equipment_mckeldin(monitors.mck_laptops,
                                    monitors.mck_headphones,
                                    monitors.mck_chargers, None, None)


# Used in stem.html template
@mapi.route('workstations-stem.json')
def workstations_stem():
    locs = monitors.stem_floors
    # default dict to json serialization sorts the data
    # but we need this unsorted for the frontend
    return json.dumps(build_workstations_response(locs, True), sort_keys=False)


# Used in stem.html template
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
        monitors.logger.error(f'Workstations backend received \
                              {response.status_code}')
        return {
            'endpoint': 'workstations',
            'error': {
                'msg': f'Backend received {response.status_code}',
            },
        }, 500

    json_content = json.loads(response.text)

    # native dict doesn't seem to handle sorting well
    results = OrderedDict()
    html_class = "bg-grey"
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
                values['class'] = html_class
                if html_class == 'bg-white':
                    html_class = 'bg-grey'
                else:
                    html_class = 'bg-white'
                results[key] = values

    # The UI needs these in reverse order
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


def build_equipment_mckeldin(laptops, headphones, chargers, calculators,
                             laptop_chargers):
    result = []
    if chargers is not None:
        chargers_raw = equipment_request(chargers)
        chargers_html = generate_equipment_response(chargers_raw, 'Chargers')
        result.append(chargers_html)
    if headphones is not None:
        headphones_raw = equipment_request(headphones)
        headphones_html = generate_equipment_response(headphones_raw,
                                                      'Headphones')
        result.append(headphones_html)
    if laptops is not None:
        laptops_raw = equipment_request(laptops)
        laptops_html = generate_equipment_response(laptops_raw, 'Laptops')
        result.append(laptops_html)
    return result


def build_equipment_legacy(equipment):
    result = []
    equipment_raw = equipment_request(equipment)
    equipment_html = generate_equipment_legacy_response(equipment_raw,
                                                        "Equipment")
    return equipment_html


def build_equipment_stem(laptops, headphones, chargers, calculators,
                         laptop_chargers):
    result = []
    if laptops is not None:
        laptops_raw = equipment_request(laptops)
        laptops_html = generate_equipment_response(laptops_raw, 'Laptops')
        result.append(laptops_html)
    if chargers is not None:
        chargers_raw = equipment_request(chargers)
        chargers_html = generate_equipment_response(chargers_raw,
                                                    'Phone Chargers')
        result.append(chargers_html)
    if laptop_chargers is not None:
        laptop_chargers_raw = equipment_request(laptop_chargers)
        laptop_chargers_html = generate_equipment_response(laptop_chargers_raw,
                                                           'Laptop Chargers')
        result.append(laptop_chargers_html)
    if headphones is not None:
        headphones_raw = equipment_request(headphones)
        headphones_html = generate_equipment_response(headphones_raw,
                                                      'Headphones')
        result.append(headphones_html)
    if calculators is not None:
        calculators_raw = equipment_request(calculators)
        calculators_html = generate_equipment_response(calculators_raw,
                                                       'Calculators')
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
    e_type = None
    for td in soup.find_all('td'):
        if len(td.get('class')) >= 1:
            td_field = td.get('class')[0]
            td_value = td.text
            if td_field == 'available':
                available = available + int(td_value)
            if td_field == 'total':
                total = total + int(td_value)
            if td_field == 'type':
                e_type = str(td_value)

    result['label'] = label
    result['total'] = total
    result['available'] = available

    return result


def generate_equipment_legacy_response(raw_html, label):
    results_dict = {}
    soup = BeautifulSoup(raw_html, 'html.parser')

    html_class = 'bg-grey'
    for tr in soup.find_all('tr'):
        entry = {}
        available = 0
        total = 0
        e_type = None
        mindue = None
        for td in tr.find_all('td'):
            td_field = td.get('class')[0]
            td_value = td.text
            if td_field == 'type':
                e_type = str(td_value)
            elif td_field == 'available':
                available = int(td_value)
            elif td_field == 'total':
                total = int(td_value)
            elif td_field == 'type':
                e_type = str(td_value)
            elif td_field == 'mindue':
                if td_value is not None and td_value.isnumeric() and \
                        available <= 0:
                    mindue = date.fromtimestamp(int(td_value)). \
                             strftime("%a, %b %d")
                elif available > 0:
                    mindue = 'Available Now'
                else:
                    mindue = 'n/a'
            # this is the last column in the row
            elif td_field == 'cpdpt':
                if e_type in results_dict:
                    # this already exists and the sum should be updated
                    # rather than a new dict entry added
                    if 'total' in results_dict[e_type]:
                        tmp_total = results_dict[e_type]['total'] + total
                        results_dict[e_type]['total'] = tmp_total
                    if 'available' in results_dict[e_type]:
                        tmp_available = results_dict[e_type]['available'] + \
                            available
                        results_dict[e_type]['available'] = tmp_available
                else:
                    entry['label'] = label
                    entry['total'] = total
                    entry['available'] = available
                    entry['title'] = e_type
                    entry['due'] = mindue
                    entry['class'] = html_class
                    results_dict[e_type] = entry
                    if html_class == 'bg-white':
                        html_class = 'bg-grey'
                    else:
                        html_class = 'bg-white'
    return results_dict
