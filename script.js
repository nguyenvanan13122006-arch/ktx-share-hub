/* ==================== 1. CẤU HÌNH FIREBASE CLOUD ==================== */
const firebaseConfig = {
    apiKey: "AIzaSyAa5CCY-1xWQ4f8YItYdSXPF0N3Mieoius",
    authDomain: "ktx-share-hub.firebaseapp.com",
    databaseURL: "https://ktx-share-hub-default-rtdb.firebaseio.com",
    projectId: "ktx-share-hub",
    storageBucket: "ktx-share-hub.firebasestorage.app",
    messagingSenderId: "348177839444",
    appId: "1:348177839444:web:dc719aac7bd2955a0ec4c1"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

/* ==================== 2. BIẾN TOÀN CỤC ==================== */
let users = []; let products = []; let orders = []; let cart = []; let reports = [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null; 
let orderIdCounter = 1000;
let currentReviewOrderId = null;

function parseFirebaseData(data) {
    if (!data) return [];
    let arr = Array.isArray(data) ? data : Object.values(data);
    return arr.filter(item => item !== null && item !== undefined);
}

/* ==================== 3. KẾT NỐI DỮ LIỆU ĐÁM MÂY ==================== */
database.ref('users').on('value', snapshot => {
    if (snapshot.exists()) users = parseFirebaseData(snapshot.val());
    if (currentUser) {
        let me = users.find(u => u && u.email === currentUser.email);
        if (me && me.locked) { alert("Tài khoản của bạn đã bị Khóa!"); handleLogout(); }
    }
    if (document.getElementById('admin-dashboard').style.display === 'block') { renderUserTable(); renderAdminDashboard(); }
});

database.ref('products').on('value', snapshot => {
    if (snapshot.exists()) products = parseFirebaseData(snapshot.val());
    if (document.getElementById('main-store').style.display === 'block') renderShop();
    if (document.getElementById('seller-dashboard').style.display === 'block') renderSellerDashboard();
    if (document.getElementById('admin-dashboard').style.display === 'block') { renderPendingTable(); renderAdminDashboard(); }
});

database.ref('orders').on('value', snapshot => {
    if (snapshot.exists()) {
        orders = parseFirebaseData(snapshot.val());
        orderIdCounter = 1000 + orders.length;
    } else orders = [];
    
    if (document.getElementById('admin-dashboard').style.display === 'block') { renderOrderTable(); renderAdminDashboard(); }
    if (document.getElementById('my-orders').style.display === 'block') renderMyOrders();
    if (document.getElementById('seller-dashboard').style.display === 'block') renderSellerDashboard();
    
    updateNotifications();
    renderShop();
});

database.ref('reports').on('value', snapshot => {
    if (snapshot.exists()) reports = parseFirebaseData(snapshot.val());
    else reports = [];
    if (document.getElementById('admin-dashboard').style.display === 'block') renderReportTable();
});

/* ==================== THÔNG BÁO CHUÔNG ==================== */
function toggleNotify() {
    const box = document.getElementById('notify-dropdown');
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
    if(box.style.display === 'block') document.getElementById('notify-count').style.display = 'none';
}

function updateNotifications() {
    if(!currentUser) return;
    const myOrders = orders.filter(o => o && (o.customerEmail === currentUser.email || o.sellerEmail === currentUser.email));
    const list = document.getElementById('notify-list');
    const count = document.getElementById('notify-count');
    if(!list || !count) return;

    const recentNoti = myOrders.slice(-5).reverse();
    if(recentNoti.length > 0) {
        count.textContent = recentNoti.length;
        count.style.display = 'block';
        list.innerHTML = recentNoti.map(o => `
            <div class="notify-item">
                <small style="color:var(--primary)">${o.orderId}</small><br>
                Trạng thái: <b>${o.status}</b>
            </div>
        `).join('');
    }
}

/* ==================== 4. ĐĂNG NHẬP & ĐĂNG KÝ (CÓ SĐT) ==================== */
function handleLogin(event) {
    event.preventDefault();
    // Lấy dữ liệu người dùng nhập (có thể là Email hoặc SĐT)
    const loginInput = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    
    // TÌM KIẾM THÔNG MINH: So sánh trùng Email HOẶC trùng SĐT
    const user = users.find(u => u && (u.email === loginInput || u.phone === loginInput) && u.pass === password);
    
    if (user) {
        if(user.locked) return showNotification('Tài khoản của bạn đã bị Khóa!', 'error');
        currentUser = user; localStorage.setItem('currentUser', JSON.stringify(user));
        showNotification('Chào mừng ' + user.name + '! 🎉', 'success');
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-content').style.display = 'block';
        document.getElementById('user-display').style.display = 'flex';
        document.getElementById('user-name').textContent = user.name;
        updateNavButtons();
        showSection((user.role === 'Admin') ? 'admin-dashboard' : 'main-store');
    } else showNotification('Email/SĐT hoặc mật khẩu không đúng!', 'error');
}
function handleSignUp(event) {
    event.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const mssv = document.getElementById('reg-mssv').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const room = document.getElementById('reg-room').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-pass').value;

    // 1. Kiểm tra định dạng SĐT (10 số)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) return showNotification('Số điện thoại phải bao gồm 10 chữ số!', 'error');

    // 2. Kiểm tra email trường DAU
    if (!email.endsWith('@dau.edu.vn')) {
        return showNotification('Vui lòng sử dụng email sinh viên Kiến trúc (@dau.edu.vn)!', 'error');
    }
    
    // 3. Kiểm tra trùng lặp (Email, MSSV, HOẶC SĐT)
    if (users.find(u => u && (u.email === email || u.mssv === mssv || u.phone === phone))) {
        return showNotification('Email, MSSV hoặc Số điện thoại đã tồn tại!', 'error');
    }
    
    users.push({ email, phone, pass: password, name, role: 'Student', mssv, room, rating: 5.0, locked: false, joinDate: new Date().toLocaleDateString('vi-VN') });
    database.ref('users').set(users);
    showNotification('Đăng ký thành công!', 'success');
    switchTab('login'); event.target.reset();
}

function handleAdminLogin(event) {
    event.preventDefault();
    const email = document.getElementById('admin-email').value.trim().toLowerCase();
    const password = document.getElementById('admin-pass').value;
    const admin = users.find(u => u && u.email === email && u.pass === password && u.role === 'Admin');
    if (admin) {
        currentUser = admin; localStorage.setItem('currentUser', JSON.stringify(admin));
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-content').style.display = 'block';
        document.getElementById('user-display').style.display = 'flex';
        document.getElementById('user-name').textContent = admin.name;
        updateNavButtons(); showSection('admin-dashboard');
    } else showNotification('Sai thông tin Quản lý!', 'error');
}

function goToLogin() { document.getElementById('app-content').style.display = 'none'; document.getElementById('login-screen').style.display = 'block'; }
function handleLogout() { if (confirm('Đăng xuất khỏi hệ thống?')) { currentUser = null; cart = []; localStorage.removeItem('currentUser'); location.reload(); } }

/* ==================== 5. ĐIỀU HƯỚNG & BỘ LỌC ==================== */
function switchTab(type) {
    document.getElementById('login-form').style.display = type === 'login' ? 'block' : 'none';
    document.getElementById('signup-form').style.display = type === 'signup' ? 'block' : 'none';
    document.getElementById('tab-login').classList.toggle('active', type === 'login');
    document.getElementById('tab-signup').classList.toggle('active', type === 'signup');
    document.getElementById('admin-form-container').style.display = 'none';
    document.getElementById('user-tabs').style.display = 'flex';
}
function showAdminForm() { switchTab(''); document.getElementById('user-tabs').style.display = 'none'; document.getElementById('admin-form-container').style.display = 'block'; }
function backToUserLogin() { switchTab('login'); }

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
    if (sectionId === 'main-store') renderShop();
    else if (sectionId === 'cart-page') renderCart();
    else if (sectionId === 'seller-dashboard') renderSellerDashboard();
    else if (sectionId === 'admin-dashboard') renderAdminDashboard();
    else if (sectionId === 'my-orders') renderMyOrders();
}

function updateNavButtons() {
    const isStudent = currentUser && currentUser.role === 'Student';
    document.getElementById('nav-seller').style.display = isStudent ? 'inline-flex' : 'none';
    document.getElementById('nav-my-orders').style.display = isStudent ? 'inline-flex' : 'none';
    document.getElementById('nav-admin').style.display = (currentUser && currentUser.role === 'Admin') ? 'inline-flex' : 'none';
    document.getElementById('nav-login').style.display = currentUser ? 'none' : 'inline-flex';
}

function getCategory(p) { return p.category || 'Giải trí'; }
function filterCategory(cat, btn) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active');
    renderShop(cat === 'All' ? products : products.filter(p => p && getCategory(p) === cat));
}
function searchProducts() {
    var kw = document.getElementById('txtSearch').value.trim().toLowerCase();
    renderShop(kw ? products.filter(p => p && p.name.toLowerCase().includes(kw)) : products);
}

