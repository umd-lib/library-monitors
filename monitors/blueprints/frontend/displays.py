import monitors
import datetime
import zoneinfo

from flask import Blueprint, render_template, abort
from jinja2 import TemplateNotFound
from zoneinfo import ZoneInfo
from monitors.blueprints.api import mapi

displays = Blueprint('displays', __name__, template_folder='templates',
                     static_folder='static', url_prefix='/monitors')


@displays.route('/mckeldin')
def mckeldin():
    try:
        return render_template('mckeldin.html')
    except TemplateNotFound:
        abort(404)


@displays.route('/stem')
def stem():
    try:
        return render_template('stem.html')
    except TemplateNotFound:
        abort(404)


@displays.route('/mckeldin-workstations-legacy')
def mckeldin_workstations_legacy():
    avail = None

    locs = monitors.mck_floors
    workstations = mapi.build_workstations_response(locs, False)
    if workstations is not None:
        avail = workstations

    ny = ZoneInfo("America/New_York")
    current_date = datetime.datetime.now().astimezone(ny)
    avail_date = current_date.strftime("%I:%M %p on %a, %b %d")
    try:
        return render_template('legacy-monitor.html', last_updated=avail_date,
                               library_name="McKeldin",
                               availability_results=avail)
    except TemplateNotFound:
        abort(404)


@displays.route('/stem-workstations-legacy')
def stem_workstations_legacy():
    avail = None
    nearby_avail = None

    locs = monitors.stem_floors
    workstations = mapi.build_workstations_response(locs, False)
    nearby_locs = monitors.stem_nearby
    nearby_workstations = mapi.build_workstations_response(nearby_locs, False)
    if workstations is not None:
        avail = workstations
    if nearby_workstations is not None:
        nearby_avail = nearby_workstations

    ny = ZoneInfo("America/New_York")
    current_date = datetime.datetime.now().astimezone(ny)
    avail_date = current_date.strftime("%I:%M %p on %a, %b %d")
    try:
        return render_template('legacy-monitor.html', last_updated=avail_date,
                               library_name="STEM",
                               availability_results=avail,
                               nearby_results=nearby_avail)
    except TemplateNotFound:
        abort(404)


@displays.route('/stem-equipment-legacy')
def stem_equipment_legacy():
    avail = None

    eq = monitors.stem_equipment
    equipment = mapi.build_equipment_legacy(eq)
    if equipment is not None:
        avail = equipment

    ny = ZoneInfo("America/New_York")
    current_date = datetime.datetime.now().astimezone(ny)
    avail_date = current_date.strftime("%I:%M %p on %a, %b %d")
    try:
        return render_template('legacy-equipment.html',
                               last_updated=avail_date,
                               library_name="STEM",
                               availability_results=avail)
    except TemplateNotFound:
        abort(404)


@displays.route('/mckeldin-equipment-legacy')
def mckeldin_equipment_legacy():
    avail = None

    eq = monitors.mck_equipment
    equipment = mapi.build_equipment_legacy(eq)
    if equipment is not None:
        avail = equipment

    ny = ZoneInfo("America/New_York")
    current_date = datetime.datetime.now().astimezone(ny)
    avail_date = current_date.strftime("%I:%M %p on %a, %b %d")
    try:
        return render_template('legacy-equipment.html',
                               last_updated=avail_date,
                               library_name="STEM",
                               availability_results=avail)
    except TemplateNotFound:
        abort(404)
