// ============================================
// SUPABASE CONFIGURATION
// ============================================
const SUPABASE_URL = 'https://nkuqrucociafwqnytpai.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rdXFydWNvY2lhZndxbnl0cGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4ODk4ODQsImV4cCI6MjA5ODQ2NTg4NH0.fvOfoR-VZqyJVXu7faxGk5KrMMhaSBTGfCluV00I-Kw'

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ============================================
// STATE
// ============================================
let allPosts = []
let currentPostId = null

// ============================================
// LOAD POSTS ON PAGE LOAD
// ============================================
async function loadNewsPosts() {
    const dynamicSection = document.getElementById('dynamic-posts')
    const staticSection = document.getElementById('static-posts')

    try {
        const { data, error } = await db
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        allPosts = data

        if (data.length === 0) {
            // No real posts yet — show static content
            staticSection.style.display = 'block'
            dynamicSection.style.display = 'none'
            return
        }

        // Real posts exist — hide static, show dynamic
        staticSection.style.display = 'none'
        dynamicSection.style.display = 'block'

        renderNewsPosts(data)

    } catch (error) {
        console.error('Load news error:', error)
        // On error fall back to static
        staticSection.style.display = 'block'
        dynamicSection.style.display = 'none'
    }
}

// ============================================
// RENDER POSTS
// ============================================
function renderNewsPosts(data) {
    const dynamicSection = document.getElementById('dynamic-posts')

    // First post is featured
    const featured = data[0]
    const rest = data.slice(1)

    let html = ''

    // Featured post
    html += `
        <div class="news-featured" onclick="openPost('${featured.id}')" 
            style="cursor:pointer;">
            <div class="news-featured-image">
                ${featured.image_url
                    ? `<img src="${featured.image_url}" alt="${featured.title}">`
                    : `<div class="news-no-image">
                        <i class="fa-solid fa-newspaper"></i>
                       </div>`
                }
                <span class="news-tag">${featured.category}</span>
            </div>
            <div class="news-featured-text">
                <p class="news-date">
                    <i class="fa-regular fa-calendar"></i>
                    ${new Date(featured.created_at).toLocaleDateString('en-KE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </p>
                <h2>${featured.title}</h2>
                <p>${featured.content.substring(0, 200)}...</p>
                <button class="btn-secondary" onclick="openPost('${featured.id}')">
                    Read More
                </button>
            </div>
        </div>
    `

    // Rest of posts grid
    if (rest.length > 0) {
        html += `<h2 class="news-grid-title">More Updates</h2>`
        html += `<div class="news-grid">`
        html += rest.map(p => `
            <div class="news-card" onclick="openPost('${p.id}')" style="cursor:pointer;">
                <span class="news-tag">${p.category}</span>
                <p class="news-date">
                    <i class="fa-regular fa-calendar"></i>
                    ${new Date(p.created_at).toLocaleDateString('en-KE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })}
                </p>
                <h3>${p.title}</h3>
                <p>${p.content.substring(0, 120)}...</p>
                <span class="read-more">Read More →</span>
            </div>
        `).join('')
        html += `</div>`
    }

    dynamicSection.innerHTML = html
}

