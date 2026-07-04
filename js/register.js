// ============================================
// SUPABASE CONFIGURATION
// ============================================
const SUPABASE_URL = 'https://nkuqrucociafwqnytpai.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rdXFydWNvY2lhZndxbnl0cGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4ODk4ODQsImV4cCI6MjA5ODQ2NTg4NH0.fvOfoR-VZqyJVXu7faxGk5KrMMhaSBTGfCluV00I-Kw'

// Initialize Supabase client
const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ============================================
// DOM ELEMENTS
// ============================================
const submitBtn = document.getElementById('register-submit')
const feedback = document.getElementById('register-feedback')
const counterEl = document.getElementById('supporter-count')

// Form fields
const nameInput = document.getElementById('reg-name')
const phoneInput = document.getElementById('reg-phone')
const emailInput = document.getElementById('reg-email')
const wardInput = document.getElementById('reg-ward')
const roleInput = document.getElementById('reg-role')
const consentInput = document.getElementById('reg-consent')

// ============================================
// LOAD SUPPORTER COUNT ON PAGE LOAD
// ============================================
async function loadSupporterCount() {
    try {
        const { count, error } = await db
            .from('supporters')
            .select('*', { count: 'exact', head: true })

        if (error) throw error

        // Animate the counter from 0 to real number
        animateCounter(counterEl, count)

    } catch (error) {
        console.error('Count error:', error)
    }
}

// ============================================
// COUNTER ANIMATION
// ============================================
function animateCounter(element, target) {
    let current = 0
    const duration = 1500 // 1.5 seconds
    const increment = target / (duration / 16)

    const timer = setInterval(() => {
        current += increment
        if (current >= target) {
            current = target
            clearInterval(timer)
        }
        element.textContent = Math.floor(current).toLocaleString()
    }, 16)
}

// ============================================
// VALIDATE FORM
// ============================================
function validateForm() {
    const name = nameInput.value.trim()
    const phone = phoneInput.value.trim()
    const ward = wardInput.value
    const role = roleInput.value
    const consent = consentInput.checked

    // Check required fields
    if (!name) {
        showFeedback('Please enter your full name.', 'error')
        return false
    }

    if (!phone) {
        showFeedback('Please enter your phone number.', 'error')
        return false
    }

    // Validate Kenyan phone number format
    const phoneRegex = /^(?:254|\+254|0)?([71][0-9]{8})$/
    if (!phoneRegex.test(phone)) {
        showFeedback('Please enter a valid Kenyan phone number.', 'error')
        return false
    }

    if (!ward) {
        showFeedback('Please select your ward.', 'error')
        return false
    }

    if (!role) {
        showFeedback('Please select how you would like to help.', 'error')
        return false
    }

    if (!consent) {
        showFeedback('Please consent to being contacted to complete registration.', 'error')
        return false
    }

    return true
}

// ============================================
// SHOW FEEDBACK MESSAGE
// ============================================
function showFeedback(message, type) {
    feedback.innerHTML = message
    feedback.style.color = type === 'error' ? '#dc3545' : '#28a745'
}

// ============================================
// FORMAT PHONE NUMBER
// ============================================
function formatPhone(phone) {
    // Normalize to 07XXXXXXXX format
    phone = phone.trim()
    if (phone.startsWith('+254')) return '0' + phone.slice(4)
    if (phone.startsWith('254')) return '0' + phone.slice(3)
    return phone
}

// ============================================
// CHECK FOR DUPLICATE PHONE
// ============================================
async function isDuplicate(phone) {
    try {
        const { data, error } = await db
            .from('supporters')
            .select('id')
            .eq('phone', phone)
            .maybeSingle()

        if (error) throw error
        return data !== null

    } catch (error) {
        console.error('Duplicate check error:', error)
        return false
    }
}

// ============================================
// REGISTER SUPPORTER
// ============================================
async function registerSupporter() {

    // Prevent double clicks
    if (submitBtn.disabled) return
    submitBtn.disabled = true
    submitBtn.textContent = 'Registering...'
    feedback.textContent = ''

    // Validate first
    if (!validateForm()) {
        submitBtn.disabled = false
        submitBtn.textContent = 'Register Now'
        return
    }

    const phone = formatPhone(phoneInput.value)

    try {
        // Check for duplicate registration
        const duplicate = await isDuplicate(phone)
        if (duplicate) {
            showFeedback('This phone number is already registered. Thank you for your support!', 'error')
            submitBtn.disabled = false
            submitBtn.textContent = 'Register Now'
            return
        }

        // Insert into Supabase
        const { error } = await db
            .from('supporters')
            .insert([{
                full_name: nameInput.value.trim(),
                phone: phone,
                email: emailInput.value.trim() || null,
                ward: wardInput.value,
                role: roleInput.value,
                consent: consentInput.checked
            }])

        if (error) throw error

        // Success
        showFeedback('<i class="fa-solid fa-user-check" style="color: rgb(30, 216, 31);"></i> You are now registered! Welcome to the movement.', 'success')
        submitBtn.textContent = 'Registered!'

        // Clear form
        nameInput.value = ''
        phoneInput.value = ''
        emailInput.value = ''
        wardInput.value = ''
        roleInput.value = ''
        consentInput.checked = false

        // Refresh counter
        loadSupporterCount()

    } catch (error) {
        console.error('Registration error:', error)
        showFeedback('Something went wrong. Please try again.', 'error')
        submitBtn.disabled = false
        submitBtn.textContent = 'Register Now'
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
submitBtn.addEventListener('click', registerSupporter)

// Run on page load
loadSupporterCount()