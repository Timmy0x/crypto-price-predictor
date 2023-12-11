function normalize(value, min, max) {
    return (value - min) / (max - min);
}

async function scaleData(data) {
    let inputs = data.map(obj => obj.input).flat();
    let outputs = data.map(obj => obj.output).flat();

    let minInput = Math.min(...inputs);
    let maxInput = Math.max(...inputs);

    let minOutput = Math.min(...outputs);
    let maxOutput = Math.max(...outputs);

    data = data.map(obj => ({
        input: obj.input.map(value => normalize(value, minInput, maxInput)),
        output: obj.output.map(value => normalize(value, minOutput, maxOutput))
    }))
    return data
}
async function minMaxScaleData(data) {
    let inputs = data.map(obj => obj.input).flat();
    let outputs = data.map(obj => obj.output).flat();

    let minInput = Math.min(...inputs);
    let maxInput = Math.max(...inputs);

    let minOutput = Math.min(...outputs);
    let maxOutput = Math.max(...outputs);

    return {minOutput, maxOutput};
}
async function scaleArrayData(arrayData) {
    let minInput = Math.min(...arrayData);
    let maxInput = Math.max(...arrayData);

    return arrayData.map(value => normalize(value, minInput, maxInput));
}

function unscaleOutput(scaledOutput, minOutput, maxOutput) {
    return (scaledOutput * (maxOutput - minOutput)) + minOutput;
}

function percentageDifference(oldNumber, newNumber) {
    return ((newNumber - oldNumber) / oldNumber) * 100;
}


document.addEventListener("DOMContentLoaded", async function () {
    update()
    retrain()

    setInterval(function () {update()}, 10000);
})

async function update() {
    minMax = await fetch("/net/minmax")
    minMax = await minMax.json()
    minOutput = minMax.min
    maxOutput = minMax.max
    
    price = await fetch("/price")
    price = await price.json()
    price = price.price
    document.getElementById("price-title").innerHTML = price
    document.getElementById("price").style.display = "initial"
    document.getElementById("loader").style.display = "none"

    inputs = await fetch("/inputs")
    inputs = await inputs.json()
    inputs = await scaleArrayData(inputs)

    model = await fetch("/net/get")
    model = await model.json()
    
    net = new brain.NeuralNetworkGPU().fromJSON(model)
    output = unscaleOutput(net.run(inputs), minOutput, maxOutput);

    if (percentageDifference(price, output) < 0) {
        document.getElementById("price-title").innerHTML = `${price} <mark>${percentageDifference(price, output).toFixed(2)}%</mark>`
        document.getElementById("price-title").classList.add("lightred")
    } else {
        document.getElementById("price-title").innerHTML = `${price} <mark>+${percentageDifference(price, output).toFixed(2)}%</mark>`
        document.getElementById("price-title").classList.add("lightgreen")
    }
    document.getElementById("price-prediction").innerHTML = `<i class='fa fa-caret-square-o-right'></i> ${output} `
}

async function retrain() {
    train = await fetch("/train")
    train = await train.json()
    let {minOutput, maxOutput} = await minMaxScaleData(train);
    train = await scaleData(train)

    inputs = await fetch("/inputs")
    inputs = await inputs.json()
    inputs = await scaleArrayData(inputs)

    net = new brain.NeuralNetworkGPU();
    net.train(train, {
        log: true,
        iterations: 10000
    })

    set = await fetch("/net/set", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(net.toJSON())
    })
    set = await set.json()

    output = unscaleOutput(net.run(inputs), minOutput, maxOutput);

    if (percentageDifference(price, output) < 0) {
        document.getElementById("price-title").innerHTML = `${price} <mark>${percentageDifference(price, output).toFixed(2)}%</mark>`
        document.getElementById("price-title").classList.add("lightred")
    } else {
        document.getElementById("price-title").innerHTML = `${price} <mark>+${percentageDifference(price, output).toFixed(2)}%</mark>`
        document.getElementById("price-title").classList.add("lightgreen")
    }
    document.getElementById("price-prediction").innerHTML = `<i class='fa fa-caret-square-o-right'></i> ${output} `
}

document.getElementById("refresh").addEventListener("click", async function () {
    page = await fetch("/")
    page = await page.text

    document.innerHTML = page
})