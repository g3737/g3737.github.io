let myMap;
let currentPage = 1; 
const photosPerPage = 20; 

window.onload = function() {
    const accessToken = sessionStorage.getItem("vk_access_token");
    const userId = sessionStorage.getItem("vk_user_id");

    if (accessToken && userId) {
        vkidOnSuccess({ access_token: accessToken, user_id: userId });
    }

    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);

    document.getElementById('startDate').value = lastMonth.toISOString().split('T')[0];
    document.getElementById('endDate').value = today.toISOString().split('T')[0];
};

// Инициализация карты при загрузке страницы
ymaps.ready(initMap);

// Инициализация карты
function initMap() {
    myMap = new ymaps.Map('map', {
        center: [55.76, 37.64],
        zoom: 13
    });

    myMap.events.add('click', function (e) {
        var coords = e.get('coords'); 
        applyFilters(coords); 
    });
}

function drawCircle(coords, radius) {
    if (myMap.circle) {
        myMap.geoObjects.remove(myMap.circle);
    }

    myMap.circle = new ymaps.Circle([coords, radius], {
        balloonContent: `Radius: ${radius} m`
    }, {
        fillColor: '#00FF0066',
        strokeColor: '#FF0000',
        strokeWidth: 2
    });

    myMap.geoObjects.add(myMap.circle);
}

function applyFilters(clickedCoords) {
    const radius = parseFloat(document.getElementById('radiusFilter').value);
    const startDate = new Date(document.getElementById('startDate').value).getTime() / 1000;
    const endDate = new Date(document.getElementById('endDate').value).getTime() / 1000;

    if (radius > 0) {
        drawCircle(clickedCoords, radius);
    }

    fetchPhotos(clickedCoords[0], clickedCoords[1], startDate, endDate, radius);
}

function fetchPhotos(lat, long, startTime, endTime, radius) {
    const accessToken = sessionStorage.getItem("vk_access_token");
    const userId = sessionStorage.getItem("vk_user_id");

    if (!accessToken || !userId) {
        console.error("VK access token or user ID is missing.");
        return;
    }

    const url = `https://cors-anywhere.herokuapp.com/https://api.vk.com/method/photos.search?` +
                `lat=${lat}&long=${long}&start_time=${startTime}&end_time=${endTime}&` +
                `radius=${radius}&count=${photosPerPage}&access_token=${accessToken}&v=5.131&page=${currentPage}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.response) {
                displayPhotos(data.response.items);
                updatePagination(data.response.count); 
            } else {
                console.error("Error fetching photos:", data);
            }
        })
        .catch(error => console.error("Error:", error));
}

function displayPhotos(photos) {
    const gallery = document.getElementById("photoGallery");
    gallery.innerHTML = "";

    photos.forEach(photo => {
        const img = document.createElement("img");
        img.src = photo.sizes[0].url;
        img.classList.add("photo-item");
        gallery.appendChild(img);
    });
}

function updatePagination(totalPhotos) {
    const totalPages = Math.ceil(totalPhotos / photosPerPage);
    document.getElementById("pageInfo").textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById("prevPage").disabled = currentPage === 1;
    document.getElementById("nextPage").disabled = currentPage === totalPages;
}

function changePage(direction) {
    currentPage += direction;

    if (currentPage < 1) {
        currentPage = 1;
    }

    fetchPhotos(); 
}

function login() {
    const vkAppId = 52496362; // Ваш ID приложения VK
    VKIDSDK.Auth.login(vkAppId)
        .then(data => {
            vkidOnSuccess(data);
        })
        .catch(error => console.error("Login error:", error));
}

function vkidOnSuccess(data) {
    const { access_token, user_id } = data;
    sessionStorage.setItem("vk_access_token", access_token);
    sessionStorage.setItem("vk_user_id", user_id);

    fetch(`https://cors-anywhere.herokuapp.com/https://api.vk.com/method/users.get?user_ids=${user_id}&access_token=${access_token}&v=5.131`)
        .then(response => response.json())
        .then(profileData => {
            if (profileData.response && profileData.response.length > 0) {
                const profileName = profileData.response[0].first_name + " " + profileData.response[0].last_name;
                document.getElementById("profileName").textContent = profileName;
                document.getElementById("profileInfo").style.display = "block"; 
                document.getElementById("vkLoginButton").style.display = "none"; 
            } else {
                console.error("Profile data not found:", profileData);
            }
        })
        .catch(error => console.error("Error fetching profile:", error));
}

function logout() {
    const accessToken = sessionStorage.getItem("vk_access_token");

    if (accessToken && 'VKIDSDK' in window) {
        VKIDSDK.Auth.logout(accessToken)
            .then(() => {
                sessionStorage.removeItem("vk_access_token");
                sessionStorage.removeItem("vk_user_id");
                document.getElementById("profileInfo").style.display = "none"; 
                document.getElementById("vkLoginButton").style.display = "block"; 
                alert("Logged out successfully");
            })
            .catch(error => console.error("Logout error:", error));
    } else {
        console.warn("No access token found or VKIDSDK not available.");
    }
}
