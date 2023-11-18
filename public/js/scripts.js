const dataEndpoint = "__DATA_ENDPOINT__";
const wspMessage = "__TARGET_WSP_MSG__";

async function fetchData(url) {
    try {
        console.log(`About to fetch data from ${url}`);
        const response = await fetch(url);
        console.log(`Response status: ${response.status}`);
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        const dataSet = await response.json();
        return dataSet;
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}

let assets = fetchData(`${dataEndpoint}/assets`)
    .then((dataSet) => { console.log('Assets fetched'); return dataSet })
    .catch(error => { console.error(error) })
    .finally(() => document.dispatchEvent(new Event('assetsLoaded')));

let data = fetchData(`${dataEndpoint}/data`)
    .then((dataSet) => { console.log('Data fetched'); return dataSet })
    .catch(error => { console.error(error) })
    .finally(() => document.dispatchEvent(new Event('dataLoaded')));

function navToggle() {
    let x = document.getElementById("navigationBar");
    //let filterMenu = document.getElementById("filterMenu");

    if (x.className === "navbar") {
        x.className += " responsive";
    } else {
        x.className = "navbar";
        //filterMenu.style.display = "block"
    }
}

document.addEventListener('DOMContentLoaded', function () {

    // Add event listener to the hamburguer menu
    document.addEventListener('responsiveNavbarNeeded', function () {
        navToggle();
    });
    document.getElementById("navigationBar").onclick = function () {
        document.dispatchEvent(new Event('responsiveNavbarNeeded'));
    }
});

// Load a script asynchronously
function loadScript(url, attribute = 'defer') {
    return new Promise(function (resolve, reject) {
        const script = document.createElement('script');
        script.src = url;
        if (attribute === 'defer') script.async = false;
        if (attribute === 'async') script.async = true;

        script.addEventListener('load', function () {
            resolve();
        });

        script.addEventListener('error', function () {
            reject(new Error('Failed to load script: ' + url));
        });

        document.head.appendChild(script);
    });
}

function currency(amount) {
    const formatter = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0,
        currencyDisplay: 'symbol'
    });

    return formatter.format(amount);
}

function newLinesToHTMLParagraphs(str) {
    return str.split("\n").map(substring => `<p>${substring}</p>`).join("");
}

function updateSliderBackground() {
    let minFeeSlider = document.getElementById("minFee");
    let percentage = ((minFeeSlider.value - minFeeSlider.min) / (minFeeSlider.max - minFeeSlider.min)) * 100;
    minFeeSlider.style.backgroundImage = `linear-gradient(to right, white ${percentage}%, blue ${percentage}%)`;
}

function createPhoneLink(phoneNumber) {
    return '<a href="tel:' + phoneNumber + '">' + phoneNumber + '</a>';
}

const linkIcon = '🔗';

// Initialize Swiper instances
function initializeSwiper(swiperId) {
    const swiper = new Swiper("#" + swiperId, {
        spaceBetween: 150,
        slidesPerView: '1',
        loop: true,
        centeredSlides: true,
        grabCursor: true,
        navigation: {
            nextEl: `#${swiperId}-next`,
            prevEl: `#${swiperId}-prev`,
        },
        pagination: {
            el: `#${swiperId}-pagination`,
            clickable: true,
        },
        autoplay: {
            delay: 3000,
            disableOnInteraction: false,
        },
        zoom: {
            maxRatio: 1.2,
            minRation: 1
        },
    });
}

function filterBlocks(filteredFee, feeData, locationData) {
    let minFee = filteredFee[0];
    let maxFee = filteredFee[1];

    $(".informationBlock").hide().filter(function () {
        let fee = parseFloat(feeData);
        return fee >= minFee && fee <= maxFee && filteredLocations.includes(locationData);
    }).show();
}

async function renderAssets() {
    let bundle = await assets;
    let assetsValues = bundle.values;

    for (const [index, entry] of assetsValues.entries()) {
        try {
            const asset = document.getElementById(entry[0]);

            if (entry[0] === 'macaques') {
                asset.style.backgroundImage = `url("${entry[1]}")`;
            } else { asset.setAttribute('src', entry[1]); }

        } catch (error) {
            console.error(`Error unpacking assets bundle: ${error}`);
        }
    }
}