// ============================================
// OPEN SINGLE POST
// ============================================
function openPost(postId) {
    const post = allPosts.find(p => p.id === postId)
    if (!post) return

    currentPostId = postId

    // Hide posts list
    document.getElementById('dynamic-posts').style.display = 'none'
    document.getElementById('static-posts').style.display = 'none'

    // Show single post view
    const singlePost = document.getElementById('single-post')
    singlePost.style.display = 'block'

    singlePost.innerHTML = `
        <button class="btn-back" onclick="closePost()">
            <i class="fa-solid fa-arrow-left"></i> Back to News
        </button>

        <article class="post-article">
            ${post.image_url
                ? `<div class="post-image">
                    <img src="${post.image_url}" alt="${post.title}">
                   </div>`
                : ''
            }
            <div class="post-header">
                <span class="news-tag">${post.category}</span>
                <p class="news-date">
                    <i class="fa-regular fa-calendar"></i>
                    ${new Date(post.created_at).toLocaleDateString('en-KE', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </p>
                <h1>${post.title}</h1>
            </div>
            <div class="post-content">
                ${post.content.split('\n').map(p => `<p>${p}</p>`).join('')}
            </div>
        </article>

        <!-- COMMENTS SECTION -->
        <section class="comments-section">
            <h2><i class="fa-solid fa-comments"></i> Comments</h2>

            <!-- Comment Form -->
            <div class="comment-form">
                <h3>Leave a Comment</h3>
                <div class="form-group">
                    <label>Email Address *</label>
                    <input type="email" id="comment-email" 
                        placeholder="your@email.com">
                </div>
                <div class="form-group">
                    <label>Comment *</label>
                    <textarea id="comment-text" rows="4" 
                        placeholder="Share your thoughts..."></textarea>
                </div>
                <button class="btn-primary" id="submit-comment-btn" 
                    onclick="submitComment('${postId}')">
                    <i class="fa-solid fa-paper-plane"></i> Post Comment
                </button>
                <p class="form-feedback" id="comment-feedback"></p>
            </div>

            <!-- Comments List -->
            <div id="comments-list"></div>
        </section>
    `

    loadComments(postId)
   document.querySelector('.page-hero').scrollIntoView({ behavior: 'smooth' })
}

function closePost() {
    document.getElementById('single-post').style.display = 'none'

    if (allPosts.length > 0) {
        document.getElementById('dynamic-posts').style.display = 'block'
    } else {
        document.getElementById('static-posts').style.display = 'block'
    }

    document.querySelector('.news-content').scrollIntoView({ behavior: 'smooth' })
}

// ============================================
// LOAD COMMENTS
// ============================================
async function loadComments(postId) {
    const list = document.getElementById('comments-list')
    list.innerHTML = '<p style="color:#666;">Loading comments...</p>'

    try {
        const { data, error } = await db
            .from('comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: false })

        if (error) throw error

        if (data.length === 0) {
            list.innerHTML = '<p style="color:#666; margin-top:16px;">No comments yet. Be the first to comment!</p>'
            return
        }

        list.innerHTML = data.map(c => `
            <div class="comment-card">
                <div class="comment-header">
                    <span class="comment-author">
                        <i class="fa-solid fa-circle-user"></i>
                        ${maskEmail(c.email)}
                    </span>
                    <span class="comment-time">
                        <i class="fa-regular fa-clock"></i>
                        ${new Date(c.created_at).toLocaleString('en-KE', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                </div>
                <p class="comment-body">${c.comment}</p>
            </div>
        `).join('')

    } catch (error) {
        console.error('Load comments error:', error)
        list.innerHTML = '<p style="color:#dc3545;">Failed to load comments.</p>'
    }
}

// ============================================
// SUBMIT COMMENT
// ============================================
async function submitComment(postId) {
    const email = document.getElementById('comment-email').value.trim()
    const comment = document.getElementById('comment-text').value.trim()
    const feedback = document.getElementById('comment-feedback')
    const btn = document.getElementById('submit-comment-btn')

    if (!email || !comment) {
        feedback.style.color = '#dc3545'
        feedback.textContent = 'Please enter your email and comment.'
        return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        feedback.style.color = '#dc3545'
        feedback.textContent = 'Please enter a valid email address.'
        return
    }

    btn.disabled = true
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Posting...'

    try {
        const { error } = await db
            .from('comments')
            .insert([{
                post_id: postId,
                email: email,
                comment: comment
            }])

        if (error) throw error

        feedback.style.color = '#28a745'
        feedback.textContent = '✅ Comment posted successfully!'

        document.getElementById('comment-email').value = ''
        document.getElementById('comment-text').value = ''

        await loadComments(postId)

    } catch (error) {
        console.error('Submit comment error:', error)
        feedback.style.color = '#dc3545'
        feedback.textContent = 'Something went wrong. Please try again.'
    } finally {
        btn.disabled = false
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Post Comment'
    }
}

// ============================================
// MASK EMAIL
// ============================================
function maskEmail(email) {
    const [user, domain] = email.split('@')
    const masked = user.substring(0, 2) + '****'
    return `${masked}@${domain}`
}

// ============================================
// EXPOSE FUNCTIONS
// ============================================
window.openPost = openPost
window.closePost = closePost
window.submitComment = submitComment

// Run on page load
loadNewsPosts()