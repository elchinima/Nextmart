const loginButton = document.getElementById('login-btn');
const closeLoginButton = document.getElementById('close-btn');
const loginWrapper = document.getElementById('login-wrapper');
const neumorphicLogin = document.querySelector('.neumorphic-login');

function openLoginModal() {
    loginWrapper.style.display = 'flex';
    loginWrapper.classList.add('open');
}

function closeLoginModal() {
    loginWrapper.classList.remove('open');
    setTimeout(() => {
        loginWrapper.style.display = 'none';
    }, 300);
    const homeLink = document.querySelector('.gooey-nav-container nav ul li:nth-child(2) a');
    if (homeLink) homeLink.click();
}

loginButton.addEventListener("click", openLoginModal);
closeLoginButton.addEventListener("click", closeLoginModal);

loginWrapper.addEventListener("click", function (event) {
    if (event.target === loginWrapper) {
        closeLoginModal();
    }
});