async function renderContents() {
    let bundle = await data;

    let locations = [];
    let filteredLocations = [];
    let filteredFee = [0, Infinity];
    let minFee = Infinity;
    let maxFee = 0;
    const headerEntry = bundle.headerRow[1];
    const values = bundle.values;
    //let values = valuesEntries.map(entry => entry[1]);

    const imagesColumnIndex = headerEntry.indexOf("Photos");
    locations = [...new Set(values.map(row => row[1]))];
    filteredLocations = locations.slice();
    filterBlocks(filteredFee, values[0], values[1]);

    $("#informationBlocks").addClass('flex-container');

    for (const [index, row] of values.entries()) {
        //console.log(`Row ${index}: row: ${row}`);
        let informationBlock = $("<div>").addClass("informationBlock flex-item block");
        informationBlock.addClass(row[1]); //row.location

        let details = $("<div>").addClass("details");
        details.append("<h2>" + row[3] + "</h2>"); //row.name
        details.append("<h3>" + currency(parseFloat(row[0].replace(/[^0-9.-]+/g, "")) * 1000) + "</h3>"); //row.fee
        details.append("<p>" + row[1] + "</p>"); //row.location
        details.append("<p>" + createPhoneLink(row[2]) + "</p>"); //row.phone
        details.append("<p>" + newLinesToHTMLParagraphs(row[4]).replace(/\n/g, "<br>") + "</p>"); //row.description
        let phones = row[2].split(','); // Whatsapp
        phones.forEach(function (phone) {
            phone = phone.trim(); // Fix: assign the result of phone.trim() to phone
            details.append("<a style='text-decoration: none' href='https://api.whatsapp.com/send?phone=" + phone.replace(/\s/g, "")
                + `&text=${wspMessage}'><img src='https://cdn-icons-png.flaticon.com/64/3025/3025546.png' alt='Whatsapp' title='Whatsapp' target='_blank' width='70' height='70'/></a>`);
        });
        details.append(`<p><a style='text-decoration: none;' href='${row[6]}' target="_blank">${linkIcon}</a></p>`); // row.link

        let swiperId = "swiper-container-" + index;
        let swiperContainer = $("<div>")
            .addClass("swiper-container")
            .attr("id", swiperId);
        let swiperWrapper = $("<div>")
            .addClass("swiper-wrapper");
        let pagination = $("<div>")
            .addClass("swiper-pagination")
            .attr("id", `${swiperId}-pagination`);
        let buttonNext = $("<div>")
            .addClass("swiper-button-next")
            .attr("id", `${swiperId}-next`);
        let buttonPrev = $("<div>")
            .addClass("swiper-button-prev")
            .attr("id", `${swiperId}-prev`);

        if (row[imagesColumnIndex] && Array.isArray(row[imagesColumnIndex])) {
            row[imagesColumnIndex].forEach( async function (photo) {
                if (photo) {
                    photo = fetch(photo).then(response => {
                        if (response.status === 200) {
                            return response.blob();
                        } else {
                            console.log("Error fetching photo from URL: " + photo + ". " + response.status);
                            return false;
                        }
                     })
                    let carouselItem = $("<div>").addClass("swiper-slide");
                    carouselItem.append("<img src='" + photo + "' style='width: 100%; height: auto; bottom: 0;' alt='Carousel Photo'>");

                    swiperWrapper.append(carouselItem);
                }
            });
        }

        let mainPhoto = $("<div>").addClass("mainPhoto");
        let mainPhotoFound = false;
        let rowContents = row[imagesColumnIndex];

        while (Array.isArray(rowContents) && rowContents.length > 0 && !mainPhotoFound) {
            mainPhotoFound = rowContents[0] ? rowContents[0] : false;
            rowContents.shift();
        }

        mainPhotoFound = mainPhotoFound ? mainPhotoFound : '';
        mainPhoto.append(`<img src='${mainPhotoFound}' height='300' alt='Main Photo'>`);

        swiperContainer.append(swiperWrapper, pagination, buttonNext, buttonPrev);

        // Wrap Swiper container inside a new div
        let swiperContainerWrapper = $('<div>').addClass('swiper-container-wrapper'); ``
        swiperContainerWrapper.append(swiperContainer);

        informationBlock.append(mainPhoto, details, swiperContainerWrapper);
        $("#informationBlocks").append(informationBlock);

        initializeSwiper(swiperId);

        let location = row[1]; // location
        let fee = parseFloat(row[0].replace(/[^0-9.-]+/g, "")) * 1000; // fee

        if (fee < minFee) {
            minFee = fee;
        }
        if (fee > maxFee) {
            maxFee = fee;
        }

        informationBlock.data("fee", fee);
        informationBlock.data("location", location);
        informationBlock.show();
    };

    // Initialize noUiSlider
    let rangeSliders = document.getElementById("rangeSliders");
    let feeRangeDisplay = document.getElementById("feeRangeDisplay");
    document.getElementById("spinner").style.display = "none";
    const slider = noUiSlider.create(rangeSliders, {
        start: [minFee, maxFee],
        connect: true,
        step: 5000,
        range: {
            min: minFee,
            max: maxFee,
        },
    });

    // Update the fee range display initially
    feeRangeDisplay.innerText = currency(minFee) + " - " + currency(maxFee);

    // Handle the slider events
    slider.on("update", function (values, handle) {
        // Update the filteredFee array
        filteredFee[handle] = parseInt(values[handle]);

        // Update the fee range display
        feeRangeDisplay.innerText = currency(parseInt(values[0])) + " - " + currency(parseInt(values[1]));

        // Filter the blocks
        filterBlocks(filteredFee, values[0], values[1]);
    });

    // Create location filter buttons
    locations.forEach(function (location) {
        let locationButton = $("<button>").addClass("filterButton active").text(location);
        locationButton.click(function () {
            $(this).toggleClass("active");
            filteredLocations = [];
            $(".filterButton.active").each(function () {
                filteredLocations.push($(this).text());
            });
            filterBlocks(filteredFee, values[0], values[1]);
        });
        $("#locationFilter").append(locationButton);
    });
}

// Load and evaluate the third-party libraries asynchronously
Promise.all([
    loadScript('js/swiper-bundle.min.js', 'async'),
    loadScript('js/nouislider.min.js', 'async'),
    loadScript('js/jquery-3.6.0.min.js', 'defer'),
])
    .then(function () {
        document.addEventListener('dataLoaded', function () {
            renderContents();
        });
        document.addEventListener('assetsLoaded', function () {
            renderAssets();
        });
    
        if (data) document.dispatchEvent(new Event('dataLoaded'));
        if (assets) document.dispatchEvent(new Event('assetsLoaded'));
    })
    .catch(function (error) {
        console.error(error);
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'An error occurred. Please reload the page. Por favor recarga la página. Por gentileza recarregue a página.';
        document.body.appendChild(errorMessage);
    });

