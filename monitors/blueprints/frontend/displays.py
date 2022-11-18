import datetime
import monitors

from flask import Blueprint, render_template, abort
from jinja2 import TemplateNotFound
from monitors.blueprints.api import mapi

displays = Blueprint('displays', __name__, template_folder='templates',
                     static_folder='static', url_prefix='/monitors')


@displays.route('/mckeldin')
def mckeldin():
    try:
        return render_template('mckeldin.html')
    except TemplateNotFound:
        about(404)


@displays.route('/stem')
def stem():
    try:
        return render_template('stem.html')
    except TemplateNotFound:
        about(404)


@displays.route('/mckeldin-legacy')
def mckeldin_legacy():
    avail = None

    locs = monitors.mck_floors
    workstations = mapi.build_workstations_response(locs, False)
    if workstations is not None:
        avail = workstations

    current_date = datetime.datetime.now()
    avail_date = current_date.strftime("%I:%M %p on %a, %b %d")
    try:
        return render_template('legacy-monitor.html', last_updated=avail_date,
                               library_name="McKeldin",
                               availability_results=avail)
    except TemplateNotFound:
        about(404)


@displays.route('/stem-legacy')
def stem_legacy():
    avail = None

    locs = monitors.stem_floors
    workstations = mapi.build_workstations_response(locs, False)
    if workstations is not None:
        avail = workstations

    current_date = datetime.datetime.now()
    avail_date = current_date.strftime("%I:%M %p on %a, %b %d")
    try:
        return render_template('legacy-monitor.html', last_updated=avail_date,
                               library_name="STEM",
                               availability_results=avail)
    except TemplateNotFound:
        about(404)
