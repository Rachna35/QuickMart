let cart = JSON.parse(localStorage.getItem('cart')) || [];
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let partners = JSON.parse(localStorage.getItem('partners')) || [];

const GST_RATES = {
    groceries: 0.05, // 5%
    medicines: 0.05, // 5%
    stationery: 0.12 // 12%
};
const DELIVERY_CHARGE = 50.00; // Fixed ₹50

function generatePartnerId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id;
    do {
        id = '';
        for (let i = 0; i < 6; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (partners.some(p => p.id === id)); // Ensure uniqueness
    return id;
}

function addToCart(item, price, category) {
    cart.push({ item, price, category });
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${item} added to cart!`);
    updateCartSummary();
}

function updateCartSummary() {
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartGst = document.getElementById('cart-gst');
    const cartDelivery = document.getElementById('cart-delivery');

    if (cartCount && cartTotal) {
        const itemCount = cart.length;
        const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
        const gst = cart.reduce((sum, item) => sum + item.price * GST_RATES[item.category], 0);
        const delivery = cart.length > 0 ? DELIVERY_CHARGE : 0;
        const total = subtotal + gst + delivery;

        cartCount.textContent = itemCount;
        if (cartSubtotal) cartSubtotal.textContent = subtotal.toFixed(2);
        if (cartGst) cartGst.textContent = gst.toFixed(2);
        if (cartDelivery) cartDelivery.textContent = delivery.toFixed(2);
        cartTotal.textContent = total.toFixed(2);
    }
}

function displayCart() {
    const groceriesList = document.getElementById('groceries-list');
    const medicinesList = document.getElementById('medicines-list');
    const stationeryList = document.getElementById('stationery-list');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartGst = document.getElementById('cart-gst');
    const cartDelivery = document.getElementById('cart-delivery');
    const cartTotal = document.getElementById('cart-total');

    if (!groceriesList || !medicinesList || !stationeryList || !cartTotal) {
        console.error('Checkout elements missing');
        return;
    }

    groceriesList.innerHTML = '';
    medicinesList.innerHTML = '';
    stationeryList.innerHTML = '';

    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    const gst = cart.reduce((sum, item) => sum + item.price * GST_RATES[item.category], 0);
    const delivery = cart.length > 0 ? DELIVERY_CHARGE : 0;
    const total = subtotal + gst + delivery;

    const groceries = cart.filter(item => item.category === 'groceries');
    const medicines = cart.filter(item => item.category === 'medicines');
    const stationery = cart.filter(item => item.category === 'stationery');

    groceries.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.item}: ₹${item.price.toFixed(2)}`;
        groceriesList.appendChild(li);
    });

    medicines.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.item}: ₹${item.price.toFixed(2)}`;
        medicinesList.appendChild(li);
    });

    stationery.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.item}: ₹${item.price.toFixed(2)}`;
        stationeryList.appendChild(li);
    });

    if (cartSubtotal) cartSubtotal.textContent = subtotal.toFixed(2);
    if (cartGst) cartGst.textContent = gst.toFixed(2);
    if (cartDelivery) cartDelivery.textContent = delivery.toFixed(2);
    cartTotal.textContent = total.toFixed(2);

    document.getElementById('groceries').style.display = groceries.length ? 'block' : 'none';
    document.getElementById('medicines').style.display = medicines.length ? 'block' : 'none';
    document.getElementById('stationery').style.display = stationery.length ? 'block' : 'none';
}

function clearCart() {
    cart = [];
    localStorage.removeItem('cart');
    updateCartSummary();
    displayCart();
    alert('Cart cleared!');
}

function placeOrder() {
    const address = document.getElementById('address')?.value;
    const payment = document.getElementById('payment')?.value;

    if (!address || !payment) {
        alert('Please fill in the delivery address and select a payment method.');
        return;
    }

    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    const gst = cart.reduce((sum, item) => sum + item.price * GST_RATES[item.category], 0);
    const delivery = DELIVERY_CHARGE;
    const total = subtotal + gst + delivery;

    const order = {
        id: Date.now().toString(),
        cart: [...cart],
        address,
        payment,
        subtotal,
        gst,
        delivery,
        total,
        status: 'pending',
        assignedPartner: null
    };

    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    alert(`Order placed successfully!\nDelivery Address: ${address}\nPayment Method: ${payment}\nSubtotal: ₹${subtotal.toFixed(2)}\nGST: ₹${gst.toFixed(2)}\nDelivery Charge: ₹${delivery.toFixed(2)}\nTotal: ₹${total.toFixed(2)}\nWaiting for a delivery partner to accept.`);
    cart = [];
    localStorage.removeItem('cart');
    updateCartSummary();
    displayCart();
    displayOrders();
}