/* ==================== 6. HIỂN THỊ CỬA HÀNG ==================== */
function renderShop(list = products) {
    const container = document.getElementById('product-list'); if (!container) return;
    let approvedList = list.filter(p => p && p.status === 'approved').sort((a, b) => (b.pinned||0) - (a.pinned||0));
    
    container.innerHTML = approvedList.map(p => {
        const isRenting = orders.some(o => o.items && o.items.some(item => item.id === p.id) && ['Đã duyệt - Chờ nhận đồ', 'Đang thuê', 'Đã trả đồ - Chờ Admin chốt'].includes(o.status));

        let displayImg = (p.image && p.image.startsWith('http')) ? `<img src="${p.image}">` : `<span>${p.image || '📦'}</span>`;
        let stars = '⭐'.repeat(Math.round(p.rating || 5)); let rCount = p.reviews ? p.reviews.length : 0;
        let pinBadge = p.pinned > 0 ? '<div class="badge-hot"><i class="fa fa-fire"></i> Đã Ghim</div>' : '';
        
        let actionBtn = isRenting
            ? `<button class="btn-cart" style="background:#475569; cursor:not-allowed;" disabled>Đang cho thuê</button>`
            : `<button class="btn-cart" onclick="addToCart(${p.id})">Thuê ngay</button>`;

        return `
        <div class="product-card" style="${isRenting ? 'opacity:0.7;' : ''}">
            ${pinBadge}
            <div class="product-img" style="position:relative;">
                ${displayImg}
                ${isRenting ? '<div style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; border-radius:10px;">ĐANG CHO THUÊ</div>' : ''}
            </div>
            <h3>${p.name}</h3>
            <p style="font-size: 0.8rem; color: #ffb400; cursor:pointer; margin-bottom:5px;" onclick="openReviewModal(${p.id})">${stars} <span style="color:var(--text-gray)">(${rCount})</span></p>
            <p style="color:var(--primary); font-weight:800;">${formatCurrency(p.rentPrice)}/ngày</p>
            <p style="font-size: 0.85rem; color: var(--text-gray); margin-bottom: 10px;">Cọc: ${formatCurrency(p.deposit)}</p>
            ${actionBtn}
        </div>`;
    }).join('');
}

