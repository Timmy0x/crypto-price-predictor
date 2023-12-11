import pandas

import importlib
import os
import sys

import time
import requests

import json

sys.path.insert(0, "")

factors = [f.replace(".py", "") for f in os.listdir('data/sources/') if f.endswith('.py')]


def get_factor(name):
    module = importlib.import_module(f"data.sources.{name}")
    data = module.fetch()
    return data

def get_all_factors():
    data = pandas.read_json("data/data.json")

    new_data = {}
    for name in factors:
        new_data[name] = get_factor(name)
    new_data["price"] = get_current_bitcoin_price()
    new_data["date"] = int(time.time())

    data.loc[len(data)] = new_data
    open("data/data.json", "w").write(json.dumps(json.loads(data.to_json()), indent=4))

def get_curr_input():
    return [get_factor(name) for name in factors] + [int(time.time())]

def format_factors():
    with open("data/data.json", "r") as file:
        input_data = json.load(file)

    prices = list(input_data["price"].values())

    training_data = []

    for factor in factors:
        for i in range(len(prices)):
            example = {
                "input": [input_data["date"][str(i)]] + [input_data[factor][str(i)] for factor in factors],
                "output": [prices[i]]
            }
            training_data.append(example)
    
    open("data/train.json", "w").write(json.dumps(training_data, indent=4))


def get_current_bitcoin_price():
    url = "https://api.coingecko.com/api/v3/simple/price"
    params = {
        "ids": "bitcoin",
        "vs_currencies": "usd"
    }

    response = requests.get(url, params=params)
    data = response.json()
    price = data["bitcoin"]["usd"]

    return price