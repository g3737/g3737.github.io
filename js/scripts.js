let myMap; 
let codeVerifier; // Переменная для хранения code_verifier

window.onload = function() {
    const accessToken = sessionStorage.getItem("vk_access_token");
    const userId = sessionStorage.getItem("vk_user_id");

    if (accessToken && userId) {
        fetchUserProfile(accessToken, userId);
    }

    // Инициализация карты
    ymaps.ready(initMap);
};

// Инициализация карты
function initMap() {
    myMap = new ymaps.Map('map', {
        center: [55.76, 37.64],
        zoom: 13
    });
}

// Начало авторизации
async function startAuth() {
    codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomState(); // Генерация состояния

    const authUrl = `https://id.vk.com/authorize?response_type=code&client_id=52496362&redirect_uri=https://g3737.github.io&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    window.location.href = authUrl;
}

// Генерация code_verifier
function generateCodeVerifier() {
    const array = new Uint32Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array).map(num => String.fromCharCode(num % 95 + 32)).join('');
}

// Генерация code_challenge
async function generateCodeChallenge(codeVerifier) {
    const hash = await sha256(codeVerifier);
    return base64UrlEncode(hash);
}

// Шифрование с использованием SHA-256
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return new Uint8Array(hashBuffer);
}

// Преобразование в формат Base64 URL
function base64UrlEncode(arrayBuffer) {
    const binaryString = String.fromCharCode(...arrayBuffer);
    return btoa(binaryString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Генерация случайного состояния
function generateRandomState() {
    return Math.random().toString(36).substring(2);
}

// Обработка успешной авторизации
function handleAuthResponse() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    // Запрос токена доступа
    fetch(`https://oauth.vk.com/access_token?client_id=52496362&client_secret=<ВАШ_CLIENT_SECRET>&code=${code}&redirect_uri=https://g3737.github.io`)
        .then(response => response.json())
        .then(data => {
            if (data.access_token) {
                sessionStorage.setItem("vk_access_token", data.access_token);
                fetchUserProfile(data.access_token, data.user_id);
            } else {
                console.error("Error during VK authorization:", data);
            }
        })
        .catch(error => console.error("Error fetching access token:", error));
}

// Получение профиля пользователя
function fetchUserProfile(accessToken, userId) {
    fetch(`https://api.vk.com/method/users.get?user_ids=${userId}&access_token=${accessToken}&v=5.131`)
        .then(response => response.json())
        .then(profileData => {
            if (profileData.response && profileData.response.length > 0) {
                const profileName = profileData.response[0].first_name + " " + profileData.response[0].last_name;
                document.getElementById("profileName").textContent = profileName;
                document.getElementById("profileInfo").style.display = "block"; // Показать информацию профиля
                document.getElementById("vkLoginButton").style.display = "none"; // Скрыть кнопку входа
            } else {
                console.error("Profile data not found:", profileData);
            }
        })
        .catch(error => console.error("Error fetching profile:", error));
}

// Функция выхода
function logout() {
    sessionStorage.removeItem("vk_access_token");
    sessionStorage.removeItem("vk_user_id");
    document.getElementById("profileInfo").style.display = "none"; 
    document.getElementById("vkLoginButton").style.display = "block"; 
    alert("Logged out successfully");
}

// Закрытие модального окна
function closeModal() {
    document.getElementById("vkProfileModal").style.display = "none";
}
