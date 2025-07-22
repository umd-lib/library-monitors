FROM python:3

EXPOSE 5000

# We copy just the requirements.txt first to leverage Docker cache
COPY ./requirements.txt /app/requirements.txt
COPY ./monitors.yaml /app/monitors.yaml

WORKDIR /app

RUN pip install -r requirements.txt

ENV FLASK_APP="/app/monitors/__init__.py"

COPY ./monitors /app/monitors

CMD ["waitress-serve", "--port", "5000", "--call", "monitors:run_app"]
