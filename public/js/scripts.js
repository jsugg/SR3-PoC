const dataEndpoint = "__DATA_ENDPOINT__";
const wspMessage = "__TARGET_WSP_MSG__";

var assets = false
var data = false


async function retryWithExponentialBackoff(url, maxRetries, initialDelay) {
    let retries = 0;
    let retryDelay = initialDelay;
  
    while (retries < maxRetries) {
      try {
        const response = await fetch(url, { mode: 'no-cors' });
  
        if (response.ok) {
          // If the request is successful, return the response
          return await response.json();
        } else {
          console.error(`Request failed. Retrying attempt ${retries + 1}`);
        }
      } catch (error) {
        console.error(`Request failed. Retrying attempt ${retries + 1}: ${error.message}`);
      }
  
      // Exponentially increase the retry delay
      retryDelay *= 2;
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      retries++;
    }
  
    throw new Error('Request failed after multiple retries.');
}

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

function fetchData2(url) {
    return $.ajax({
        url: url,
        dataType: 'json'
    });
}


function navToggle() {
    const hamburguerMenu = document.querySelector('a.icon');
    const navigationBar = document.getElementById("navigationBar");

    if (hamburguerMenu && hamburguerMenu.style.display !== 'none') {
        if (navigationBar.className === "navbar") {
            navigationBar.className += " responsive";
        } else {
            navigationBar.className = "navbar";
            //filterMenu.style.display = "block"
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {

    // Add event listener to the hamburguer menu
    document.addEventListener('responsiveNavbarNeeded', function () {
        navToggle();
    });
    document.getElementById("hamburger").onclick = function () {
        document.dispatchEvent(new Event('responsiveNavbarNeeded'));
    }
});

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
    console.log(`Initialized swiper ${swiperId}`);
}

async function renderAssets() {
    let bundle = assets;
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
    let bundle = data;

    let filteredFee = [0, Infinity];
    let minFee = Infinity;
    let maxFee = 0;
    const headerEntry = bundle.headerRow[1];
    const values = bundle.values;
    //let values = valuesEntries.map(entry => entry[1]);

    const imagesColumnIndex = 5;
    let locations = [...new Set(values.map(row => row[1]))];
    let filteredLocations = [...locations];

    function filterBlocks(feeFilter = null, locationFilter = null) {
        const minFee = feeFilter ? feeFilter[0] : null;
        const maxFee = feeFilter ? feeFilter[1] : null;
    
        $(".informationBlock").each(function () {
            const fee = parseFloat($(this).data("fee"));
            const location = $(this).data("location");
            
            const shouldShow =
                (!locationFilter || filteredLocations.includes(location)) &&
                (!feeFilter || (fee >= minFee && fee <= maxFee));
    
            $(this).toggle(shouldShow);
        });
    }

    $("#informationBlocks").addClass('flex-container');

    for (const [index, row] of values.entries()) {
        //console.log(`Row ${index}: row: ${row}`);
        let informationBlock = $("<div>").addClass("informationBlock flex-item block");
        informationBlock.addClass(row[1]); //row.location
        informationBlock.attr('data-fee', parseFloat(row[0].replace(/[^0-9.-]+/g, '')) * 1000);
        informationBlock.attr('data-location', row[1]);

        let details = $("<div>").addClass("details");
        details.append("<h2>" + row[3] + "</h2>"); //row.name
        details.append("<h3>" + currency(parseFloat(row[0].replace(/[^0-9.-]+/g, '')) * 1000) + "</h3>"); //row.fee
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

        let [images] = row[5];
        images = images ? images.split(",") : null;
        
        console.log(`Index ${index}. Typeof images: ${typeof images}, images: ${images}`);
        if (images && Array.isArray(images)) {
            images.forEach( async function (photo) {
                if (photo) {
                    photo = await retryWithExponentialBackoff(photo, 3, 1000)
                        .then(photo => photo || null)
                        .catch((error) => {
                        console.error('Request failed:', error);
                    });

                    //photo = await fetch(photo)
                    if (photo != null) {
                        let carouselItem = $("<div>").addClass("swiper-slide");
                        carouselItem.append("<img src='" + photo + "' style='width: 100%; height: auto; bottom: 0;' alt='Carousel Photo'>");
                        swiperWrapper.append(carouselItem);
                        console.log(`Photo ${index}: ${photo} added to the carousel`);
                    }

                } else {
                    console.log("No photo found for row: " + index);
                }
            });
        } else {
            console.log(`no luck with photos for row ${index}`);
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
        let swiperContainerWrapper = $('<div>').addClass('swiper-container-wrapper'); 
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
        filterBlocks([values[0], values[1]], null);
    });

    // Create location filter buttons
    locations.forEach(function (location) {
        let locationButton = $("<button>")
            .addClass("filterButton active")
            .text(location)
            .attr("data-location", location);

        locationButton.click(function () {
            $(this).toggleClass("active");

            const locationName = $(this).data("location");
            const indexToRemove = filteredLocations.indexOf(locationName);

            if (indexToRemove !== -1) {
                filteredLocations.splice(indexToRemove, 1);
            } else {
                filteredLocations.push(locationName);
            }
            filterBlocks(null, locationName);
        });
        $("#locationFilter").append(locationButton);
    });
}

loadScript('js/swiper-bundle.min.js', 'async');
loadScript('js/nouislider.min.js', 'async');

$(() => {
    document.addEventListener('dataLoaded', renderContents);
    document.addEventListener('assetsLoaded', renderAssets);

    // Start the assets fetch
    fetchData2(`${dataEndpoint}/assets`).then(assetsData => {
        assets = assetsData;
        // Assets are now loaded, trigger the assetsLoaded event
        document.dispatchEvent(new Event('assetsLoaded'));
    }).fail(error => {
        console.error('Failed to load assets:', error);
    });

    // Bind to the ajaxStop event, which will fire after the assets fetch is complete
    $(document).ajaxStop(function onAssetsLoaded() {
        // Unbind the ajaxStop event to prevent the data fetch from re-triggering this
        $(document).off('ajaxStop', onAssetsLoaded);

        // Now that the assets are loaded, start the data fetch
        fetchData2(`${dataEndpoint}/data`).then(dataResponse => {
            data = dataResponse;
            // Data is now loaded, trigger the dataLoaded event
            document.dispatchEvent(new Event('dataLoaded'));
        }).fail(error => {
            console.error('Failed to load data:', error);
        });
    });