/* ==================== 7. ĐÁNH GIÁ (RATING) ==================== */
function openReviewModal(id, orderId = null) {
    currentReviewOrderId = orderId;
    const product = products.find(p => p && p.id === id); if (!product) return;
    document.getElementById('review-product-id').value = id;
    let displayImg = (product.image && product.image.startsWith('http')) ? `<img src="${product.image}" style="width:80px; height:80px; object-fit:cover; border-radius:10px;">` : `<span style="font-size:3rem;">📦</span>`;
    document.getElementById('review-product-info').innerHTML = `<div style="margin-bottom: 10px; display:flex; justify-content:center;">${displayImg}</div><h4 style="color: var(--primary); font-size: 1.2rem; text-align:center;">${product.name}</h4>`;
    
    const listContainer = document.getElementById('review-list'); let reviews = product.reviews || [];
    if(reviews.length === 0) listContainer.innerHTML = '<p style="color:var(--text-gray); text-align:center; padding:10px;">Chưa có đánh giá nào.</p>';
    else listContainer.innerHTML = reviews.sort((a,b)=>b.ts-a.ts).map(r=>`<div style="background:rgba(255,255,255,0.05); padding:15px; margin-bottom:8px; border-radius:12px; color:white; border: 1px solid var(--glass-border);"><div style="display:flex;justify-content:space-between; margin-bottom: 5px;"><b style="color:var(--secondary);font-size:0.95rem;"><i class="fa fa-user-circle"></i> ${r.user}</b><span style="color:#ffb400;font-size:0.85rem;">${'⭐'.repeat(r.rating)}</span></div><p style="font-size:0.9rem; color: var(--text-white);">${r.cmt}</p></div>`).join('');

    document.getElementById('review-modal').style.display = 'flex';
}

function submitReview(e) {
    e.preventDefault();
    if (!currentUser) return showNotification('Đăng nhập để bình luận nhé!', 'error');
    const id = parseInt(document.getElementById('review-product-id').value);
    const product = products.find(p => p && p.id === id);
    if (!product.reviews) product.reviews = [];
    
    let rate = parseInt(document.getElementById('review-rating').value) || 5;
    product.reviews.push({ user: currentUser.name, rating: rate, cmt: document.getElementById('review-comment').value.trim(), ts: Date.now() });
    product.rating = product.reviews.reduce((s,r)=>s+r.rating,0) / product.reviews.length;
    database.ref('products').set(products);
    
    if (currentReviewOrderId) {
        let orderToUpdate = orders.find(o => o && o.orderId === currentReviewOrderId);
        if (orderToUpdate) {
            orderToUpdate.isReviewed = true;
            database.ref('orders').set(orders);
        }
        currentReviewOrderId = null;
    }
    
    showNotification('Cảm ơn bạn đã đánh giá!', 'success');
    document.getElementById('review-modal').style.display = 'none'; document.getElementById('review-comment').value = '';
}

