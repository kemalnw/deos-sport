exports.sort = (sort) => {
    const arraySort = [];

    if (sort) {
        for (const element of sort) {
            const value = element.replace(/^\[|\]$/g, '').split(", ");
            arraySort.push(value);
        }
    }

    return arraySort;
};

exports.search = (search) => {
    const arraySearch = [];

    if (search) {
        for (const element of sort) {
            const value = element.replace(/^\[|\]$/g, '').split(", ");
            arraySearch.push(value);
        }
    }

    return arraySearch;
};

exports.groupBy = (objectArray, ...properties) => {
    return [...Object.values(objectArray.reduce((accumulator, object) => {
        const key = JSON.stringify(properties.map((x) => object[x] || null));
        if (!accumulator[key]) {
            accumulator[key] = [];
        }
        accumulator[key].push(object);
        return accumulator;
    }, {}))];
}

exports.sum = (array, key) => {
    return array.reduce((a, b) => a + (b[key] || 0), 0);
}

exports.formatCurrency = (number) => {
    var reverse = number
        .toString()
        .split("")
        .reverse()
        .join(""),
        currency = reverse.match(/\d{1,3}/g);
    currency = currency
        .join(".")
        .split("")
        .reverse()
        .join("");

    return "Rp. " + currency;
}

exports.getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return parseInt(Math.floor(Math.random() * (max - min)) + min); //The maximum is exclusive and the minimum is inclusive
}

exports.getWidthLength = (cloth_size) => {
    let cloth_width = 52;
    let cloth_length = 72;

    switch (cloth_size) {
        case "XS":
            cloth_width = 42  
            cloth_length = 62
            break;
        case "S":
            cloth_width = 46
            cloth_length = 66
            break;
        case "M":
            cloth_width = 50
            cloth_length = 70
            break;
        case "L":
            cloth_width = 52
            cloth_length = 72
            break;
        case "XL":
            cloth_width = 54
            cloth_length = 74
            break;
        case "XXL":
            cloth_width = 58
            cloth_length = 76
            break;
        default:
            cloth_width = 52  
            cloth_length = 72
    }
    return {
        cloth_width,cloth_length
    }
}