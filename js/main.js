// ============================================
// HAMBURGER MENU
// ============================================
const hamburger = document.querySelector('.hamburger')
const navLinks = document.querySelector('.nav-links')

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open')
    hamburger.textContent = navLinks.classList.contains('open') ? '✕' : '☰'
})

// Close menu when a link is clicked
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('open')
        hamburger.textContent = '☰'
    })
})

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open')
        hamburger.textContent = '☰'
    }
})

// ============================================
// HIGHLIGHT ACTIVE NAV LINK
// ============================================
const currentPage = window.location.pathname.split('/').pop()

document.querySelectorAll('.nav-links a').forEach(link => {
    const linkPage = link.getAttribute('href')
    if (linkPage === currentPage) {
        link.classList.add('active-link')
    }
})

// ============================================
// SCROLL — NAVBAR BACKGROUND CHANGE
// ============================================
const navbar = document.querySelector('.navbar')

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled')
    } else {
        navbar.classList.remove('scrolled')
    }
})

// ============================================
// SCROLL REVEAL ANIMATION
// ============================================
const revealElements = document.querySelectorAll(
    '.issue-card, .why-card, .info-card, .news-card, .pillar-promise, .timeline-item'
)

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            revealObserver.unobserve(entry.target)
        }
    })
}, { threshold: 0.15 })

revealElements.forEach(el => {
    el.classList.add('reveal')
    revealObserver.observe(el)
})