/* ==================== 8. GIỎ HÀNG & THANH TOÁN ==================== */
function renderCart() {
    const container = document.getElementById('cart-items'), empty = document.getElementById('cart-empty');
    if (!container) return;
    if (cart.length === 0) { container.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    
    var totalRent = 0, totalDeposit = 0;
    container.innerHTML = cart.map((item, i) => {
        totalRent += item.rentPrice; totalDeposit += item.deposit;
        let displayImg = (item.image && item.image.startsWith('http')) ? `<img src="${item.image}" style="width:40px; height:40px; object-fit:cover; border-radius:8px;">` : `<span>📦</span>`;
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:15px;border-bottom:1px solid var(--glass-border);"><div style="display:flex;align-items:center;gap:15px;">${displayImg}<div><h4>${item.name}</h4><p style="font-size:0.85rem; color:var(--text-gray);">Giá: ${formatCurrency(item.rentPrice)} | Cọc: ${formatCurrency(item.deposit)}</p></div></div><button onclick="removeFromCart(${i})" style="background:rgba(255,77,77,0.2);border:none;padding:8px 12px;border-radius:8px;color:#ff4d4d;cursor:pointer;"><i class="fa fa-trash"></i></button></div>`;
    }).join('');
    
    container.innerHTML += `<div style="margin-top:20px;padding-top:20px;border-top:2px solid var(--glass-border);text-align:right;"><h4 style="color:var(--text-gray);">Tổng cọc: ${formatCurrency(totalDeposit)}</h4><h3 style="color:var(--primary); margin-top:5px;">Cần thanh toán: ${formatCurrency(totalRent + totalDeposit)}</h3><button class="btn-primary" style="margin-top:15px;" onclick="checkout()"><i class="fa fa-handshake"></i> Gửi Yêu Cầu Thuê</button></div>`;
}

function addToCart(id) {
    if (!currentUser) return showNotification('Đăng nhập để thuê đồ nhé!', 'error');
    var p = products.find(x => x && x.id === id);
    if(p.sellerEmail === currentUser.email) return showNotification('Bạn không thể tự thuê đồ của mình!', 'error');
    
    cart.push({ id: p.id, name: p.name, rentPrice: p.rentPrice, deposit: p.deposit, image: p.image, sellerEmail: p.sellerEmail });
    document.getElementById('cart-count').textContent = cart.length;
    showNotification(`Đã chọn "${p.name}"!`, 'success');
}
function removeFromCart(i) { cart.splice(i, 1); document.getElementById('cart-count').textContent = cart.length; renderCart(); }

function checkout() {
    if (confirm(`Xác nhận gửi yêu cầu thuê các món đồ trong giỏ hàng?`)) {
        let ordersBySeller = {};
        cart.forEach(item => {
            if(!ordersBySeller[item.sellerEmail]) ordersBySeller[item.sellerEmail] = [];
            ordersBySeller[item.sellerEmail].push(item);
        });

        for (let seller in ordersBySeller) {
            let items = ordersBySeller[seller];
            let tRent = items.reduce((s, i) => s + i.rentPrice, 0);
            let tDep = items.reduce((s, i) => s + i.deposit, 0);
            
            orders.push({
                orderId: 'GD-' + (++orderIdCounter),
                customerName: currentUser.name, customerEmail: currentUser.email,
                sellerEmail: seller, 
                items: items, totalRent: tRent, totalDeposit: tDep, 
                commision: tRent * 0.1, 
                status: 'Chờ Admin duyệt', 
                isReviewed: false,
                orderDateRaw: new Date().getTime(), date: new Date().toLocaleString('vi-VN')
            });
        }
        database.ref('orders').set(orders);
        showNotification('Đã gửi yêu cầu! Vui lòng chờ Admin xét duyệt.', 'success');
        cart = []; document.getElementById('cart-count').textContent = 0; showSection('my-orders');
    }
}

/* ==================== 9. QUY TRÌNH LUÂN CHUYỂN ĐƠN HÀNG ==================== */
window.updateOrderStatus = function(orderId, newStatus) {
    let o = orders.find(x => x && x.orderId === orderId);
    if(o) {
        o.status = newStatus;
        database.ref('orders').set(orders);
        showNotification(`Đã cập nhật trạng thái: ${newStatus}`, 'success');
    }
}

function renderMyOrders() {
    const container = document.getElementById('my-orders-list'); if (!container) return;
    let myOrders = orders.filter(o => o && o.customerEmail === currentUser.email).sort((a,b)=>b.orderDateRaw-a.orderDateRaw);
    if (myOrders.length === 0) return container.innerHTML = '<div class="empty-state"><i class="fa fa-box-open"></i><p>Bạn chưa có giao dịch nào.</p></div>';

    container.innerHTML = myOrders.map(o => {
        let actionBtn = '';
        if(o.status === 'Chờ Admin duyệt') actionBtn = '<button class="btn-nav" disabled>⏳ Đang chờ Admin duyệt đơn...</button>';
        else if(o.status === 'Đã duyệt - Chờ nhận đồ') actionBtn = `<button class="btn-primary" onclick="updateOrderStatus('${o.orderId}', 'Đang thuê')"><i class="fa fa-box-open"></i> Tôi Đã nhận đồ</button>`;
        else if(o.status === 'Đang thuê') actionBtn = `<button class="btn-primary" onclick="updateOrderStatus('${o.orderId}', 'Đã trả đồ - Chờ Admin chốt')"><i class="fa fa-undo"></i> Tôi Đã trả đồ</button>`;
        else if(o.status === 'Đã trả đồ - Chờ Admin chốt') actionBtn = '<button class="btn-nav" disabled>⏳ Chờ Admin chốt giao dịch...</button>';
        else if(o.status === 'Hoàn tất') {
            let reviewBtn = o.isReviewed 
                ? `<button class="btn-nav" disabled style="color:var(--secondary); border-color:var(--secondary);"><i class="fa fa-check-circle"></i> Đã đánh giá</button>` 
                : `<button class="btn-primary" style="background:var(--secondary);" onclick="openReviewModal(${o.items[0].id}, '${o.orderId}')"><i class="fa fa-star"></i> Đánh giá Chủ đồ</button>`;
            
            actionBtn = `${reviewBtn} <button class="btn-nav" style="color:#ff4d4d; border-color:#ff4d4d;" onclick="openReportModal('${o.orderId}')"><i class="fa fa-flag"></i> Báo cáo</button>`;
        }
        else if(o.status === 'Đã hủy') actionBtn = '<span style="color:#ff4d4d;">Đơn hàng đã bị hủy</span>';

        return `
        <div style="background:var(--glass-bg); padding:20px; border-radius:16px; margin-bottom:15px; border:1px solid var(--glass-border);">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--glass-border); padding-bottom:10px; margin-bottom:10px;">
                <h4>Mã GD: <span style="color:var(--primary)">${o.orderId}</span></h4>
                <b style="color:var(--secondary)">${o.status}</b>
            </div>
            <p style="margin-bottom:5px;">Sản phẩm: <b>${o.items.map(i=>i.name).join(', ')}</b></p>
            <p style="color:var(--text-gray); font-size:0.9rem;">Tổng tiền: ${formatCurrency(o.totalRent + o.totalDeposit)} (Cọc: ${formatCurrency(o.totalDeposit)})</p>
            <div style="margin-top:15px;">${actionBtn}</div>
        </div>`;
    }).join('');
}

function renderSellerDashboard() {
    const pContainer = document.getElementById('seller-product-list');
    if (pContainer) {
        let myItems = products.filter(p => p && p.sellerEmail === currentUser.email);
        if (myItems.length === 0) pContainer.innerHTML = '<div class="empty-state"><p>Bạn chưa đăng đồ nào.</p></div>';
        else pContainer.innerHTML = myItems.map(p => {
            let displayImg = (p.image && p.image.startsWith('http')) ? `<img src="${p.image}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">` : `<span style="font-size:3rem;">📦</span>`;
            
            let statusColor = p.status === 'pending' ? 'orange' : (p.status === 'rejected' ? '#ff4d4d' : 'var(--secondary)');
            let statusText = p.status === 'pending' ? 'Đang chờ duyệt' : (p.status === 'rejected' ? 'Bị từ chối' : 'Đang cho thuê');

            return `<div class="product-card" style="border-color:${statusColor}">
                <div class="product-img">${displayImg}</div>
                <h3>${p.name}</h3>
                <p style="color:var(--primary); font-weight:700;">${formatCurrency(p.rentPrice)}/ngày</p>
                <p style="font-size:0.85rem; margin-bottom:10px;">Trạng thái: <b style="color:${statusColor}">${statusText}</b></p>
                <button onclick="openProductDetailModal(${p.id})" style="background:rgba(255,255,255,0.1); border:1px solid var(--glass-border); width:100%; padding:10px; border-radius:8px; color:white; cursor:pointer; font-weight:bold; transition:0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'"><i class="fa fa-info-circle"></i> Chi tiết & Xóa</button>
            </div>`;
        }).join('');
    }

    const oContainer = document.getElementById('seller-orders-list');
    if(oContainer) {
        let incomingOrders = orders.filter(o => o && o.sellerEmail === currentUser.email).sort((a,b)=>b.orderDateRaw-a.orderDateRaw);
        if(incomingOrders.length === 0) oContainer.innerHTML = '<p style="color:var(--text-gray);">Chưa có ai thuê đồ của bạn.</p>';
        else oContainer.innerHTML = incomingOrders.map(o => {
            let actionBtn = '';
            if(o.status === 'Chờ Admin duyệt') actionBtn = '<span style="color:var(--text-gray)"><i class="fa fa-clock"></i> Đang chờ Admin duyệt đơn...</span>';
            else if(o.status === 'Đã duyệt - Chờ nhận đồ') actionBtn = '<span style="color:var(--primary)"><i class="fa fa-handshake"></i> Admin đã duyệt! Hãy giao đồ cho khách.</span>';
            else if(o.status === 'Đang thuê') actionBtn = '<span style="color:var(--primary)"><i class="fa fa-user-check"></i> Khách đang sử dụng đồ của bạn</span>';
            else if(o.status === 'Đã trả đồ - Chờ Admin chốt') actionBtn = '<span style="color:var(--secondary)"><i class="fa fa-box"></i> Khách báo đã trả đồ. Chờ Admin chốt sổ!</span>';
            else if(o.status === 'Hoàn tất') actionBtn = '<span style="color:var(--secondary)"><i class="fa fa-check-circle"></i> Giao dịch hoàn tất!</span>';
            else if(o.status === 'Đã hủy') actionBtn = '<span style="color:#ff4d4d;">Đơn đã bị hủy</span>';

            return `<div style="background:rgba(0,0,0,0.2); padding:15px; border-radius:12px; margin-bottom:10px; border:1px solid var(--glass-border);">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;"><b style="color:var(--primary);">${o.orderId}</b><span style="color:var(--secondary); font-weight:bold;">${o.status}</span></div>
                <p><b>Khách hàng:</b> ${o.customerName} (${o.customerEmail})</p><p><b>Sản phẩm:</b> ${o.items.map(i=>i.name).join(', ')}</p>
                <div style="margin-top:15px;">${actionBtn}</div>
            </div>`;
        }).join('');
    }
}

/* ==================== 10. XỬ LÝ ĐĂNG BÀI MỚI ==================== */
function openProductModal() { document.getElementById('product-modal').style.display = 'flex'; }
function closeProductModal() { document.getElementById('product-modal').style.display = 'none'; document.getElementById('product-form').reset(); let preview = document.getElementById('image-preview-container'); if(preview) preview.style.display = 'none'; }
function previewImage(url) { const container = document.getElementById('image-preview-container'), img = document.getElementById('image-preview'); if (url && url.startsWith('http')) { img.src = url; container.style.display = 'block'; } else { container.style.display = 'none'; } }

function handleSaveProduct(e) {
    e.preventDefault(); 
    const name = document.getElementById('p-name').value.trim();
    const category = document.getElementById('p-category').value; 
    const imageLink = document.getElementById('p-image').value.trim();
    const rent = parseFloat(document.getElementById('p-rent').value);
    const deposit = parseFloat(document.getElementById('p-deposit').value);
    const pinned = parseFloat(document.getElementById('p-pin') ? document.getElementById('p-pin').value : 0);
    
    products.push({
        id: Date.now(), name: name, category: category, image: imageLink, rentPrice: rent, deposit: deposit,
        sellerEmail: currentUser.email, status: 'pending', pinned: pinned, rating: 5.0, reviews: []
    });
    
    database.ref('products').set(products); 
    showNotification('Đã gửi bài! Admin sẽ duyệt sớm nhé.', 'success');
    closeProductModal(); 
}

/* ==================== 11. BÁO CÁO VI PHẠM ==================== */
function openReportModal(orderId) {
    document.getElementById('report-product-id').value = orderId; 
    document.getElementById('report-modal').style.display = 'flex';
}

function submitReport(e) {
    e.preventDefault();
    const orderId = document.getElementById('report-product-id').value;
    const reason = document.getElementById('report-reason').value;
    const detail = document.getElementById('report-detail').value.trim();

    reports.push({
        id: Date.now(), orderId: orderId, reporterEmail: currentUser.email, reporterName: currentUser.name,
        reason: reason, detail: detail, date: new Date().toLocaleDateString('vi-VN'), status: 'Chờ xử lý'
    });

    database.ref('reports').set(reports);
    showNotification('Đã gửi báo cáo vi phạm đến Admin!', 'success');
    document.getElementById('report-modal').style.display = 'none';
    e.target.reset();
}

function renderReportTable() {
    const tbody = document.getElementById('admin-reports-table-body');
    if (!tbody) return;
    if (reports.length === 0) return tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Chưa có báo cáo vi phạm nào</td></tr>';

    tbody.innerHTML = reports.sort((a,b)=>b.id-a.id).map(r => {
        let statusBadge = r.status === 'Chờ xử lý' 
            ? `<span style="color:orange;"><i class="fa fa-clock"></i> Chờ xử lý</span> <button onclick="resolveReport(${r.id})" style="margin-left:10px; padding:3px 8px; background:var(--secondary); color:white; border:none; border-radius:5px; cursor:pointer;">Đã giải quyết</button>` 
            : `<span style="color:var(--secondary);"><i class="fa fa-check"></i> Đã giải quyết</span>`;

        return `<tr><td>${r.date}</td><td><b>${r.reporterName}</b><br><small style="color:var(--text-gray)">${r.reporterEmail}</small></td><td style="color:var(--primary); font-weight:bold;">${r.orderId}</td><td><b>${r.reason}</b><br><small style="color:var(--text-gray)">${r.detail}</small></td><td>${statusBadge}</td></tr>`;
    }).join('');
}

function resolveReport(id) {
    let r = reports.find(x => x && x.id === id);
    if (r) { r.status = 'Đã giải quyết'; database.ref('reports').set(reports); showNotification('Đã đánh dấu giải quyết báo cáo!', 'success'); }
}

/* ==================== 12. ADMIN: KIỂM DUYỆT & DOANH THU ==================== */
function switchAdminTab(id) { document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.remove('active')); document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active')); document.getElementById(id).classList.add('active'); event.target.classList.add('active'); }

function renderAdminDashboard() {
    const sv = users.filter(u => u && u.role === 'Student');
    const totalCommision = orders.filter(o => o && o.status === 'Hoàn tất').reduce((sum, o) => sum + (parseFloat(o.commision) || 0), 0);
    const totalPinFee = products.reduce((sum, p) => sum + (parseFloat(p && p.pinned) || 0), 0);
    
    document.getElementById('admin-users').textContent = sv.length; 
    document.getElementById('admin-products').textContent = products.length;
    document.getElementById('admin-orders').textContent = orders.length; 
    document.getElementById('admin-revenue').textContent = formatCurrency(totalCommision + totalPinFee);
    
    renderPendingTable(); 
    renderHistoryTable();
    renderOrderTable(); 
    renderUserTable(); 
    renderReportTable(); 
}

function renderPendingTable() {
    const tbody = document.getElementById('admin-pending-table-body');
    let pending = products.filter(p => p && p.status === 'pending');
    if(pending.length === 0) return tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Không có bài chờ duyệt</td></tr>';
    
    tbody.innerHTML = pending.map(p => {
        let displayImg = (p.image && p.image.startsWith('http')) 
            ? `<img src="${p.image}" style="width:60px; height:60px; object-fit:cover; border-radius:8px; border:1px solid var(--glass-border);">` 
            : `<span style="font-size:2rem;">📦</span>`;

        return `<tr>
            <td>${users.find(u=>u && u.email===p.sellerEmail)?.name || 'Ẩn danh'}</td>
            <td>${displayImg}</td>
            <td style="font-weight:bold;">${p.name}</td>
            <td style="color:var(--primary);">${formatCurrency(p.rentPrice)}</td>
            <td>${formatCurrency(p.deposit)}</td>
            <td>${p.pinned > 0 ? formatCurrency(p.pinned) : 'Thường'}</td>
            <td>
                <button onclick="approvePost(${p.id})" style="background:var(--secondary);border:none;padding:6px 12px;border-radius:6px;color:white;cursor:pointer;margin-right:5px;font-weight:bold;" title="Duyệt bài"><i class="fa fa-check"></i> Duyệt</button>
                <button onclick="rejectPost(${p.id})" style="background:#ff4d4d;border:none;padding:6px 12px;border-radius:6px;color:white;cursor:pointer;font-weight:bold;" title="Từ chối bài"><i class="fa fa-times"></i> Từ chối</button>
            </td>
        </tr>`;
    }).join('');
}

function renderHistoryTable() {
    const tbody = document.getElementById('admin-history-table-body');
    if (!tbody) return;
    
    let history = products.filter(p => p && (p.status === 'approved' || p.status === 'rejected'));
    if(history.length === 0) return tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Chưa có lịch sử kiểm duyệt</td></tr>';
    
    tbody.innerHTML = history.sort((a,b)=>b.id-a.id).map(p => {
        let displayImg = (p.image && p.image.startsWith('http')) 
            ? `<img src="${p.image}" style="width:50px; height:50px; object-fit:cover; border-radius:8px;">` 
            : `<span style="font-size:1.5rem;">📦</span>`;
            
        let statusBadge = p.status === 'approved' 
            ? `<span style="color:var(--secondary); font-weight:bold;"><i class="fa fa-check-circle"></i> Đã duyệt</span>` 
            : `<span style="color:#ff4d4d; font-weight:bold;"><i class="fa fa-times-circle"></i> Bị từ chối</span>`;

        return `<tr>
            <td>${users.find(u=>u && u.email===p.sellerEmail)?.name || 'Ẩn danh'}</td>
            <td>${displayImg}</td>
            <td style="font-weight:bold;">${p.name}</td>
            <td style="color:var(--primary);">${formatCurrency(p.rentPrice)}</td>
            <td>${statusBadge}</td>
            <td>
                <button onclick="openProductDetailModal(${p.id})" style="background:rgba(255,255,255,0.1); border:1px solid var(--glass-border); padding:6px 12px; border-radius:6px; color:white; cursor:pointer; font-weight:bold; transition:0.3s;" onmouseover="this.style.background='var(--primary)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'"><i class="fa fa-eye"></i> Chi tiết</button>
            </td>
        </tr>`;
    }).join('');
}

window.approvePost = function(id) { 
    let p = products.find(x=>x && x.id===id);
    if(p) {
        p.status = 'approved'; 
        database.ref('products').set(products); 
        showNotification('Đã duyệt bài đăng lên Sàn!', 'success'); 
    }
}

window.rejectPost = function(id) { 
    let p = products.find(x=>x && x.id===id);
    if(p) {
        p.status = 'rejected'; 
        database.ref('products').set(products); 
        showNotification('Đã từ chối bài đăng!', 'error'); 
    }
}

function renderOrderTable() {
    const tbody = document.getElementById('admin-orders-table-body');
    if (orders.length === 0) return tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Chưa có giao dịch</td></tr>';
    tbody.innerHTML = orders.sort((a,b)=>b.orderDateRaw-a.orderDateRaw).map(o => {
        let actionBtn = '';
        if (o.status === 'Chờ Admin duyệt') {
            actionBtn = `<button onclick="updateOrderStatus('${o.orderId}', 'Đã duyệt - Chờ nhận đồ')" style="background:var(--secondary);border:none;padding:6px 10px;border-radius:6px;color:white;cursor:pointer;margin-right:5px;" title="Duyệt đơn"><i class="fa fa-check"></i> Duyệt</button> <button onclick="updateOrderStatus('${o.orderId}', 'Đã hủy')" style="background:#ff4d4d;border:none;padding:6px 10px;border-radius:6px;color:white;cursor:pointer;" title="Từ chối"><i class="fa fa-times"></i> Hủy</button>`;
        } 
        else if (o.status === 'Đã trả đồ - Chờ Admin chốt') {
            actionBtn = `<button onclick="updateOrderStatus('${o.orderId}', 'Hoàn tất')" style="background:var(--secondary);border:none;padding:6px 10px;border-radius:6px;color:white;cursor:pointer;" title="Chốt giao dịch, nhận hoa hồng"><i class="fa fa-check-circle"></i> Chốt đơn</button>`;
        }
        else if (o.status === 'Hoàn tất' || o.status === 'Đã hủy') {
            actionBtn = `<span style="color:var(--text-gray); font-size:0.85rem;"><i class="fa fa-lock"></i> Đã chốt</span>`;
        } else {
            actionBtn = `<button onclick="updateOrderStatus('${o.orderId}', 'Đã hủy')" style="background:#ff4d4d;border:none;padding:6px 10px;border-radius:6px;color:white;cursor:pointer;" title="Hủy ngang"><i class="fa fa-times"></i> Hủy</button>`;
        }

        return `<tr><td style="color:var(--primary); font-weight:bold;">${o.orderId}</td><td>${o.customerName}</td><td>${o.items.map(i=>i.name).join(', ')}</td><td>${formatCurrency(o.totalDeposit)}</td><td style="color:var(--secondary); font-weight:bold;">+${formatCurrency(o.commision)}</td><td><span style="padding:4px 8px; background:rgba(255,255,255,0.05); border-radius:8px; font-size:0.85rem;">${o.status}</span></td><td>${actionBtn}</td></tr>`;
    }).join('');
}

function renderUserTable() {
    const tbody = document.getElementById('admin-users-table-body');
    let sv = users.filter(u => u && u.role === 'Student');
    if (sv.length === 0) return tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Chưa có sinh viên nào</td></tr>';

    tbody.innerHTML = sv.map(u => {
        let history = orders.filter(o => o && o.customerEmail === u.email).length;
        let btnLock = u.locked ? `<button onclick="toggleLock('${u.email}')" style="background:none;color:var(--secondary);border:none;cursor:pointer;font-size:1.2rem;" title="Mở khóa tài khoản"><i class="fa fa-unlock"></i></button>` : `<button onclick="toggleLock('${u.email}')" style="background:none;color:#ff4d4d;border:none;cursor:pointer;font-size:1.2rem;" title="Khóa tài khoản"><i class="fa fa-lock"></i></button>`;
        return `<tr style="${u.locked ? 'opacity:0.5;' : ''}"><td style="font-weight:bold;">${u.mssv}</td><td><div><b>${u.name}</b><br><small style="color:var(--text-gray)">${u.email}</small></div></td><td>${u.room}</td><td>${history} lần thuê</td><td style="color:#ffb400;">${'⭐'.repeat(Math.round(u.rating || 5))}</td><td>${btnLock}</td></tr>`;
    }).join('');
}

function toggleLock(email) { let u = users.find(x => x && x.email === email); if(u) { u.locked = !u.locked; database.ref('users').set(users); showNotification(u.locked ? 'Đã khóa tài khoản!' : 'Đã mở khóa tài khoản!', 'info'); } }

/* ==================== 14. XUẤT EXCEL KẾ TOÁN ==================== */
function exportRevenueReport() {
    if (orders.length === 0) return showNotification('Hệ thống chưa có giao dịch nào để xuất!', 'error');
    let csvContent = "Mã Giao Dịch,Ngày Giờ,Người Thuê,Chủ Đồ,Sản Phẩm,Tổng Tiền Thuê,Tổng Cọc,Hoa Hồng Sàn (10%),Trạng Thái\n";
    
    orders.sort((a,b)=>a.orderDateRaw-b.orderDateRaw).forEach(o => {
        let items = `"${o.items.map(i => i.name).join(' + ')}"`; 
        let rent = o.totalRent || 0; let dep = o.totalDeposit || 0; let comm = o.commision || 0; let status = o.status;
        csvContent += `${o.orderId},"${o.date}",${o.customerName},${o.sellerEmail},${items},${rent},${dep},${comm},${status}\n`;
    });
    
    let totalProfit = orders.filter(o => o && o.status === 'Hoàn tất').reduce((sum, o) => sum + (parseFloat(o.commision) || 0), 0);
    let totalPin = products.reduce((sum, p) => sum + (parseFloat(p && p.pinned) || 0), 0);
    csvContent += `\n,,,,,,,TỔNG LỢI NHUẬN SÀN (VNĐ):,"${formatCurrency(totalProfit + totalPin)}"\n`;
    
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); const url = URL.createObjectURL(blob);
    link.setAttribute("href", url); link.setAttribute("download", `Bao_Cao_Tai_Chinh_KTX_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    showNotification('Đã tải xuống Báo cáo Kế toán thành công!', 'success');
}

/* ==================== 13. TIỆN ÍCH & KHỞI CHẠY ==================== */
function showNotification(msg, type = 'info') { const c = document.getElementById('notification-container'); const n = document.createElement('div'); n.className = `notification ${type}`; n.innerHTML = `<span style="flex:1;">${msg}</span><button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;cursor:pointer;"><i class="fa fa-times"></i></button>`; c.appendChild(n); setTimeout(() => n.remove(), 4000); }
function formatCurrency(amt) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt || 0); }