function submitEnrollment() {
    console.log('submitEnrollment called'); // Debug log
    const name = document.getElementById('name')?.value;
    const email = document.getElementById('email')?.value;
    const phone = document.getElementById('phone')?.value;
    const aadhaar = document.getElementById('aadhaar')?.value;
    const pan = document.getElementById('pan')?.value;
    const vehicle = document.getElementById('vehicle')?.value;
    const city = document.getElementById('city')?.value;
    const terms = document.getElementById('terms')?.checked;

    if (!name || !email || !phone || !aadhaar || !pan || !vehicle || !city || !terms) {
        alert('Please fill all required fields and agree to the terms.');
        console.error('Form validation failed', { name, email, phone, aadhaar, pan, vehicle, city, terms });
        return;
    }

    const partnerId = generatePartnerId();
    const partner = { id: partnerId, name, email, phone, aadhaar, pan, vehicle, city };
    partners.push(partner);
    localStorage.setItem('partners', JSON.stringify(partners));
    alert(`Application submitted successfully!\nYour Partner ID is: ${partnerId}\nPlease note this ID to use in the Partner Dashboard.`);
    document.getElementById('enrollment-form').reset();
}

function displayOrders() {
    const ordersDiv = document.getElementById('orders');
    const partnerId = document.getElementById('partnerIdInput')?.value;

    if (!ordersDiv) return;

    ordersDiv.innerHTML = '';
    orders.forEach(order => {
        if (order.status === 'pending') {
            const orderDiv = document.createElement('div');
            orderDiv.className = 'order';
            orderDiv.id = `order-${order.id}`;
            orderDiv.innerHTML = `
                <p>Order ID: ${order.id}</p>
                <p>Address: ${order.address}</p>
                <p>Subtotal: ₹${order.subtotal.toFixed(2)}</p>
                <p>GST: ₹${order.gst.toFixed(2)}</p>
                <p>Delivery Charge: ₹${order.delivery.toFixed(2)}</p>
                <p>Total: ₹${order.total.toFixed(2)}</p>
                <p>Items: ${order.cart.map(item => `${item.item} (₹${item.price.toFixed(2)})`).join(', ')}</p>
                <button class="accept" onclick="acceptOrder('${order.id}')">Accept</button>
                <button class="reject" onclick="rejectOrder('${order.id}')">Reject</button>
            `;
            ordersDiv.appendChild(orderDiv);
        } else if (order.status === 'accepted' && order.assignedPartner === partnerId) {
            const orderDiv = document.createElement('div');
            orderDiv.className = 'order';
            orderDiv.id = `order-${order.id}`;
            orderDiv.innerHTML = `<p>Order ${order.id} accepted by you!</p>`;
            ordersDiv.appendChild(orderDiv);
        }
    });
}

function acceptOrder(orderId) {
    const partnerId = document.getElementById('partnerIdInput')?.value;
    if (!partnerId) {
        alert('Please enter your Partner ID');
        return;
    }

    const order = orders.find(o => o.id === orderId);
    if (order && order.status === 'pending') {
        order.status = 'accepted';
        order.assignedPartner = partnerId;
        localStorage.setItem('orders', JSON.stringify(orders));
        alert(`Order ${orderId} accepted by ${partnerId}!`);
        displayOrders();
    }
}

function rejectOrder(orderId) {
    alert(`Order ${orderId} rejected`);
}

window.onload = function() {
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    orders = JSON.parse(localStorage.getItem('orders')) || [];
    partners = JSON.parse(localStorage.getItem('partners')) || [];

    if (document.getElementById('cart-items')) {
        displayCart();
    }
    updateCartSummary();
    displayOrders();

    window.addEventListener('storage', (event) => {
        if (event.key === 'orders') {
            orders = JSON.parse(event.newValue) || [];
            displayOrders();
        }
        if (event.key === 'cart') {
            cart = JSON.parse(event.newValue) || [];
            updateCartSummary();
            displayCart();
        }
    });
};