!function(){"use strict";const e="https://localhost:8080";async function t(e){try{console.log(`About to fetch data from ${e}`);const t=await fetch(e);if(console.log(`Response status: ${t.status}`),!t.ok)throw new Error(`Request failed with status ${t.status}`);return await t.json()}catch(e){throw console.error("Error:",e.message),e}}let n=t(`${e}/assets`).then((e=>(console.log("Assets fetched"),e))).catch((e=>{console.error(e)})).finally((()=>document.dispatchEvent(new Event("assetsLoaded")))),a=t(`${e}/data`).then((e=>(console.log("Data fetched"),e))).catch((e=>{console.error(e)})).finally((()=>document.dispatchEvent(new Event("dataLoaded"))));function o(e,t="defer"){return new Promise((function(n,a){const o=document.createElement("script");o.src=e,"defer"===t&&(o.async=!1),"async"===t&&(o.async=!0),o.addEventListener("load",(function(){n()})),o.addEventListener("error",(function(){a(new Error("Failed to load script: "+e))})),document.head.appendChild(o)}))}function s(e){return new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0,currencyDisplay:"symbol"}).format(e)}document.addEventListener("DOMContentLoaded",(function(){document.addEventListener("responsiveNavbarNeeded",(function(){!function(){let e=document.getElementById("navigationBar");"navbar"===e.className?e.className+=" responsive":e.className="navbar"}()})),document.getElementById("navigationBar").onclick=function(){document.dispatchEvent(new Event("responsiveNavbarNeeded"))}}));function r(e){new Swiper("#"+e,{spaceBetween:150,slidesPerView:"1",loop:!0,centeredSlides:!0,grabCursor:!0,navigation:{nextEl:`#${e}-next`,prevEl:`#${e}-prev`},pagination:{el:`#${e}-pagination`,clickable:!0},autoplay:{delay:3e3,disableOnInteraction:!1},zoom:{maxRatio:1.2,minRation:1}})}function i(e,t,n){let a=e[0],o=e[1];$(".informationBlock").hide().filter((function(){let e=parseFloat(t);return e>=a&&e<=o&&filteredLocations.includes(n)})).show()}Promise.all([o("js/swiper-bundle.min.js","async"),o("js/nouislider.min.js","async"),o("js/jquery-3.6.0.min.js","defer")]).then((function(){document.addEventListener("dataLoaded",(function(){!async function(){let e=await a,t=[],n=[],o=[0,1/0],d=1/0,c=0;const l=e.headerRow[1],p=e.values,u=l.indexOf("Photos");t=[...new Set(p.map((e=>e[1])))],n=t.slice(),i(o,p[0],p[1]),$("#informationBlocks").addClass("flex-container");for(const[e,t]of p.entries()){let n=$("<div>").addClass("informationBlock flex-item block");n.addClass(t[1]);let a=$("<div>").addClass("details");a.append("<h2>"+t[3]+"</h2>"),a.append("<h3>"+s(1e3*parseFloat(t[0].replace(/[^0-9.-]+/g,"")))+"</h3>"),a.append("<p>"+t[1]+"</p>"),a.append('<p><a href="tel:'+(m=t[2])+'">'+m+"</a></p>"),a.append("<p>"+(f=t[4],f.split("\n").map((e=>`<p>${e}</p>`)).join("")).replace(/\n/g,"<br>")+"</p>"),t[2].split(", ").forEach((function(e){e=e.trim(),a.append("<a style='text-decoration: none' href='https://api.whatsapp.com/send?phone="+e.replace(/\s/g,"")+"&text=Hola!%20Te%20llamo%20por%20el%20aviso%20de%20OMacaco%20Sitio%20Partner%20de%20La%20Estokada'><img src='https://cdn-icons-png.flaticon.com/64/3025/3025546.png' alt='Whatsapp' title='Whatsapp' target='_blank' width='70' height='70'/></a>")})),a.append(`<p><a style='text-decoration: none;' href='${t[6]}' target="_blank">🔗</a></p>`);let o="swiper-container-"+e,i=$("<div>").addClass("swiper-container").attr("id",o),l=$("<div>").addClass("swiper-wrapper"),p=$("<div>").addClass("swiper-pagination").attr("id",`${o}-pagination`),h=$("<div>").addClass("swiper-button-next").attr("id",`${o}-next`),g=$("<div>").addClass("swiper-button-prev").attr("id",`${o}-prev`);t[u]&&Array.isArray(t[u])&&t[u].forEach((function(e){if(e){let t=$("<div>").addClass("swiper-slide");t.append("<img src='"+e+"' style='width: 100%; height: auto; bottom: 0;' alt='Carousel Photo'>"),l.append(t)}}));let v=$("<div>").addClass("mainPhoto"),y=!1,w=t[u];for(;Array.isArray(w)&&w.length>0&&!y;)y=!!w[0]&&w[0],w.shift();y=y||"",v.append(`<img src='${y}' height='300' alt='Main Photo'>`),i.append(l,p,h,g);let E=$("<div>").addClass("swiper-container-wrapper");E.append(i),n.append(v,a,E),$("#informationBlocks").append(n),r(o);let b=t[1],C=1e3*parseFloat(t[0].replace(/[^0-9.-]+/g,""));C<d&&(d=C),C>c&&(c=C),n.data("fee",C),n.data("location",b),n.show()}var f,m;let h=document.getElementById("rangeSliders"),g=document.getElementById("feeRangeDisplay");document.getElementById("spinner").style.display="none";const v=noUiSlider.create(h,{start:[d,c],connect:!0,step:5e3,range:{min:d,max:c}});g.innerText=s(d)+" - "+s(c),v.on("update",(function(e,t){o[t]=parseInt(e[t]),g.innerText=s(parseInt(e[0]))+" - "+s(parseInt(e[1])),i(o,e[0],e[1])})),t.forEach((function(e){let t=$("<button>").addClass("filterButton active").text(e);t.click((function(){$(this).toggleClass("active"),n=[],$(".filterButton.active").each((function(){n.push($(this).text())})),i(o,p[0],p[1])})),$("#locationFilter").append(t)}))}()})),document.addEventListener("assetsLoaded",(function(){!async function(){let e=(await n).values;for(const[t,n]of e.entries())try{const e=document.getElementById(n[0]);"macaques"===n[0]?e.style.backgroundImage=`url("${n[1]}")`:e.setAttribute("src",n[1])}catch(e){console.error(`Error unpacking assets bundle: ${e}`)}}()})),a&&document.dispatchEvent(new Event("dataLoaded")),n&&document.dispatchEvent(new Event("assetsLoaded"))})).catch((function(e){console.error(e);const t=document.createElement("p");t.textContent="An error occurred. Please reload the page. Por favor recarga la página. Por gentileza recarregue a página.",document.body.appendChild(t)}))}();