/* ==================== XEM CHI TIẾT & XÓA BÀI ==================== */
window.openProductDetailModal = function(id) {
    const p = products.find(x => x && x.id === id);
    if(!p) return;
    
    let displayImg = (p.image && p.image.startsWith('http')) 
        ? `<img src="${p.image}" style="width:100%; height:220px; object-fit:cover; border-radius:12px; border:1px solid var(--glass-border); margin-bottom:15px;">` 
        : `<div style="width:100%; height:220px; background:#000; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:4rem; margin-bottom:15px;">📦</div>`;
        
    let u = users.find(x => x && x.email === p.sellerEmail);
    let sellerName = u ? u.name : 'Ẩn danh';
    let sellerRoom = u ? u.room : 'Không rõ';

    let content = `
        ${displayImg}
        <h2 style="color:white; margin-bottom:15px;">${p.name}</h2>
        <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:12px; margin-bottom:20px; font-size:0.95rem; line-height:1.8;">
            <p><b><i class="fa fa-tag" style="color:var(--text-gray)"></i> Danh mục:</b> ${p.category || 'Không xác định'}</p>
            <p><b><i class="fa fa-dollar-sign" style="color:var(--text-gray)"></i> Giá thuê:</b> <span style="color:var(--primary); font-weight:bold; font-size:1.1rem;">${formatCurrency(p.rentPrice)}/ngày</span></p>
            <p><b><i class="fa fa-shield-alt" style="color:var(--text-gray)"></i> Tiền cọc:</b> ${formatCurrency(p.deposit)}</p>
            <p><b><i class="fa fa-user" style="color:var(--text-gray)"></i> Người đăng:</b> ${sellerName} (Phòng: ${sellerRoom})</p>
        </div>
        <button onclick="deleteProduct(${p.id})" class="btn-primary-long" style="background:#ff4d4d; box-shadow:0 5px 15px rgba(239,68,68,0.3); width:100%;"><i class="fa fa-trash-alt"></i> XÓA BÀI ĐĂNG NÀY</button>
    `;
    
    document.getElementById('product-detail-content').innerHTML = content;
    document.getElementById('product-detail-modal').style.display = 'flex';
}

