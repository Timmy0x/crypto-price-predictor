from flask import Flask, render_template, request, Response

import json

from data.main import get_all_factors, get_curr_input, get_current_bitcoin_price, format_factors
get_all_factors()

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/scripts/<name>")
def scripts(name):
    return Response(str(open("templates/scripts/" + name).read()), "text/javascript")

@app.route("/styles/<name>")
def styles(name):
    return Response(str(open("templates/styles/" + name).read()), "text/css")


@app.route("/train")
def data():
    get_all_factors()
    format_factors()
    return Response(open("data/train.json").read(), mimetype="application/json")

@app.route("/inputs")
def input():
    return Response(json.dumps(get_curr_input(), indent=4), mimetype="application/json")

@app.route("/price")
def price():
    return Response(json.dumps({"price": get_current_bitcoin_price()}, indent=4), mimetype="application/json")


@app.route("/net/set", methods=["POST"])
def net_set():
    open("data/net.json", "w").write(json.dumps(request.json, indent=4))
    return Response(json.dumps({"success": True}, indent=4), mimetype="application/json")

@app.route("/net/get")
def net_get():
    return Response(open("data/net.json").read(), mimetype="application/json")

@app.route("/net/minmax")
def net_minmax():
    data = json.loads(open("data/data.json").read())["price"]
    return Response(json.dumps({"min": min(data.values()), "max": max(data.values())}, indent=4), mimetype="application/json")

app.run(host="0.0.0.0", port=81, debug=True)