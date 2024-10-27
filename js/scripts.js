let myMap; 
let token;

// После перенаправления на ваш redirect_uri
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        exchangeCodeForToken(code);
    }
};

function exchangeCodeForToken(code) {
    const clientId = 52496362;
    const clientSecret = "MdVr0HkosHY8GvAmarit";
    const redirectUri = "https://g3737.github.io"; // ваш адрес перенаправления

    const tokenUrl = `https://api.vk.com/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}&code=${code}&v=5.131`;

    fetch(tokenUrl)
        .then(response => response.json())
        .then(data => {
            if (data.access_token) {
				token = access_token;
                sessionStorage.setItem("vk_access_token", data.access_token);
                sessionStorage.setItem("vk_user_id", data.user_id);
                loadUserProfile(data.access_token, data.user_id); // Загрузить информацию о профиле
            } else {
                console.error("Error getting access token:", data);
            }
        })
        .catch(error => console.error("Error:", error));
}

window.onload = function() {
 
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

    // Добавляем обработчик кликов на карту
    myMap.events.add('click', function (e) {
        var coords = e.get('coords'); // Получаем координаты клика
        console.log("Map clicked at coords:", coords); // Логируем координаты

        // Проверяем, что coords существуют и передаем их в applyFilters
        if (coords && coords.length === 2) {
            applyFilters(coords); // Передаем координаты в applyFilters
        } else {
            console.log("No valid coordinates found on map click.");
        }
    });
}

// Функция для отображения круга на карте
function drawCircle(coords, radius) {
    // Удаляем предыдущий круг, если он есть
    if (myMap.circle) {
        myMap.geoObjects.remove(myMap.circle);
    }

    // Создаем круг
    myMap.circle = new ymaps.Circle([coords, radius], {
        balloonContent: `Radius: ${radius} m`
    }, {
        fillColor: '#00FF0066',
        strokeColor: '#FF0000',
        strokeWidth: 2
    });

    // Добавляем круг на карту
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


// Получение фотографий по координатам и другим параметрам
function fetchPhotos(lat, long, startTime, endTime, radius) {
    const accessToken = sessionStorage.getItem("vk_access_token");
    const userId = sessionStorage.getItem("vk_user_id");

    if (!accessToken || !userId) {
        console.error("VK access token or user ID is missing.");
        return;
    }
 console.log("Token:", accessToken);
    const url = `https://api.vk.com/method/photos.search?` +
                `lat=${lat}&long=${long}&start_time=${startTime}&end_time=${endTime}&` +
                `radius=${radius}&count=20&access_token=${accessToken}&v=5.131`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.response) {
                displayPhotos(data.response.items);
            } else {
                console.error("Error fetching photos:", data);
            }
        })
        .catch(error => console.error("Error:", error));
}

// Отображение фотографий в галерее
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

function vkidOnSuccess(data) {
    const { access_token, user_id } = data;
    sessionStorage.setItem("vk_access_token", access_token);
    sessionStorage.setItem("vk_user_id", user_id);

    // Запрос к VK API для получения имени профиля
    fetch(`https://api.vk.com/method/users.get?user_ids=${user_id}&access_token=${access_token}&v=5.131`)
        .then(response => response.json())
        .then(profileData => {
            if (profileData.response && profileData.response.length > 0) {
                const profileName = profileData.response[0].first_name + " " + profileData.response[0].last_name;
                document.getElementById("profileName").textContent = profileName;
                document.getElementById("profileInfo").style.display = "block"; // Показать информацию профиля
            } else {
                console.error("Profile data not found:", profileData);
            }
        })
        .catch(error => console.error("Error fetching profile:", error));
}

// Функция выхода из VKID
function logout() {
    const accessToken = sessionStorage.getItem("vk_access_token");

    if (accessToken && 'VKIDSDK' in window) {
        VKIDSDK.Auth.logout(accessToken)
            .then(() => {
                sessionStorage.removeItem("vk_access_token");
                sessionStorage.removeItem("vk_user_id");
                document.getElementById("profileInfo").style.display = "none"; // Скрыть информацию профиля
                alert("Logged out successfully");
            })
            .catch(error => console.error("Logout error:", error));
    } else {
        console.warn("No access token found or VKIDSDK not available.");
    }
}