window.deleteProduct = function(id) {
    if(confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn bài đăng này không? Hành động này không thể hoàn tác!')) {
        const isRenting = orders.some(o => o.items && o.items.some(item => item.id === id) && ['Đã duyệt - Chờ nhận đồ', 'Đang thuê', 'Đã trả đồ - Chờ Admin chốt'].includes(o.status));
        if (isRenting) return showNotification('KHÔNG THỂ XÓA! Món đồ này đang giao dịch thuê.', 'error');

        products = products.filter(p => p && p.id !== id);
        database.ref('products').set(products);
        showNotification('Đã xóa bài đăng thành công!', 'success');
        document.getElementById('product-detail-modal').style.display = 'none';
        
        if (document.getElementById('admin-dashboard').style.display === 'block') { renderHistoryTable(); renderAdminDashboard(); } 
        else { renderSellerDashboard(); }
    }
}

window.onload = function() {
    if (currentUser) {
        document.getElementById('login-screen').style.display = 'none'; document.getElementById('app-content').style.display = 'block'; 
        document.getElementById('user-display').style.display = 'flex'; document.getElementById('user-name').textContent = currentUser.name;
        updateNavButtons(); showSection(currentUser.role === 'Admin' ? 'admin-dashboard' : 'main-store');
    } else {
        document.getElementById('login-screen').style.display = 'none'; document.getElementById('app-content').style.display = 'block';
        updateNavButtons(); showSection('main-store');
    }
};

window.handleLogin = handleLogin; window.handleSignUp = handleSignUp; window.handleAdminLogin = handleAdminLogin; window.switchTab = switchTab; window.showAdminForm = showAdminForm; window.backToUserLogin = backToUserLogin; window.showSection = showSection; window.addToCart = addToCart; window.removeFromCart = removeFromCart; window.searchProducts = searchProducts; window.filterCategory = filterCategory; window.handleLogout = handleLogout; window.switchAdminTab = switchAdminTab; window.checkout = checkout; window.goToLogin = goToLogin; window.openProductModal = openProductModal; window.closeProductModal = closeProductModal; window.handleSaveProduct = handleSaveProduct; window.openReviewModal = openReviewModal; window.submitReview = submitReview; window.toggleLock = toggleLock; window.previewImage = previewImage; window.openReportModal = openReportModal; window.submitReport = submitReport; window.resolveReport = resolveReport; window.renderReportTable = renderReportTable; window.exportRevenueReport = exportRevenueReport; window.toggleNotify = toggleNotify;